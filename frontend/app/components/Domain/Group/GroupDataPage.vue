<template>
  <!-- Create Dialog -->
  <BaseDialog
    v-model="createDialog"
    :title="createTitle || $t('general.create')"
    :icon="icon"
    color="primary"
    max-width="600px"
    width="100%"
    :submit-disabled="!createFormValid"
    can-confirm
    @confirm="emit('create-one', createForm.data)"
  >
    <div class="mx-2 mt-2">
      <slot name="create-dialog-top" />
      <AutoForm
        v-model="createForm.data"
        v-model:is-valid="createFormValid"
        :items="createForm.items"
        class="py-2"
      />
    </div>
  </BaseDialog>

  <!-- Edit Dialog -->
  <BaseDialog
    v-model="editDialog"
    :title="editTitle || $t('general.edit')"
    :icon="icon"
    color="primary"
    max-width="600px"
    width="100%"
    :submit-disabled="!editFormValid"
    can-confirm
    @confirm="emit('edit-one', editForm.data)"
  >
    <div class="mx-2 mt-2">
      <slot name="edit-dialog-top" />
      <AutoForm
        v-model="editForm.data"
        v-model:is-valid="editFormValid"
        :items="editForm.items"
        class="py-2"
      />
    </div>
    <template #custom-card-action>
      <slot name="edit-dialog-custom-action" />
    </template>
  </BaseDialog>

  <!-- Delete Dialog -->
  <BaseDialog
    v-model="deleteDialog"
    :title="$t('general.confirm')"
    :icon="$globals.icons.alertCircle"
    color="error"
    can-confirm
    @confirm="$emit('deleteOne', deleteTarget.id)"
  >
    <v-card-text>
      {{ $t("general.confirm-delete-generic") }}
      <p v-if="deleteTarget" class="mt-4 mb-0 font-weight-bold">
        {{ deleteTarget.name || deleteTarget.title || deleteTarget.id }}
      </p>
      <slot name="delete-dialog-bottom" />
    </v-card-text>
  </BaseDialog>

  <!-- Bulk Delete Dialog -->
  <BaseDialog
    v-model="bulkDeleteDialog"
    width="650px"
    :title="$t('general.confirm')"
    :icon="$globals.icons.alertCircle"
    color="error"
    can-confirm
    :submit-disabled="bulkDeleteRunning"
    :keep-open="bulkDeleteRunning || bulkHasFailures"
    data-testid="bulk-delete-dialog"
    @confirm="runBulkDelete"
  >
    <v-card-text>
      <p class="h4">
        {{ $t('general.confirm-delete-generic-items') }}
      </p>
      <p
        class="mt-1 mb-2 font-weight-medium"
        data-testid="bulk-rollup-header"
      >
        {{ bulkSucceededCount }} of {{ bulkDeleteTarget.length }} succeeded
      </p>
      <v-card variant="outlined">
        <v-virtual-scroll height="400" item-height="25" :items="bulkDeleteTarget">
          <template #default="{ item }">
            <v-list-item
              class="pb-2"
              :data-testid="`bulk-delete-row-${item.id}`"
              :data-state="bulkItemState[item.id] || 'pending'"
            >
              <v-list-item-title>{{ item.name || item.title || item.id }}</v-list-item-title>
              <template #append>
                <v-icon
                  v-if="bulkItemState[item.id] === 'saved'"
                  color="success"
                >
                  {{ $globals.icons.check }}
                </v-icon>
                <BaseButton
                  v-else-if="bulkItemState[item.id] === 'error'"
                  small
                  color="error"
                  :data-testid="`bulk-delete-retry-${item.id}`"
                  @click="retryBulkItem(item)"
                >
                  {{ $t('general.retry') }}
                </BaseButton>
              </template>
            </v-list-item>
          </template>
        </v-virtual-scroll>
      </v-card>
      <slot name="delete-dialog-bottom" />
    </v-card-text>
  </BaseDialog>

  <BaseCardSectionTitle
    :icon="icon"
    section
    :title="title"
  />

  <CrudTable
    :headers="tableHeaders"
    :table-config="tableConfig"
    :data="data || []"
    :bulk-actions="bulkActions"
    :initial-sort="initialSort"
    @edit-one="editEventHandler"
    @delete-one="deleteEventHandler"
    @bulk-action="handleBulkAction"
  >
    <template
      v-for="slotName in itemSlotNames"
      #[slotName]="slotProps"
    >
      <slot
        :name="slotName"
        v-bind="slotProps"
      />
    </template>
    <template #button-row>
      <BaseButton
        create
        @click="createDialog = true"
      >
        {{ $t("general.create") }}
      </BaseButton>
      <slot name="table-button-row" />
    </template>
    <template #button-bottom>
      <slot name="table-button-bottom" />
    </template>
  </CrudTable>
</template>

<script setup lang="ts">
import type { TableHeaders, TableConfig, BulkAction } from "~/components/global/CrudTable.vue";
import type { AutoFormItems } from "~/types/auto-forms";

const slots = useSlots();

