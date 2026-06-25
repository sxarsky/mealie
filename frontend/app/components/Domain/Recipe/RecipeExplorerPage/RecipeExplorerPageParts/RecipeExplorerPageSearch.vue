<template>
  <div class="search-container pb-8">
    <v-card
      class="explorer-search-card pa-2"
      flat
    >
      <RecipeExplorerPageSearchInput
        v-model="state.search"
        @submit="search"
      />
      <v-toolbar
        class="explorer-search-toolbar"
        color="transparent"
        flat
      >
        <RecipeExplorerPageSearchFilters />
        <v-spacer />
        <RecipeExplorerPageSortMenu
          :order-by="state.orderBy"
          :order-direction="state.orderDirection"
          :sort-text="sortText"
          :sortable="sortable"
          :show-random-loading="showRandomLoading"
          @toggle-order-direction="toggleOrderDirection"
          @set-order-by="setOrderBy"
          @set-random-order-by="setRandomOrderByWrapper"
        />
        <RecipeExplorerPageSettingsMenu
          v-model:auto="state.auto"
          @reset="reset"
        />
      </v-toolbar>
      <v-btn
        v-if="!state.auto"
        class="explorer-search-submit"
        size="x-large"
        color="primary"
        block
        @click="search"
      >
        <v-icon start>
          {{ $globals.icons.search }}
        </v-icon>
        {{ $t("search.search") }}
      </v-btn>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import RecipeExplorerPageSearchFilters from "./RecipeExplorerPageSearchFilters.vue";
import RecipeExplorerPageSearchInput from "./RecipeExplorerPageSearchInput.vue";
import RecipeExplorerPageSortMenu from "./RecipeExplorerPageSortMenu.vue";
import RecipeExplorerPageSettingsMenu from "./RecipeExplorerPageSettingsMenu.vue";
import { useRecipeExplorerSearch, clearRecipeExplorerSearchState } from "~/composables/use-recipe-explorer-search";

const emit = defineEmits<{
  ready: [];
}>();

const auth = useMealieAuth();
const route = useRoute();
const { $globals } = useNuxtApp();
const i18n = useI18n();
const showRandomLoading = ref(false);

const groupSlug = computed(() => route.params.groupSlug as string || auth.user.value?.groupSlug || "");

const {
  state,
  passedQueryWithSeed,
  search,
  reset,
  toggleOrderDirection,
  setOrderBy,
  setRandomOrderBy,
  filterItems,
  initialize,
} = useRecipeExplorerSearch(groupSlug);

defineExpose({
  passedQueryWithSeed,
  filterItems,
});

onMounted(async () => {
  await initialize();
  emit("ready");
});

onUnmounted(() => {
  // Clear the cache when component unmounts to ensure fresh state on remount
  clearRecipeExplorerSearchState(groupSlug.value);
});

const sortText = computed(() => {
  const sort = sortable.value.find(s => s.value === state.value.orderBy);
  if (!sort) return "";
  return `${sort.name}`;
});

const sortable = computed(() => [
  {
    icon: $globals.icons.orderAlphabeticalAscending,
    name: i18n.t("general.sort-alphabetically"),
    value: "name",
  },
  {
    icon: $globals.icons.newBox,
    name: i18n.t("general.created"),
    value: "created_at",
  },
  {
    icon: $globals.icons.chefHat,
    name: i18n.t("general.last-made"),
    value: "last_made",
  },
  {
    icon: $globals.icons.star,
    name: i18n.t("general.rating"),
    value: "rating",
  },
  {
    icon: $globals.icons.update,
    name: i18n.t("general.updated"),
    value: "updated_at",
  },
  {
    icon: $globals.icons.diceMultiple,
    name: i18n.t("general.random"),
    value: "random",
  },
]);

// Methods
const input: Ref<any> = ref(null);

function hideKeyboard() {
  input.value?.blur();
}

// function to show refresh icon
async function setRandomOrderByWrapper() {
  if (!showRandomLoading.value) {
    showRandomLoading.value = true;
  }
  await setRandomOrderBy();
}
</script>

<style scoped>
.explorer-search-toolbar {
  margin-top: 1rem;
}

.search-container {
  display: flex;
  justify-content: center;
}

.explorer-search-card {
  width: 950px;
}

.explorer-search-submit {
  margin: 3rem auto 0 auto;
  max-width: 500px;
}
</style>
