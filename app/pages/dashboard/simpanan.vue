<script setup lang="ts">
import SimpananContainer from "~/features/simpanan/SimpananContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Simpanan & Penarikan",
    },
  },
});

useHead({
  title: "Simpanan & Penarikan · Berkah Amanah",
});
</script>

<template>
  <SimpananContainer />
</template>