export interface BulkDeleteRunner {
  // Called once per item as it settles, and once at the end with the full tally.
  onItemSettled: (id: string | number, ok: boolean) => void;
  onComplete: (tally: { succeeded: (string | number)[]; failed: (string | number)[]; total: number }) => void;
}

const emit = defineEmits<{
  (e: "deleteOne", id: string): void;
  (e: "deleteMany", ids: string[]): void;
  (e: "create-one" | "edit-one", data: any): void;
  (e: "bulk-action", event: string, items: any[], runner?: BulkDeleteRunner): void;
}>();

const tableHeaders = defineModel<TableHeaders[]>("tableHeaders", { required: true });
const createForm = defineModel<{ items: AutoFormItems; data: Record<string, any> }>("createForm", { required: true });
const createDialog = defineModel("createDialog", { type: Boolean, default: false });

const editForm = defineModel<{ items: AutoFormItems; data: Record<string, any> }>("editForm", { required: true });
const editDialog = defineModel("editDialog", { type: Boolean, default: false });

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  createTitle: {
    type: String,
  },
  editTitle: {
    type: String,
  },
  tableConfig: {
    type: Object as PropType<TableConfig>,
    default: () => ({
      hideColumns: false,
      canExport: true,
    }),
  },
  data: {
    type: Array as PropType<Array<any>>,
    required: true,
  },
  bulkActions: {
    type: Array as PropType<BulkAction[]>,
    required: true,
  },
  initialSort: {
    type: String,
    default: "name",
  },
  onDeleteDialogOpen: {
    type: Function as PropType<(items: any[]) => Promise<void>>,
    default: null,
  },
});

// ============================================================
// Bulk Action Handler
function handleBulkAction(event: string, items: any[]) {
  if (event === "delete-selected") {
    bulkDeleteEventHandler(items);
    return;
  }
  emit("bulk-action", event, items);
}

// ============================================================
// Create & Edit
const createFormValid = ref(false);
const editFormValid = ref(false);
const itemSlotNames = computed(() => Object.keys(slots).filter(slotName => slotName.startsWith("item.")));
const editEventHandler = (item: any) => {
  editForm.value.data = { ...item };
  editDialog.value = true;
};

// ============================================================
// Delete Logic
const deleteTarget = ref<any>(null);
const deleteDialog = ref(false);

async function deleteEventHandler(item: any) {
  deleteTarget.value = item;
  if (props.onDeleteDialogOpen) {
    await props.onDeleteDialogOpen([item]);
  }
  deleteDialog.value = true;
}

// ============================================================
// Bulk Delete Logic
const bulkDeleteTarget = ref<Array<any>>([]);
const bulkDeleteDialog = ref(false);

// Per-item outcome rollup: each row tracks pending | saving | saved | error.
const bulkItemState = ref<Record<string | number, "pending" | "saving" | "saved" | "error">>({});
const bulkDeleteRunning = ref(false);

const bulkSucceededCount = computed(() =>
  Object.values(bulkItemState.value).filter(s => s === "saved").length,
);
const bulkHasFailures = computed(() =>
  Object.values(bulkItemState.value).some(s => s === "error"),
);

function resetBulkRollup(items: Array<any>) {
  const next: Record<string | number, "pending"> = {};
  for (const item of items) {
    next[item.id] = "pending";
  }
  bulkItemState.value = next;
}

async function bulkDeleteEventHandler(items: Array<any>) {
  bulkDeleteTarget.value = items;
  resetBulkRollup(items);
  bulkDeleteRunning.value = false;
  if (props.onDeleteDialogOpen) {
    await props.onDeleteDialogOpen(items);
  }
  bulkDeleteDialog.value = true;
}

function buildRunner(): BulkDeleteRunner {
  return {
    onItemSettled: (id, ok) => {
      bulkItemState.value = { ...bulkItemState.value, [id]: ok ? "saved" : "error" };
    },
    onComplete: (tally) => {
      bulkDeleteRunning.value = false;
      // Drop the rows that succeeded; keep failed rows selected for retry.
      const failedIds = new Set(tally.failed);
      bulkDeleteTarget.value = bulkDeleteTarget.value.filter(item => failedIds.has(item.id));
      if (!bulkDeleteTarget.value.length) {
        bulkDeleteDialog.value = false;
      }
    },
  };
}

function runBulkDelete() {
  if (bulkDeleteRunning.value) {
    return;
  }
  bulkDeleteRunning.value = true;
  for (const item of bulkDeleteTarget.value) {
    if (bulkItemState.value[item.id] !== "saved") {
      bulkItemState.value = { ...bulkItemState.value, [item.id]: "saving" };
    }
  }
  emit("bulk-action", "delete-selected", bulkDeleteTarget.value, buildRunner());
}

function retryBulkItem(item: any) {
  if (bulkDeleteRunning.value) {
    return;
  }
  bulkDeleteRunning.value = true;
  bulkItemState.value = { ...bulkItemState.value, [item.id]: "saving" };
  emit("bulk-action", "delete-selected", [item], buildRunner());
}
</script>
