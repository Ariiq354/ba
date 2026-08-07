<script setup lang="ts">
defineProps<{
  disabled?: boolean;
}>();

const nuxtApp = useNuxtApp();
const { data, status } = useLazyFetch("/api/v1/kelompok", {
  key: "kelompok-options",
  transform: data =>
    data.map(item => ({
      label: `${item.kodeKelompok} - ${item.namaKelompok}`,
      value: item.id,
    })),
  getCachedData: (key) => {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
  },
});

const selectedKelompok = defineModel<number>();
</script>

<template>
  <USelectMenu
    v-model="selectedKelompok"
    :items="data ?? []"
    label-key="label"
    value-key="value"
    :disabled="disabled || status === 'pending'"
    :loading="status === 'pending'"
    :search-input="false"
    placeholder="Pilih Kelompok"
  />
</template>
