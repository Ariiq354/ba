<script setup lang="ts">
defineProps<{
  disabled?: boolean;
}>();

const { data, status, refresh } = useLazyFetch("/api/v1/kelompok", {
  key: "kelompok-options",
  cache: "default",
  transform: data =>
    data.map(item => ({
      label: `${item.kodeKelompok} - ${item.namaKelompok}`,
      value: item.id,
    })),
});

const selectedKelompok = defineModel<number>();

const isLoading = computed(() => status.value === "pending");
const isError = computed(() => status.value === "error");
</script>

<template>
  <USelectMenu
    v-model="selectedKelompok"
    :items="data ?? []"
    label-key="label"
    value-key="value"
    :disabled="disabled || isLoading"
    :loading="isLoading"
    :search-input="false"
    :placeholder="isError ? 'Gagal memuat. Klik untuk coba lagi' : 'Pilih Kelompok'"
    @click="isError && refresh()"
  />
</template>
