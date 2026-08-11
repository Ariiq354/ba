<script setup lang="ts">
import DashboardContainer from "~/features/dashboard/DashboardContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Beranda",
    },
  },
});

useHead({
  title: "Beranda · Berkah Amanah",
});
</script>

<template>
  <DashboardContainer />
</template>
