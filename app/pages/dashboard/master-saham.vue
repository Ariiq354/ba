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
</script>

<template>
  <MasterSahamContainer />
</template>
