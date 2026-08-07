<script setup lang="ts">
const props = defineProps<{
  idKecamatan?: string;
  disabled?: boolean;
}>();

const selectedKelurahan = defineModel<string>();

const nuxtApp = useNuxtApp();
const { data, status, execute } = useLazyFetch("/api/v1/wilayah/kelurahan", {
  key: computed(() => `kelurahan-options-${props.idKecamatan ?? ""}`),
  query: { idKecamatan: computed(() => props.idKecamatan) },
  immediate: Boolean(props.idKecamatan),
  watch: false,
  getCachedData: (key) => {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
  },
});

watch(
  () => props.idKecamatan,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      selectedKelurahan.value = undefined;
      if (newVal) {
        execute();
      }
    }
  },
);
</script>

<template>
  <USelectMenu
    v-model="selectedKelurahan"
    :items="data ?? []"
    label-key="kelurahan"
    value-key="id"
    :disabled="disabled || !idKecamatan || status === 'pending'"
    :loading="status === 'pending'"
    placeholder="Pilih Desa / Kelurahan"
  />
</template>
