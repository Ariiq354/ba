<script setup lang="ts">
const props = defineProps<{
  idKota?: string;
  disabled?: boolean;
}>();

const selectedKecamatan = defineModel<string>();

const nuxtApp = useNuxtApp();
const { data, status, execute } = useLazyFetch("/api/v1/wilayah/kecamatan", {
  key: computed(() => `kecamatan-options-${props.idKota ?? ""}`),
  query: { idKota: computed(() => props.idKota) },
  immediate: Boolean(props.idKota),
  watch: false,
  getCachedData: (key) => {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
  },
});

watch(
  () => props.idKota,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      selectedKecamatan.value = undefined;
      if (newVal) {
        execute();
      }
    }
  },
);
</script>

<template>
  <USelectMenu
    v-model="selectedKecamatan"
    :items="data ?? []"
    label-key="kecamatan"
    value-key="id"
    :disabled="disabled || !idKota || status === 'pending'"
    :loading="status === 'pending'"
    placeholder="Pilih Kecamatan"
  />
</template>
