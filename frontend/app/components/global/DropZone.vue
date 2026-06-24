<template>
  <div
    ref="el"
    :class="isOverDropZone ? 'over' : ''"
    :data-upload-state="uploadState"
  >
    <div
      v-if="isOverDropZone"
      class="overlay"
    />
    <div
      v-if="isOverDropZone"
      class="absolute text-container"
    >
      <p class="text-center drop-text">
        {{ $t("recipe.drop-image") }}
      </p>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useDropZone } from "@vueuse/core";

type UploadState = "idle" | "uploading" | "done" | "error";

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  // Lifecycle state driven by the parent's drop handler.
  // While a file is dragged over the zone this is overridden by "dragging".
  state: {
    type: String as PropType<UploadState>,
    default: "idle",
  },
});

const emit = defineEmits(["drop"]);

const el = ref<HTMLDivElement>();

function onDrop(files: File[] | null) {
  if (files) {
    emit("drop", files);
  }
}

const { isOverDropZone } = useDropZone(el, files => onDrop(files));

const uploadState = computed(() => (isOverDropZone.value ? "dragging" : props.state));
</script>

<style lang="css">
.over {
  background-color: #f0f0f0;
}
.overlay {
  position: absolute;
  filter: blur(2px);
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.309);
}

.text-container {
  z-index: 10;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.drop-text {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
}
</style>
