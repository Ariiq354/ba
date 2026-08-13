<script setup lang="ts">
import ApprovalSimpananContainer from "~/features/simpanan/ApprovalSimpananContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Approval Mutasi Simpanan",
    },
  },
});

useHead({
  title: "Approval Mutasi Simpanan · Berkah Amanah",
});
</script>

<template>
  <ApprovalSimpananContainer />
</template>
