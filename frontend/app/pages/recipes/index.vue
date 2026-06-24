<template>
  <div />
</template>

<script setup lang="ts">
const auth = useMealieAuth();
const router = useRouter();
const groupSlug = computed(() => auth.user.value?.groupSlug);

onMounted(() => {
  // Resolve the logged-in user's group and land on its recipe explorer
  if (groupSlug.value) {
    router.replace(`/g/${groupSlug.value}`);
  }
  else {
    router.replace("/login");
  }
});
</script>
