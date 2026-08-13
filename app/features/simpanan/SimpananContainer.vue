<script setup lang="ts">
import ModalConfirmDelete from "~/components/modal/ModalConfirmDelete.vue";
import DataTable from "~/components/table/DataTable.vue";
import { openModal } from "~/composables/modal";
import { formatDateShort, formatRupiah } from "~/utils/formatter";
import ModalPenarikanForm from "./components/ModalPenarikanForm.vue";
import ModalSetoranForm from "./components/ModalSetoranForm.vue";
import ModalSetorSahamForm from "./components/ModalSetorSahamForm.vue";
import SimpananSummaryCards from "./components/SimpananSummaryCards.vue";
import { simpananMutasiColumns } from "./model";

const page = ref(1);
const search = ref("");
const statusFilter = ref<string | undefined>(undefined);

const queryParams = computed(() => ({
  page: page.value,
  limit: 10,
  search: search.value || undefined,
  status: statusFilter.value || undefined,
}));

// Fetch Saldo Info
const { data: saldoData, pending: loadingSaldo, refresh: refreshSaldo } = await useFetch("/api/v1/simpanan/saldo");

// Fetch Mutasi List
const { data: mutasiData, pending: loadingMutasi, refresh: refreshMutasi } = await useFetch("/api/v1/simpanan/mutasi", {
  query: queryParams,
});

watch([search, statusFilter], () => {
  page.value = 1;
});

function refreshAll() {
  refreshSaldo();
  refreshMutasi();
}

function handleOpenSetoran() {
  openModal(ModalSetoranForm, {
    refresh: refreshAll,
  });
}

function handleOpenPenarikan() {
  openModal(ModalPenarikanForm, {
    effectiveSaldo: saldoData.value?.effectiveSaldo ?? 0,
    refresh: refreshAll,
  });
}

function handleOpenSetorSaham() {
  openModal(ModalSetorSahamForm, {
    refresh: refreshAll,
  });
}

function handleDeleteMutasi(id: number, kodeTransaksi: string) {
  openModal(ModalConfirmDelete, {
    path: `/api/v1/simpanan/mutasi/${id}`,
    refresh: refreshAll,
    title: "Batalkan Pengajuan",
    description: `Apakah Anda yakin ingin membatalkan dan menghapus pengajuan transaksi ${kodeTransaksi}?`,
  });
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Simpanan & Penarikan
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Kelola tabungan berjangka, penarikan dana, dan setor modal saham.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-3">
        <UButton
          icon="i-tabler-plus"
          color="primary"
          @click="handleOpenSetoran"
        >
          Setor Tabungan
        </UButton>
        <UButton
          icon="i-tabler-minus"
          color="neutral"
          variant="outline"
          @click="handleOpenPenarikan"
        >
          Tarik Tabungan
        </UButton>
        <UButton
          icon="i-tabler-chart-pie"
          color="info"
          variant="soft"
          @click="handleOpenSetorSaham"
        >
          Setor Saham
        </UButton>
      </div>
    </div>

    <!-- Summary KPI Cards -->
    <SimpananSummaryCards :saldo="saldoData" :loading="loadingSaldo" />

    <!-- History Header & Search Toolbar -->
    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            Riwayat Mutasi & Pengajuan
          </h2>
          <p class="text-xs text-gray-500">
            Daftar pengajuan setoran, penarikan, dan saham milik Anda.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <UInput
            v-model="search"
            icon="i-tabler-search"
            placeholder="Cari kode transaksi..."
            class="w-60"
          />
        </div>
      </div>

      <!-- Mutasi Table -->
      <UCard class="border border-gray-200 dark:border-gray-800">
        <DataTable
          v-model:page="page"
          :data="mutasiData?.items"
          :columns="simpananMutasiColumns"
          :loading="loadingMutasi"
          :total="mutasiData?.total ?? 0"
          pagination
        >
          <!-- Kode Transaksi Column -->
          <template #kodeTransaksi-cell="{ row }">
            <span class="font-mono font-semibold text-gray-900 dark:text-white">
              {{ row.original.kodeTransaksi }}
            </span>
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
            <div v-if="row.original.statusApproved === 'pending'">
              <UButton
                icon="i-tabler-trash"
                color="error"
                variant="ghost"
                size="xs"
                title="Batalkan / Hapus Pengajuan"
                @click="handleDeleteMutasi(row.original.id, row.original.kodeTransaksi)"
              >
                Batal
              </UButton>
            </div>
            <span v-else class="text-xs text-gray-400">-</span>
          </template>
        </DataTable>
      </UCard>
    </div>
  </div>
</template>
