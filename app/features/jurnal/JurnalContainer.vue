<script setup lang="ts">
import type { FlatJurnalRow } from "./model";
import InputSearch from "~/components/input/InputSearch.vue";
import ModalConfirmDelete from "~/components/modal/ModalConfirmDelete.vue";
import { openModal } from "~/composables/modal";
import JurnalTable from "./components/JurnalTable.vue";
import ModalJurnalForm from "./components/ModalJurnalForm.vue";

const page = ref(1);
const search = ref("");

const queryParams = computed(() => ({
  page: page.value,
  limit: 10,
  search: search.value || undefined,
}));

const { data, pending, refresh } = await useFetch("/api/v1/jurnal", {
  query: queryParams,
});

watch(search, () => {
  page.value = 1;
});

function handleCreate() {
  openModal(ModalJurnalForm, {
    refresh,
  });
}

function handleDelete(headerId: number, kodeTransaksi: string) {
  openModal(ModalConfirmDelete, {
    path: "/api/v1/jurnal",
    body: { ids: [headerId] },
    refresh,
    title: "Hapus Transaksi Jurnal",
    description: `Apakah Anda yakin ingin menghapus transaksi jurnal ${kodeTransaksi}?`,
  });
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Jurnal Transaksi
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Kelola data jurnal umum, pencatatan debit & kredit berpasangan.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          icon="i-tabler-plus"
          color="primary"
          @click="handleCreate"
        >
          Tambah Transaksi
        </UButton>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
      <div class="w-full sm:w-80">
        <InputSearch v-model="search" placeholder="Cari Kode Transaksi..." />
      </div>
    </div>

    <!-- Data Table Container -->
    <UCard class="border border-gray-200 dark:border-gray-800">
      <JurnalTable
        v-model:page="page"
        :data="data?.items"
        :loading="pending"
        :total="data?.total"
        :total-headers="data?.totalHeaders"
        :limit="data?.limit"
        @delete="handleDelete"
      />
    </UCard>
  </div>
</template>
