<script setup lang="ts">
import JurnalContainer from "~/features/jurnal/JurnalContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Jurnal Transaksi",
    },
  },
});

useHead({
  title: "Jurnal Transaksi · Berkah Amanah",
});
</script>

<template>
  <JurnalContainer />
</template>
