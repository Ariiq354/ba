<script setup lang="ts">
import MasterMarginContainer from "~/features/master-margin/MasterMarginContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Master Margin",
    },
  },
});
</script>

<template>
  <MasterMarginContainer />
</template>
