<script setup lang="ts">
import DataTable from "~/components/table/DataTable.vue";
import { openModal } from "~/composables/modal";
import ModalCreateSaham from "./components/ModalCreateSaham.vue";
import { sahamColumns } from "./model";

const page = ref(1);

const { data, pending, refresh } = await useFetch("/api/v1/master/saham", {
  query: { page },
});

function handleCreate() {
  openModal(ModalCreateSaham, {
    refresh,
  });
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Master Saham
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Riwayat pencatatan harga nominal dan harga jual saham ekuitas anggota.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          icon="i-tabler-plus"
          color="primary"
          @click="handleCreate"
        >
          Tambah Harga Saham
        </UButton>
      </div>
    </div>

    <!-- Data Table Container -->
    <UCard class="border border-gray-200 dark:border-gray-800">
      <DataTable
        v-model:page="page"
        :data="data?.data"
        :columns="sahamColumns"
        :loading="pending"
        :total="data?.total ?? 0"
        enumerate
        pagination
      />
    </UCard>
  </div>
</template>
