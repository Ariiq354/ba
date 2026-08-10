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
    { label: "Master Margin", to: "/dashboard/master-margin", icon: "i-tabler-percentage" },
    { label: "Master Saham", to: "/dashboard/master-saham", icon: "i-tabler-chart-candle" },
  ],
]);
</script>

<template>
  <UNavigationMenu
    orientation="vertical"
    :items="items"
  />
</template>
