<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";
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
  (e: "delete", headerId: number, kodeTransaksi: string): void;
  (e: "update:page", page: number): void;
}>();

const pageModel = computed({
  get: () => props.page ?? 1,
  set: (val: number) => emit("update:page", val),
});

export interface ProcessedFlatJurnalRow extends FlatJurnalRow {
  isGroupStart: boolean;
  rowspanCount: number;
  groupIndex: number;
}

const processedRows = computed<ProcessedFlatJurnalRow[]>(() => {
  const rows = props.data || [];
  const result: ProcessedFlatJurnalRow[] = [];

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
      label: "Hapus Transaksi",
      icon: "i-tabler-trash",
      color: "error",
      onSelect() {
        emit("delete", row.jurnalId, row.kodeTransaksi);
      },
    },
  ];
}

const columns = computed<TableColumn<ProcessedFlatJurnalRow>[]>(() => [
  {
    accessorKey: "tanggalTransaksi",
    header: "Tanggal",
    meta: {
      rowspan: {
        td: (cell: any) => (cell.row.original.isGroupStart ? cell.row.original.rowspanCount : undefined),
      },
      class: {
        td: (cell: any) =>
          cell.row.original.isGroupStart
            ? "font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-800 align-top py-3 w-32"
            : "hidden",
      },
    },
  },
  {
    accessorKey: "kodeTransaksi",
    header: "No. Bukti / Kode",
    meta: {
      rowspan: {
        td: (cell: any) => (cell.row.original.isGroupStart ? cell.row.original.rowspanCount : undefined),
      },
      class: {
        td: (cell: any) =>
          cell.row.original.isGroupStart
            ? "font-mono text-xs font-semibold text-primary-600 dark:text-primary-400 border-r border-gray-200 dark:border-gray-800 align-top py-3 w-40"
            : "hidden",
      },
    },
  },
  {
    accessorKey: "keterangan",
    header: "Keterangan",
    meta: {
      rowspan: {
        td: (cell: any) => (cell.row.original.isGroupStart ? cell.row.original.rowspanCount : undefined),
      },
      class: {
        td: (cell: any) =>
          cell.row.original.isGroupStart
            ? "text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-800 text-xs align-top py-3 min-w-48"
            : "hidden",
      },
    },
  },
  {
    accessorKey: "namaAkun",
    header: "Akun Perkiraan",
    meta: {
      class: {
        td: "font-medium text-gray-800 dark:text-gray-200 py-2.5 min-w-48",
      },
    },
  },
  {
    accessorKey: "debit",
    header: "Debit (IDR)",
    meta: {
      class: {
        th: "text-right w-36",
        td: "text-right font-mono text-sm py-2.5 w-36",
      },
    },
  },
  {
    accessorKey: "kredit",
    header: "Kredit (IDR)",
    meta: {
      class: {
        th: "text-right w-36",
        td: "text-right font-mono text-sm py-2.5 w-36",
      },
    },
  },
  {
    accessorKey: "userName",
    header: "Operator",
    meta: {
      rowspan: {
        td: (cell: any) => (cell.row.original.isGroupStart ? cell.row.original.rowspanCount : undefined),
      },
      class: {
        td: (cell: any) =>
          cell.row.original.isGroupStart
            ? "text-xs text-gray-500 border-l border-gray-200 dark:border-gray-800 align-top py-3 w-32"
            : "hidden",
      },
    },
  },
  {
    id: "actions",
    header: "Aksi",
    meta: {
      rowspan: {
        td: (cell: any) => (cell.row.original.isGroupStart ? cell.row.original.rowspanCount : undefined),
      },
      class: {
        th: "text-center w-16",
        td: (cell: any) =>
          cell.row.original.isGroupStart
            ? "text-center border-l border-gray-200 dark:border-gray-800 align-top py-3 w-16"
            : "hidden",
      },
    },
  },
]);

const tableMeta = computed(() => ({
  class: {
    tr: (row: any) =>
      [
        row.original.isGroupStart ? "border-t-2 border-gray-300 dark:border-gray-700" : "",
        row.original.groupIndex % 2 === 0
          ? "bg-white dark:bg-gray-950 hover:bg-gray-50/60 dark:hover:bg-gray-900/40"
          : "bg-gray-50/40 dark:bg-gray-900/20 hover:bg-gray-100/50 dark:hover:bg-gray-900/50",
      ]
        .filter(Boolean)
        .join(" "),
  },
}));
</script>

<template>
  <div class="w-full space-y-4">
    <UTable
      :data="processedRows"
      :columns="columns"
      :loading="loading"
      :meta="tableMeta"
      class="border-accented rounded-lg border overflow-x-auto"
      :ui="{
        th: 'text-muted font-semibold bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800',
        td: 'text-highlighted',
      }"
    >
      <!-- Custom slots for cells -->
      <template #tanggalTransaksi-cell="{ row }">
        {{ formatTanggalIndo(row.original.tanggalTransaksi) }}
      </template>

      <template #kodeTransaksi-cell="{ row }">
        {{ row.original.kodeTransaksi }}
      </template>

      <template #keterangan-cell="{ row }">
        {{ row.original.keterangan || "-" }}
      </template>

      <template #namaAkun-cell="{ row }">
        <span class="font-mono text-xs text-gray-500 mr-2">[{{ row.original.kodeAkun }}]</span>
        <span>{{ row.original.namaAkun }}</span>
      </template>

      <template #debit-cell="{ row }">
        <span v-if="row.original.debit > 0" class="text-gray-900 dark:text-white font-medium">
          {{ formatRupiah(row.original.debit) }}
        </span>
        <span v-else class="text-gray-400 dark:text-gray-600">-</span>
      </template>

      <template #kredit-cell="{ row }">
        <span v-if="row.original.kredit > 0" class="text-gray-900 dark:text-white font-medium">
          {{ formatRupiah(row.original.kredit) }}
        </span>
        <span v-else class="text-gray-400 dark:text-gray-600">-</span>
      </template>

      <template #userName-cell="{ row }">
        {{ row.original.userName || "-" }}
      </template>

      <template #actions-cell="{ row }">
        <UDropdownMenu :items="getActionItems(row.original)">
          <UButton
            icon="i-tabler-dots"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Aksi Transaksi"
          />
        </UDropdownMenu>
      </template>

      <template #empty>
        <div class="py-12 text-center text-gray-500">
          <UIcon name="i-tabler-receipt-off" class="w-10 h-10 mx-auto text-gray-400 mb-2" />
          <p>Belum ada data transaksi jurnal.</p>
        </div>
      </template>
    </UTable>

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
