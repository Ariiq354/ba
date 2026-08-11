<script setup lang="ts">
import MasterSahamContainer from "~/features/master-saham/MasterSahamContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Master Saham",
    },
  },
});

useHead({
  title: "Master Saham · Berkah Amanah",
});
</script>

<template>
  <MasterSahamContainer />
</template>
