<script setup lang="ts">
import RegisterContainer from "~/features/auth/RegisterContainer.vue";

definePageMeta({
  layout: "auth",
});
useHead({
  title: "Daftar · Berkah Amanah",
});
</script>

<template>
  <RegisterContainer />
</template>
