<script setup lang="ts">
import { openModal } from "~/composables/modal";
import { useToastError, useToastSuccess } from "~/composables/toast";
import ApprovalMutasiTable from "./components/ApprovalMutasiTable.vue";
import ModalRejectMutasi from "./components/ModalRejectMutasi.vue";

const page = ref(1);
const search = ref("");
const statusFilter = ref<string | undefined>("pending"); // Default to pending for admin queue

const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Semua Status", value: "" },
];

const queryParams = computed(() => ({
  page: page.value,
  limit: 10,
  search: search.value || undefined,
  status: statusFilter.value || undefined,
}));

const { data: mutasiData, pending: loadingMutasi, refresh } = await useFetch("/api/v1/simpanan/admin/mutasi", {
  query: queryParams,
});

watch([search, statusFilter], () => {
  page.value = 1;
});

const isApproving = ref(false);

async function handleApprove(id: number, kodeTransaksi: string) {
  if (isApproving.value)
    return;

  // eslint-disable-next-line no-alert
  if (!confirm(`Apakah Anda yakin ingin menyetujui (Approve) transaksi ${kodeTransaksi}? Saldo user dan Jurnal akan langsung diperbarui.`)) {
    return;
  }

  isApproving.value = true;
  try {
    await $fetch(`/api/v1/simpanan/admin/approve/${id}`, {
      method: "POST",
    });
    useToastSuccess("Berhasil Disetujui", `Transaksi ${kodeTransaksi} berhasil di-approve dan jurnal telah diposting.`);
    refresh();
  }
  catch (error: any) {
    useToastError(
      "Gagal Menyetujui",
      error?.data?.statusMessage || error?.data?.message || "Terjadi kesalahan saat menyetujui transaksi.",
    );
  }
  finally {
    isApproving.value = false;
  }
}

function handleReject(id: number, kodeTransaksi: string) {
  openModal(ModalRejectMutasi, {
    mutasiId: id,
    kodeTransaksi,
    refresh,
  });
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Approval Mutasi Simpanan
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Verifikasi pengajuan simpanan berjangka, penarikan, dan setor saham dari anggota.
        </p>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <!-- Status Tabs / Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          v-for="opt in statusOptions"
          :key="opt.value"
          :color="statusFilter === opt.value ? 'primary' : 'neutral'"
          :variant="statusFilter === opt.value ? 'solid' : 'ghost'"
          size="xs"
          @click="statusFilter = opt.value"
        >
          {{ opt.label }}
        </UButton>
      </div>

      <!-- Search Input -->
      <div class="w-full sm:w-72">
        <UInput
          v-model="search"
          icon="i-tabler-search"
          placeholder="Cari kode transaksi / anggota..."
          class="w-full"
        />
      </div>
    </div>

    <!-- Approval Data Table Container -->
    <UCard class="border border-gray-200 dark:border-gray-800">
      <ApprovalMutasiTable
        v-model:page="page"
        :data="mutasiData?.items"
        :loading="loadingMutasi || isApproving"
        :total="mutasiData?.total"
        :limit="mutasiData?.limit"
        @approve="handleApprove"
        @reject="handleReject"
      />
    </UCard>
  </div>
</template>
