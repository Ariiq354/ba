<script setup lang="ts">
import type { UserItem } from "./model";
import InputSearch from "~/components/input/InputSearch.vue";
import ModalConfirmDelete from "~/components/modal/ModalConfirmDelete.vue";
import DataTable from "~/components/table/DataTable.vue";
import { openModal } from "~/composables/modal";
import { getUserColumns, statusOptions } from "./model";

const page = ref(1);
const search = ref("");
const status = ref("all");

const queryParams = computed(() => ({
  page: page.value,
  limit: 10,
  search: search.value || undefined,
  status: status.value,
}));

const { data, pending, refresh } = await useFetch("/api/v1/user", {
  query: queryParams,
});

watch([search, status], () => {
  page.value = 1;
});

function handleVerify(user: UserItem) {
  openModal(ModalConfirmDelete, {
    path: "/api/v1/user/verify",
    method: "POST",
    body: { userId: user.id },
    refresh,
    title: "Verifikasi Akun Anggota",
    description: `Apakah Anda yakin ingin memverifikasi akun "${user.name}"? Nomor anggota baru akan dibuat secara otomatis.`,
    confirmText: "Verifikasi",
    confirmColor: "primary",
  });
}

function handleSetPj(user: UserItem, isPj: boolean) {
  openModal(ModalConfirmDelete, {
    path: "/api/v1/user/pj",
    method: "POST",
    body: { userId: user.id, isPj },
    refresh,
    title: isPj ? "Tetapkan Penanggung Jawab" : "Cabut Penanggung Jawab",
    description: isPj
      ? `Apakah Anda yakin ingin menjadikan "${user.name}" sebagai Penanggung Jawab${user.namaKelompok ? ` untuk kelompok "${user.namaKelompok}"` : ""}?`
      : `Apakah Anda yakin ingin mencabut status Penanggung Jawab dari "${user.name}"?`,
    confirmText: isPj ? "Tetapkan PJ" : "Cabut PJ",
    confirmColor: isPj ? "primary" : "warning",
  });
}

const columns = computed(() => getUserColumns(handleVerify, handleSetPj));
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Manajemen Anggota
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Kelola daftar anggota koperasi dan proses verifikasi akun pengguna baru.
        </p>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
      <div class="w-full sm:w-80">
        <InputSearch v-model="search" placeholder="Cari nama, email, no. anggota..." />
      </div>

      <div class="flex items-center gap-2">
        <USelect
          v-model="status"
          :items="statusOptions"
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
        :data="data?.items"
        :columns="columns"
        :loading="pending"
        :total="data?.total ?? 0"
        enumerate
        pagination
      />
    </UCard>
  </div>
</template>
