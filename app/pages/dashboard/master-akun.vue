<script setup lang="ts">
import MasterAkunContainer from "~/features/master-akun/MasterAkunContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Daftar Akun",
    },
  },
});

useHead({
  title: "Daftar Akun · Berkah Amanah",
});
</script>

<template>
  <MasterAkunContainer />
</template>
