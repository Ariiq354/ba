<script setup lang="ts">
import { ref } from "vue";
import { AreaChart } from "vue-chrts";

// Year Filter Options
const selectedYear = ref("2026");
const yearOptions = [
  { label: "Tahun 2026", value: "2026" },
  { label: "Tahun 2025", value: "2025" },
  { label: "Tahun 2024", value: "2024" },
];

// Helper: Short IDR Currency Formatter for Axis Ticks
function formatRupiahShort(value: number | Date): string {
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num))
    return "0";

  if (num >= 1_000_000_000) {
    return `Rp ${(num / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  }
  if (num >= 1_000_000) {
    return `Rp ${(num / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Jt`;
  }
  if (num >= 1_000) {
    return `Rp ${(num / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} Rb`;
  }
  return `Rp ${num.toLocaleString("id-ID")}`;
}

// Helper: Full IDR Currency Formatter
function formatRupiahFull(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

// Personal KPI Summary Cards Dummy Data
const kpiCards: Array<{
  id: string;
  title: string;
  value: number;
  formattedValue: string;
  change: string;
  isPositive: boolean;
  description: string;
  icon: string;
  badgeColor: "success" | "error" | "info" | "primary" | "secondary" | "warning" | "neutral";
}> = [
  {
    id: "simpanan",
    title: "Total Simpanan",
    value: 45250000,
    formattedValue: "Rp 45.250.000",
    change: "+12.4%",
    isPositive: true,
    description: "vs bulan lalu",
    icon: "tabler:wallet",
    badgeColor: "success",
  },
  {
    id: "saham",
    title: "Total Saham & Equity",
    value: 15000000,
    formattedValue: "Rp 15.000.000",
    change: "+5.0%",
    isPositive: true,
    description: "Simpanan Pokok & Wajib",
    icon: "tabler:chart-donut-4",
    badgeColor: "info",
  },
  {
    id: "pembiayaan",
    title: "Pembiayaan Aktif",
    value: 28500000,
    formattedValue: "Rp 28.500.000",
    change: "-2.1%",
    isPositive: true, // paid down is positive for loans
    description: "Sisa pokok pembiayaan",
    icon: "tabler:file-text",
    badgeColor: "primary",
  },
  {
    id: "laba",
    title: "Estimasi Bagi Hasil (Laba)",
    value: 3850000,
    formattedValue: "Rp 3.850.000",
    change: "+18.2%",
    isPositive: true,
    description: "Akumulasi YTD 2026",
    icon: "tabler:trending-up",
    badgeColor: "success",
  },
];

// Dummy Data 1: Pertumbuhan Laba (Monthly)
const labaChartData = [
  { month: "Jan", laba: 180000 },
  { month: "Feb", laba: 210000 },
  { month: "Mar", laba: 245000 },
  { month: "Apr", laba: 230000 },
  { month: "Mei", laba: 290000 },
  { month: "Jun", laba: 320000 },
  { month: "Jul", laba: 350000 },
  { month: "Agu", laba: 385000 },
  { month: "Sep", laba: 410000 },
  { month: "Okt", laba: 450000 },
  { month: "Nov", laba: 480000 },
  { month: "Des", laba: 520000 },
];

const labaCategories = {
  laba: {
    name: "Pertumbuhan Laba (Rp)",
    color: "#10b981", // emerald-500
  },
};

function labaXFormatter(tick: number | Date) {
  const index = Math.round(Number(tick));
  return labaChartData[index]?.month || "";
}

// Dummy Data 2: Pertumbuhan Pembiayaan (Monthly)
const pembiayaanChartData = [
  { month: "Jan", pembiayaan: 12000000 },
  { month: "Feb", pembiayaan: 14500000 },
  { month: "Mar", pembiayaan: 14000000 },
  { month: "Apr", pembiayaan: 18000000 },
  { month: "Mei", pembiayaan: 21500000 },
  { month: "Jun", pembiayaan: 20000000 },
  { month: "Jul", pembiayaan: 24000000 },
  { month: "Agu", pembiayaan: 26500000 },
  { month: "Sep", pembiayaan: 28500000 },
  { month: "Okt", pembiayaan: 31000000 },
  { month: "Nov", pembiayaan: 33500000 },
  { month: "Des", pembiayaan: 35000000 },
];

const pembiayaanCategories = {
  pembiayaan: {
    name: "Pertumbuhan Pembiayaan (Rp)",
    color: "#3b82f6", // blue-500
  },
};

function pembiayaanXFormatter(tick: number | Date) {
  const index = Math.round(Number(tick));
  return pembiayaanChartData[index]?.month || "";
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Dashboard Keuangan
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Ringkasan portofolio simpanan, pembiayaan, dan tren pertumbuhan laba Anda.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <USelect
          v-model="selectedYear"
          :items="yearOptions"
          value-attribute="value"
          option-attribute="label"
          class="w-40"
        />
        <UButton
          icon="tabler:reload"
          color="neutral"
          variant="outline"
          aria-label="Refresh Data"
        />
      </div>
    </div>

    <!-- Personal KPI Summary Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard
        v-for="card in kpiCards"
        :key="card.id"
        class="relative overflow-hidden transition-all duration-200 hover:shadow-md border border-gray-200 dark:border-gray-800"
      >
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {{ card.title }}
            </span>
            <div class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {{ card.formattedValue }}
            </div>
          </div>

          <div
            class="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 flex items-center justify-center"
          >
            <UIcon :name="card.icon" class="w-5 h-5" />
          </div>
        </div>

        <div class="mt-4 flex items-center gap-2 text-xs">
          <UBadge
            :color="card.badgeColor"
            variant="subtle"
            size="xs"
            class="font-semibold"
          >
            {{ card.change }}
          </UBadge>
          <span class="text-gray-500 dark:text-gray-400 truncate">
            {{ card.description }}
          </span>
        </div>
      </UCard>
    </div>

    <!-- Growth Charts Grid (Side-by-Side Area Charts) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Chart 1: Pertumbuhan Laba -->
      <UCard class="border border-gray-200 dark:border-gray-800">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon name="tabler:trending-up" class="w-5 h-5 text-emerald-500" />
                Pertumbuhan Laba
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Tren hasil bagi hasil kumulatif bulanan
              </p>
            </div>
            <UBadge color="success" variant="soft" size="sm">
              +18.2% YTD
            </UBadge>
          </div>
        </template>

        <div class="pt-2 pb-1">
          <ClientOnly>
            <AreaChart
              :data="labaChartData"
              :categories="labaCategories"
              :height="280"
              :x-formatter="labaXFormatter"
              :y-formatter="formatRupiahShort"
              :x-num-ticks="labaChartData.length"
              :gradient-stops="[
                { offset: '0%', stopOpacity: 0.4 },
                { offset: '100%', stopOpacity: 0.02 },
              ]"
              :line-width="2.5"
              :x-grid-line="false"
              :y-grid-line="true"
            />
            <template #fallback>
              <USkeleton class="h-70 w-full rounded-lg" />
            </template>
          </ClientOnly>
        </div>

        <template #footer>
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Rata-rata bulanan: <strong class="text-gray-700 dark:text-gray-200">{{ formatRupiahFull(325000) }}</strong></span>
            <span>Total YTD: <strong class="text-emerald-600 dark:text-emerald-400 font-semibold">{{ formatRupiahFull(3850000) }}</strong></span>
          </div>
        </template>
      </UCard>

      <!-- Chart 2: Pertumbuhan Pembiayaan -->
      <UCard class="border border-gray-200 dark:border-gray-800">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon name="tabler:chart-line" class="w-5 h-5 text-blue-500" />
                Pertumbuhan Pembiayaan
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Akumulasi nilai portofolio pembiayaan bulanan
              </p>
            </div>
            <UBadge color="primary" variant="soft" size="sm">
              +191.6% YTD
            </UBadge>
          </div>
        </template>

        <div class="pt-2 pb-1">
          <ClientOnly>
            <AreaChart
              :data="pembiayaanChartData"
              :categories="pembiayaanCategories"
              :height="280"
              :x-formatter="pembiayaanXFormatter"
              :y-formatter="formatRupiahShort"
              :x-num-ticks="pembiayaanChartData.length"
              :gradient-stops="[
                { offset: '0%', stopOpacity: 0.4 },
                { offset: '100%', stopOpacity: 0.02 },
              ]"
              :line-width="2.5"
              :x-grid-line="false"
              :y-grid-line="true"
            />
            <template #fallback>
              <USkeleton class="h-70 w-full rounded-lg" />
            </template>
          </ClientOnly>
        </div>

        <template #footer>
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Pencairan tertinggi: <strong class="text-gray-700 dark:text-gray-200">{{ formatRupiahFull(35000000) }}</strong></span>
            <span>Total Aktif: <strong class="text-blue-600 dark:text-blue-400 font-semibold">{{ formatRupiahFull(28500000) }}</strong></span>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>
