<script setup lang="ts">
import type { MarginItem } from "./model";
import ModalConfirmDelete from "~/components/modal/ModalConfirmDelete.vue";
import DataTable from "~/components/table/DataTable.vue";
import { openModal } from "~/composables/modal";
import ModalMarginForm from "./components/ModalMarginForm.vue";
import { marginColumns } from "./model";

const page = ref(1);

const { data, pending, refresh } = await useFetch("/api/v1/master/margin", {
  query: { page },
});

function handleCreate() {
  openModal(ModalMarginForm, {
    refresh,
  });
}

function handleEdit(item: MarginItem) {
  openModal(ModalMarginForm, {
    item,
    refresh,
  });
}

function handleDelete(ids: number[]) {
  openModal(ModalConfirmDelete, {
    path: "/api/v1/master/margin",
    body: { ids },
    refresh,
    title: "Hapus Master Margin",
    description: `Apakah Anda yakin ingin menghapus ${ids.length} data master margin yang dipilih?`,
  });
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Master Margin
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pengaturan tiering margin pembiayaan, persentase tahunan, dan biaya akad.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          icon="i-tabler-plus"
          color="primary"
          @click="handleCreate"
        >
          Tambah Margin
        </UButton>
      </div>
    </div>

    <!-- Data Table Container -->
    <UCard class="border border-gray-200 dark:border-gray-800">
      <DataTable
        v-model:page="page"
        :data="data?.items"
        :columns="marginColumns"
        :loading="pending"
        :total="data?.total ?? 0"
        editable
        deletable
        selectable
        enumerate
        pagination
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </UCard>
  </div>
</template>
