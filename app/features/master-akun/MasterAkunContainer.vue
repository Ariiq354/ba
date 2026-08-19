<script setup lang="ts">
import type { AkunItem } from "./model";
import InputSearch from "~/components/input/InputSearch.vue";
import ModalConfirmDelete from "~/components/modal/ModalConfirmDelete.vue";
import DataTable from "~/components/table/DataTable.vue";
import { openModal } from "~/composables/modal";
import ModalAkunForm from "./components/ModalAkunForm.vue";
import { akunColumns, kategoriFilterOptions } from "./model";

const page = ref(1);
const search = ref("");
const kategori = ref("all");

const queryParams = computed(() => ({
  page: page.value,
  limit: 10,
  search: search.value || undefined,
  kategori: kategori.value,
}));

const { data, pending, refresh } = await useFetch("/api/v1/master/akun", {
  query: queryParams,
});

watch([search, kategori], () => {
  page.value = 1;
});

function handleCreate() {
  openModal(ModalAkunForm, {
    refresh,
  });
}

function handleEdit(item: AkunItem) {
  openModal(ModalAkunForm, {
    item,
    refresh,
  });
}

function handleDelete(ids: number[]) {
  openModal(ModalConfirmDelete, {
    path: "/api/v1/master/akun",
    body: { ids },
    refresh,
    title: "Hapus Master Akun",
    description: `Apakah Anda yakin ingin menghapus ${ids.length} akun perkiraan yang dipilih?`,
  });
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Daftar Akun
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Kelola master daftar akun perkiraan keuangan, kategori, dan posisi normal balance.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          icon="i-tabler-plus"
          color="primary"
          @click="handleCreate"
        >
          Tambah Akun
        </UButton>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
      <div class="w-full sm:w-80">
        <InputSearch v-model="search" placeholder="Cari kode or nama akun..." />
      </div>

      <div class="flex items-center gap-2">
        <USelect
          v-model="kategori"
          :items="kategoriFilterOptions"
          value-attribute="value"
          option-attribute="label"
          class="w-48"
        />
      </div>
    </div>

    <!-- Data Table Container -->
    <UCard class="border border-gray-200 dark:border-gray-800">
      <DataTable
        v-model:page="page"
        :data="data?.data"
        :columns="akunColumns"
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
