<script setup lang="ts">
const props = defineProps<{
  idProvinsi?: string;
  disabled?: boolean;
}>();

const selectedKota = defineModel<string>();

const nuxtApp = useNuxtApp();
const { data, status, execute } = useLazyFetch("/api/v1/wilayah/kota", {
  key: computed(() => `kota-options-${props.idProvinsi ?? ""}`),
  query: { idProvinsi: computed(() => props.idProvinsi) },
  immediate: Boolean(props.idProvinsi),
  watch: false,
  getCachedData: (key) => {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
  },
});

watch(
  () => props.idProvinsi,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      selectedKota.value = undefined;
      if (newVal) {
        execute();
      }
    }
  },
);
</script>

<template>
  <USelectMenu
    v-model="selectedKota"
    :items="data ?? []"
    label-key="kota"
    value-key="id"
    :disabled="disabled || !idProvinsi || status === 'pending'"
    :loading="status === 'pending'"
    placeholder="Pilih Kota / Kabupaten"
  />
</template>
