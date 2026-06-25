import type { Composer } from "vue-i18n";
import { useData, useStore } from "../partials/use-store-factory";
import type { MultiPurposeLabelOut } from "~/lib/api/types/labels";
import { useUserApi } from "~/composables/api";

const labelItems: Ref<MultiPurposeLabelOut[]> = ref([]);
const isFetching = ref(false);
const isHydrated = ref(false);

export function resetLabelStore() {
  labelItems.value = [];
  isFetching.value = false;
  isHydrated.value = false;
}

export const useLabelData = function () {
  return useData<MultiPurposeLabelOut>({
    groupId: "",
    id: "",
    name: "",
    color: "",
  });
};

export const useLabelStore = function (i18n?: Composer) {
  const api = useUserApi(i18n);
  return useStore<MultiPurposeLabelOut>("label", labelItems, isFetching, isHydrated, api.multiPurposeLabels);
};
