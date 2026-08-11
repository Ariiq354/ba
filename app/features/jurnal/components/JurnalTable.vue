<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { FlatJurnalRow } from "../model";
import { formatRupiah, formatTanggalIndo } from "../model";

const props = defineProps<{
  data: FlatJurnalRow[] | undefined;
  loading?: boolean;
  total?: number;
  totalHeaders?: number;
  page?: number;
  limit?: number;
}>();

const emit = defineEmits<{
  (e: "edit", headerId: number, row: FlatJurnalRow): void;
  (e: "delete", headerId: number, kodeTransaksi: string): void;
  (e: "update:page", page: number): void;
}>();

const pageModel = computed({
  get: () => props.page ?? 1,
  set: (val: number) => emit("update:page", val),
});

const processedRows = computed(() => {
  const rows = props.data || [];
  const result: (FlatJurnalRow & {
    isGroupStart: boolean;
    rowspanCount: number;
    groupIndex: number;
  })[] = [];

  let currentJurnalId: number | null = null;
  let currentGroupIndex = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    if (row.jurnalId !== currentJurnalId) {
      if (currentJurnalId !== null) {
        currentGroupIndex++;
      }
      currentJurnalId = row.jurnalId;

      let count = 0;
      for (let j = i; j < rows.length; j++) {
        const checkRow = rows[j];
        if (checkRow && checkRow.jurnalId === currentJurnalId) {
          count++;
        } else {
          break;
        }
      }

      result.push({
        id: row.id,
        jurnalId: row.jurnalId,
        kodeTransaksi: row.kodeTransaksi,
        tanggalTransaksi: row.tanggalTransaksi,
        keterangan: row.keterangan,
        userId: row.userId,
        userName: row.userName,
        akunId: row.akunId,
        kodeAkun: row.kodeAkun,
        namaAkun: row.namaAkun,
        debit: row.debit,
        kredit: row.kredit,
        createdAt: row.createdAt,
        totalDetailsCount: row.totalDetailsCount,
        isGroupStart: true,
        rowspanCount: count,
        groupIndex: currentGroupIndex,
      });
    } else {
      result.push({
        id: row.id,
        jurnalId: row.jurnalId,
        kodeTransaksi: row.kodeTransaksi,
        tanggalTransaksi: row.tanggalTransaksi,
        keterangan: row.keterangan,
        userId: row.userId,
        userName: row.userName,
        akunId: row.akunId,
        kodeAkun: row.kodeAkun,
        namaAkun: row.namaAkun,
        debit: row.debit,
        kredit: row.kredit,
        createdAt: row.createdAt,
        totalDetailsCount: row.totalDetailsCount,
        isGroupStart: false,
        rowspanCount: 0,
        groupIndex: currentGroupIndex,
      });
    }
  }

  return result;
});

function getActionItems(row: FlatJurnalRow): DropdownMenuItem[] {
  return [
    {
      label: "Edit Transaksi",
      icon: "i-tabler-edit",
      onSelect() {
        emit("edit", row.jurnalId, row);
      },
    },
    { type: "separator" },
    {
      label: "Hapus Transaksi",
      icon: "i-tabler-trash",
      color: "error",
      onSelect() {
        emit("delete", row.jurnalId, row.kodeTransaksi);
      },
    },
  ];
}
</script>

