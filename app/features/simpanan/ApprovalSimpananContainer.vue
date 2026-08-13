<script setup lang="ts">
import DataTable from "~/components/table/DataTable.vue";
import { openModal } from "~/composables/modal";
import { useToastError, useToastSuccess } from "~/composables/toast";
import { formatDateShort, formatRupiah } from "~/utils/formatter";
import ModalRejectMutasi from "./components/ModalRejectMutasi.vue";
import { approvalMutasiColumns } from "./model";

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
      <DataTable
        v-model:page="page"
        :data="mutasiData?.items"
        :columns="approvalMutasiColumns"
        :loading="loadingMutasi || isApproving"
        :total="mutasiData?.total ?? 0"
        pagination
      >
        <!-- Kode Transaksi Column -->
        <template #kodeTransaksi-cell="{ row }">
          <span class="font-mono font-semibold text-gray-900 dark:text-white">
            {{ row.original.kodeTransaksi }}
          </span>
        </template>

        <!-- User Column -->
        <template #userName-cell="{ row }">
          <div>
            <div class="font-medium text-gray-900 dark:text-white">
              {{ row.original.userName || `User #${row.original.userId}` }}
            </div>
            <div class="text-[11px] text-gray-500">
              ID: {{ row.original.userId }}
            </div>
          </div>
        </template>

        <!-- Tanggal Column -->
        <template #tanggalTransaksi-cell="{ row }">
          <span class="text-xs text-gray-600 dark:text-gray-400">
            {{ formatDateShort(row.original.tanggalTransaksi) }}
          </span>
        </template>

        <!-- Jenis Column -->
        <template #jenisTransaksi-cell="{ row }">
          <UBadge
            v-if="row.original.keterangan?.includes('[SAHAM]') || row.original.agioSaham > 0"
            color="info"
            variant="subtle"
            size="sm"
          >
            Setor Saham
          </UBadge>
          <UBadge
            v-else-if="row.original.jenisTransaksi === 'setoran'"
            color="primary"
            variant="subtle"
            size="sm"
          >
            Setoran Tabungan
          </UBadge>
          <UBadge
            v-else
            color="neutral"
            variant="subtle"
            size="sm"
          >
            Penarikan Tabungan
          </UBadge>
        </template>

        <!-- Pembayaran Column -->
        <template #namaAkun-cell="{ row }">
          <span class="text-xs text-gray-700 dark:text-gray-300">
            {{ row.original.namaAkun || `Akun #${row.original.akunId}` }}
          </span>
        </template>

        <!-- Nominal Column -->
        <template #nilaiTransaksi-cell="{ row }">
          <div class="text-right font-medium">
            <div class="text-gray-900 dark:text-white">
              {{ formatRupiah(row.original.nilaiTransaksi) }}
            </div>
            <div v-if="row.original.agioSaham > 0" class="text-[11px] text-blue-600 dark:text-blue-400">
              + Agio: {{ formatRupiah(row.original.agioSaham) }}
            </div>
          </div>
        </template>

        <!-- Status Column -->
        <template #statusApproved-cell="{ row }">
          <div>
            <UBadge
              v-if="row.original.statusApproved === 'pending'"
              color="warning"
              variant="solid"
              size="sm"
            >
              Pending
            </UBadge>
            <UBadge
              v-else-if="row.original.statusApproved === 'approved'"
              color="success"
              variant="solid"
              size="sm"
            >
              Approved
            </UBadge>
            <UBadge
              v-else
              color="error"
              variant="solid"
              size="sm"
            >
              Rejected
            </UBadge>
            <p v-if="row.original.statusApproved === 'rejected' && row.original.alasanPenolakan" class="text-[11px] text-red-500 mt-1 max-w-xs">
              Alasan: {{ row.original.alasanPenolakan }}
            </p>
          </div>
        </template>

        <!-- Keterangan Column -->
        <template #keterangan-cell="{ row }">
          <span class="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate block">
            {{ row.original.keterangan || '-' }}
          </span>
        </template>

        <!-- Actions Column -->
        <template #actions-cell="{ row }">
          <div v-if="row.original.statusApproved === 'pending'" class="flex items-center gap-2">
            <UButton
              icon="i-tabler-check"
              color="success"
              variant="soft"
              size="xs"
              @click="handleApprove(row.original.id, row.original.kodeTransaksi)"
            >
              Approve
            </UButton>
            <UButton
              icon="i-tabler-x"
              color="error"
              variant="ghost"
              size="xs"
              @click="handleReject(row.original.id, row.original.kodeTransaksi)"
            >
              Reject
            </UButton>
          </div>
          <span v-else class="text-xs text-gray-400">Selesai</span>
        </template>
      </DataTable>
    </UCard>
  </div>
</template>
