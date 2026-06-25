import type { AsyncData, NuxtError } from "#app";
import type { BoundT } from "./types";
import type { BaseCRUDAPI, BaseCRUDAPIReadOnly } from "~/lib/api/base/base-clients";
import type { QueryValue } from "~/lib/api/base/route";

interface ReadOnlyStoreActions<T extends BoundT> {
  getAll(page?: number, perPage?: number, params?: any): AsyncData<T[] | null, NuxtError<unknown> | null>;
  refresh(page?: number, perPage?: number, params?: any): Promise<void>;
}

export interface BulkDeleteTally {
  succeeded: (string | number)[];
  failed: (string | number)[];
  total: number;
}

interface StoreActions<T extends BoundT> extends ReadOnlyStoreActions<T> {
  createOne(createData: T): Promise<T | null>;
  updateOne(updateData: T): Promise<T | null>;
  deleteOne(id: string | number): Promise<T | null>;
  deleteMany(
    ids: (string | number)[],
    onItemSettled?: (id: string | number, ok: boolean) => void,
  ): Promise<BulkDeleteTally>;
}

/**
 * useReadOnlyActions is a factory function that returns a set of methods
 * that can be reused to manage the state of a data store without using
 * Vuex. This is primarily used for basic GET/GETALL operations that required
 * a lot of refreshing hooks to be called on operations
 */
export function useReadOnlyActions<T extends BoundT>(
  storeKey: string,
  api: BaseCRUDAPIReadOnly<T>,
  allRef: Ref<T[] | null> | null,
  loading: Ref<boolean>,
  initialized: Ref<boolean>,
  defaultQueryParams: Record<string, QueryValue> = {},
): ReadOnlyStoreActions<T> {
  function getAll(page = 1, perPage = -1, params = {} as Record<string, QueryValue>) {
    params = { ...defaultQueryParams, ...params };
    params.orderBy ??= "name";
    params.orderDirection ??= "asc";

    const allItems = useAsyncData(storeKey, async () => {
      loading.value = true;
      try {
        const { data } = await api.getAll(page, perPage, params);

        if (data && allRef) {
          allRef.value = data.items;
        }

        if (data) {
          return data.items ?? [];
        }
        else {
          return [];
        }
      }
      finally {
        loading.value = false;
      }
    });

    return allItems;
  }

  async function refresh(page = 1, perPage = -1, params = {} as Record<string, QueryValue>) {
    params = { ...defaultQueryParams, ...params };
    params.orderBy ??= "name";
    params.orderDirection ??= "asc";

    loading.value = true;
    const { data } = await api.getAll(page, perPage, params);

    if (data && data.items && allRef) {
      allRef.value = data.items;
    }

    initialized.value = true;
    loading.value = false;
  }

  return {
    getAll,
    refresh,
  };
}

/**
 * useStoreActions is a factory function that returns a set of methods
 * that can be reused to manage the state of a data store without using
 * Vuex. This is primarily used for basic CRUD operations that required
 * a lot of refreshing hooks to be called on operations
 */
export function useStoreActions<T extends BoundT>(
  storeKey: string,
  api: BaseCRUDAPI<unknown, T, unknown>,
  allRef: Ref<T[] | null> | null,
  loading: Ref<boolean>,
  initialized: Ref<boolean>,
  defaultQueryParams: Record<string, QueryValue> = {},
): StoreActions<T> {
  function getAll(page = 1, perPage = -1, params = {} as Record<string, QueryValue>) {
    params = { ...defaultQueryParams, ...params };
    params.orderBy ??= "name";
    params.orderDirection ??= "asc";

    const allItems = useAsyncData(storeKey, async () => {
      loading.value = true;
      try {
        const { data } = await api.getAll(page, perPage, params);

        if (data && allRef) {
          allRef.value = data.items;
        }

        if (data) {
          return data.items ?? [];
        }
        else {
          return [];
        }
      }
      finally {
        loading.value = false;
      }
    });

    return allItems;
  }

  async function refresh(page = 1, perPage = -1, params = {} as Record<string, QueryValue>) {
    params = { ...defaultQueryParams, ...params };
    params.orderBy ??= "name";
    params.orderDirection ??= "asc";

    loading.value = true;
    const { data } = await api.getAll(page, perPage, params);

    if (data && data.items && allRef) {
      allRef.value = data.items;
    }

    initialized.value = true;
    loading.value = false;
  }

  async function createOne(createData: T) {
    loading.value = true;
    const { data } = await api.createOne(createData);
    if (data && allRef?.value) {
      allRef.value.push(data);
    }
    else {
      await refresh();
    }
    loading.value = false;
    return data;
  }

  async function updateOne(updateData: T) {
    if (!updateData.id) {
      return null;
    }

    loading.value = true;
    const { data } = await api.updateOne(updateData.id, updateData);
    if (data && allRef?.value) {
      await refresh();
    }
    loading.value = false;
    return data;
  }

  async function deleteOne(id: string | number) {
    loading.value = true;
    const { response } = await api.deleteOne(id);
    if (response && allRef?.value) {
      await refresh();
    }
    loading.value = false;
    return response?.data || null;
  }

  async function deleteMany(
    ids: (string | number)[],
    onItemSettled?: (id: string | number, ok: boolean) => void,
  ): Promise<BulkDeleteTally> {
    loading.value = true;

    const succeeded: (string | number)[] = [];
    const failed: (string | number)[] = [];

    // Dispatch the per-item deletes resiliently (concurrency-capped) so a
    // single failure no longer aborts the rest of the batch.
    const concurrency = 4;
    const queue = [...ids];

    async function worker() {
      while (queue.length) {
        const id = queue.shift()!;
        try {
          const { response } = await api.deleteOne(id);
          const ok = !!response && response.status >= 200 && response.status < 300;
          if (ok) {
            succeeded.push(id);
          }
          else {
            failed.push(id);
          }
          onItemSettled?.(id, ok);
        }
        catch {
          failed.push(id);
          onItemSettled?.(id, false);
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, worker));

    if (allRef?.value) {
      await refresh();
    }
    loading.value = false;

    return { succeeded, failed, total: ids.length };
  }

  return {
    getAll,
    refresh,
    createOne,
    updateOne,
    deleteOne,
    deleteMany,
  };
}
