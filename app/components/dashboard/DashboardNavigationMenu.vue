<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const items = ref<NavigationMenuItem[][]>([
  [
    { label: "Dashboard", type: "label" },
    { label: "Beranda", to: "/dashboard", icon: "i-tabler-layout-dashboard" },
    { label: "Simpanan Saya", to: "/dashboard/simpanan", icon: "i-tabler-wallet" },
    { label: "Pembiayaan Saya", to: "/dashboard/pembiayaan", icon: "i-tabler-file-text" },
    { label: "Bagi Hasil Usaha", to: "/dashboard/shu", icon: "i-tabler-coins" },
  ],
  [
    { label: "Master Data", type: "label" },
    { label: "Manajemen Anggota", to: "/dashboard/users", icon: "i-tabler-users" },
    { label: "Master Margin", to: "/dashboard/master-margin", icon: "i-tabler-percentage" },
    { label: "Master Saham", to: "/dashboard/master-saham", icon: "i-tabler-chart-candle" },
    { label: "Daftar Akun", to: "/dashboard/master-akun", icon: "i-tabler-book-2" },
    { label: "Jurnal Transaksi", to: "/dashboard/jurnal", icon: "i-tabler-receipt-2" },
  ],
]);
</script>

<template>
  <UNavigationMenu
    orientation="vertical"
    :items="items"
  />
</template>
