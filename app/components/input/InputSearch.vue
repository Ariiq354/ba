<script setup lang="ts">
const searchModel = defineModel<string>();

const searchDebounced = useDebounceFn((v) => {
  searchModel.value = v;
}, 500);
</script>

<template>
  <UInput
    :model-value="searchModel"
    class="flex-5"
    leading-icon="i-tabler-search"
    placeholder="Cari..."
    @update:model-value="searchDebounced"
  />
</template>
