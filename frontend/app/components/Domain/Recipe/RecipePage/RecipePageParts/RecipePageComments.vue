<template>
  <div>
    <v-card-title class="headline pb-3">
      <v-icon class="mr-2">
        {{ $globals.icons.commentTextMultipleOutline }}
      </v-icon>
      {{ $t("recipe.comments") }}
    </v-card-title>
    <v-divider class="mx-2" />
    <div
      v-if="user.id"
      class="d-flex flex-column"
    >
      <div
        class="d-flex mt-3"
        style="gap: 10px"
      >
        <UserAvatar
          :tooltip="false"
          size="40"
          :user-id="user.id"
        />

        <v-textarea
          v-model="comment"
          hide-details
          density="compact"
          single-line
          variant="outlined"
          auto-grow
          rows="2"
          :placeholder="$t('recipe.join-the-conversation')"
        />
      </div>
      <div class="ml-auto mt-1">
        <BaseButton
          size="small"
          :disabled="!comment"
          @click="submitComment"
        >
          <template #icon>
            {{ $globals.icons.check }}
          </template>
          {{ $t("general.submit") }}
        </BaseButton>
      </div>
    </div>
    <div
      v-for="recipeComment in recipe.comments"
      :key="recipeComment.id"
      class="d-flex my-2"
      style="gap: 10px"
    >
      <UserAvatar
        :tooltip="false"
        size="40"
        :user-id="recipeComment.userId"
      />
      <v-card
        variant="outlined"
        class="flex-grow-1"
      >
        <v-card-text class="pa-3 pb-0">
          <p class="">
            {{ recipeComment.user.fullName }} • {{ $d(Date.parse(recipeComment.createdAt), "medium") }}
          </p>
          <v-textarea
            v-if="editingId === recipeComment.id"
            v-model="editedText"
            hide-details
            density="compact"
            single-line
            variant="outlined"
            auto-grow
            rows="2"
            autofocus
          />
          <SafeMarkdown
            v-else
            :source="recipeComment.text"
          />
        </v-card-text>
        <v-card-actions class="justify-end mt-0 pt-0">
          <template v-if="editingId === recipeComment.id">
            <v-btn
              variant="text"
              size="x-small"
              @click="cancelEdit"
            >
              {{ $t("general.cancel") }}
            </v-btn>
            <v-btn
              color="primary"
              variant="text"
              size="x-small"
              :disabled="!editedText"
              @click="saveEdit(recipeComment)"
            >
              {{ $t("general.save") }}
            </v-btn>
          </template>
          <template v-else>
            <v-btn
              v-if="user.id == recipeComment.user.id"
              variant="text"
              size="x-small"
              @click="startEdit(recipeComment)"
            >
              {{ $t("general.edit") }}
            </v-btn>
            <v-btn
              v-if="user.id == recipeComment.user.id || user.admin"
              color="error"
              variant="text"
              size="x-small"
              @click="deleteComment(recipeComment.id)"
            >
              {{ $t("general.delete") }}
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserApi } from "~/composables/api";
import type { Recipe } from "~/lib/api/types/recipe";
import UserAvatar from "~/components/Domain/User/UserAvatar.vue";
import type { NoUndefinedField } from "~/lib/api/types/non-generated";
import { usePageUser } from "~/composables/recipe-page/shared-state";
import SafeMarkdown from "~/components/global/SafeMarkdown.vue";

const recipe = defineModel<NoUndefinedField<Recipe>>({ required: true });
const api = useUserApi();
const { user } = usePageUser();
const comment = ref("");

const editingId = ref<string | null>(null);
const editedText = ref("");

// Prefill the inline editor with the comment's current text whenever an editor
// is opened, so the user starts from what's already there rather than a blank box.
watch(
  () => editingId.value !== null,
  (isOpen) => {
    if (isOpen) {
      const target = recipe.value.comments.find(c => c.id === editingId.value);
      editedText.value = target?.text ?? "";
    }
  },
);

function startEdit(recipeComment: NoUndefinedField<Recipe>["comments"][number]) {
  editingId.value = recipeComment.id;
}

function cancelEdit() {
  editingId.value = null;
}

async function saveEdit(recipeComment: NoUndefinedField<Recipe>["comments"][number]) {
  const text = editedText.value.trim();
  if (!text) {
    return;
  }

  const { response } = await api.recipes.comments.updateOne(recipeComment.id, {
    id: recipeComment.id,
    text,
  });

  if (response?.status === 200) {
    const idx = recipe.value.comments.findIndex(c => c.id === recipeComment.id);
    if (idx !== -1) {
      recipe.value.comments[idx]!.text = text;
    }
    editingId.value = null;
  }
}

async function submitComment() {
  const { data } = await api.recipes.comments.createOne({
    recipeId: recipe.value.id,
    text: comment.value,
  });

  if (data) {
    recipe.value.comments.push(data);
  }

  comment.value = "";
}

async function deleteComment(id: string) {
  const { response } = await api.recipes.comments.deleteOne(id);

  if (response?.status === 200) {
    recipe.value.comments = recipe.value.comments.filter(comment => comment.id !== id);
  }
}
</script>
