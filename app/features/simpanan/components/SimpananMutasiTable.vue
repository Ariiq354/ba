<script setup lang="ts">
import type { MutasiItem } from "../model";
import { formatDateShort, formatRupiah } from "~/utils/formatter";
import { simpananMutasiColumns } from "../model";

defineProps<{
  data?: MutasiItem[];
  loading?: boolean;
  total?: number;
  limit?: number;
}>();

const emit = defineEmits<{
  delete: [id: number, kode: string];
}>();

const page = defineModel<number>("page", { default: 1 });
</script>

<template>
  <div class="space-y-4">
    <UTable
      :data="data || []"
      :columns="simpananMutasiColumns"
      :loading="loading"
      class="w-full text-sm"
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
            @click="emit('delete', row.original.id, row.original.kodeTransaksi)"
          >
            Batal
          </UButton>
        </div>
        <span v-else class="text-xs text-gray-400">-</span>
      </template>
    </UTable>

    <!-- Pagination Bar -->
    <div v-if="total && total > (limit || 10)" class="flex justify-end pt-2">
      <UPagination
        v-model:page="page"
        :total="total"
        :items-per-page="limit || 10"
      />
    </div>
  </div>
</template>