<template>
  <div class="w-full space-y-4">
    <div class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-x-auto shadow-sm">
      <table class="w-full text-sm text-left border-collapse">
        <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <tr>
            <th class="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 w-32">Tanggal</th>
            <th class="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 w-40">No. Bukti / Kode</th>
            <th class="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 min-w-48">Keterangan</th>
            <th class="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 min-w-48">Akun Perkiraan</th>
            <th class="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 w-36 text-right">Debit (IDR)</th>
            <th class="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 w-36 text-right">Kredit (IDR)</th>
            <th class="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 w-32">Operator</th>
            <th class="px-3 py-3 font-semibold text-gray-700 dark:text-gray-300 w-16 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200/60 dark:divide-gray-800/60">
          <template v-if="loading">
            <tr>
              <td colspan="8" class="px-4 py-8 text-center text-gray-500">
                <UIcon name="i-tabler-loader-2" class="w-6 h-6 animate-spin inline-block mr-2" />
                Memuat data jurnal transaksi...
              </td>
            </tr>
          </template>

          <template v-else-if="!processedRows.length">
            <tr>
              <td colspan="8" class="px-4 py-12 text-center text-gray-500">
                <UIcon name="i-tabler-receipt-off" class="w-10 h-10 mx-auto text-gray-400 mb-2" />
                Belum ada data transaksi jurnal.
              </td>
            </tr>
          </template>

          <template v-else>
            <tr
              v-for="row in processedRows"
              :key="`dtl-${row.id}`"
              :class="[
                row.isGroupStart ? 'border-t-2 border-gray-300 dark:border-gray-700' : '',
                row.groupIndex % 2 === 0
                  ? 'bg-white dark:bg-gray-950 hover:bg-gray-50/60 dark:hover:bg-gray-900/40'
                  : 'bg-gray-50/40 dark:bg-gray-900/20 hover:bg-gray-100/50 dark:hover:bg-gray-900/50',
              ]"
            >
              <!-- Cell Merging Header Columns (Rowspan) -->
              <td
                v-if="row.isGroupStart"
                :rowspan="row.rowspanCount"
                class="px-4 py-3 align-top font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-800"
              >
                {{ formatTanggalIndo(row.tanggalTransaksi) }}
              </td>

              <td
                v-if="row.isGroupStart"
                :rowspan="row.rowspanCount"
                class="px-4 py-3 align-top font-mono text-xs font-semibold text-primary-600 dark:text-primary-400 border-r border-gray-200 dark:border-gray-800"
              >
                {{ row.kodeTransaksi }}
              </td>

              <td
                v-if="row.isGroupStart"
                :rowspan="row.rowspanCount"
                class="px-4 py-3 align-top text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-800 text-xs"
              >
                {{ row.keterangan || '-' }}
              </td>

              <!-- Per-detail Columns -->
              <td class="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">
                <span class="font-mono text-xs text-gray-500 mr-2">[{{ row.kodeAkun }}]</span>
                <span>{{ row.namaAkun }}</span>
              </td>

              <td class="px-4 py-2.5 text-right font-mono text-sm">
                <span v-if="row.debit > 0" class="text-gray-900 dark:text-white font-medium">
                  {{ formatRupiah(row.debit) }}
                </span>
                <span v-else class="text-gray-400 dark:text-gray-600">-</span>
              </td>

              <td class="px-4 py-2.5 text-right font-mono text-sm">
                <span v-if="row.kredit > 0" class="text-gray-900 dark:text-white font-medium">
                  {{ formatRupiah(row.kredit) }}
                </span>
                <span v-else class="text-gray-400 dark:text-gray-600">-</span>
              </td>

              <!-- Cell Merging Operator & Action Columns (Rowspan) -->
              <td
                v-if="row.isGroupStart"
                :rowspan="row.rowspanCount"
                class="px-4 py-3 align-top text-xs text-gray-500 border-l border-gray-200 dark:border-gray-800"
              >
                {{ row.userName || '-' }}
              </td>

              <td
                v-if="row.isGroupStart"
                :rowspan="row.rowspanCount"
                class="px-3 py-3 align-top text-center border-l border-gray-200 dark:border-gray-800"
              >
                <UDropdownMenu :items="getActionItems(row)">
                  <UButton
                    icon="i-tabler-dots"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="Aksi Transaksi"
                  />
                </UDropdownMenu>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <div v-if="totalHeaders && totalHeaders > 0" class="mt-4 flex items-center justify-between">
      <p class="text-xs text-gray-500 dark:text-gray-400">
        Menampilkan data dari {{ totalHeaders }} transaksi ({{ total }} detail baris)
      </p>
      <UPagination
        v-model:page="pageModel"
        :total="totalHeaders"
        :items-per-page="limit || 10"
      />
    </div>
  </div>
</template>
