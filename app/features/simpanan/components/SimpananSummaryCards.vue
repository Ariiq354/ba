<script setup lang="ts">
import type { SaldoResponse } from "../model";

defineProps<{
  saldo?: SaldoResponse | null;
  loading?: boolean;
}>();

function formatRupiah(val?: number) {
  if (val === undefined || val === null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
    <!-- Saldo Tabungan Card -->
    <UCard class="border border-gray-200 dark:border-gray-800 relative overflow-hidden">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Saldo Tabungan Berjangka
          </p>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            <USkeleton v-if="loading" class="h-8 w-36" />
            <span v-else>{{ formatRupiah(saldo?.saldoTabungan) }}</span>
          </h2>
        </div>
        <div class="p-3 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 rounded-xl">
          <UIcon name="i-tabler-wallet" class="w-6 h-6" />
        </div>
      </div>
    </UCard>

    <!-- Effective Saldo Card -->
    <UCard class="border border-gray-200 dark:border-gray-800 relative overflow-hidden">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Saldo Efektif (Penarikan)
          </p>
          <h2 class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            <USkeleton v-if="loading" class="h-8 w-36" />
            <span v-else>{{ formatRupiah(saldo?.effectiveSaldo) }}</span>
          </h2>
          <p v-if="saldo && saldo.sumPendingPenarikan > 0" class="text-xs text-amber-600 dark:text-amber-400 mt-1">
            Pending Penarikan: {{ formatRupiah(saldo.sumPendingPenarikan) }}
          </p>
        </div>
        <div class="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <UIcon name="i-tabler-cash-banknote" class="w-6 h-6" />
        </div>
      </div>
    </UCard>

    <!-- Saldo Saham Card -->
    <UCard class="border border-gray-200 dark:border-gray-800 relative overflow-hidden">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Saldo Saham (Equity)
          </p>
          <h2 class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            <USkeleton v-if="loading" class="h-8 w-36" />
            <span v-else>{{ formatRupiah(saldo?.saldoSaham) }}</span>
          </h2>
        </div>
        <div class="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
          <UIcon name="i-tabler-chart-pie" class="w-6 h-6" />
        </div>
      </div>
    </UCard>
  </div>
</template>
