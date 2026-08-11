<script setup lang="ts">
import UserListContainer from "~/features/users/UserListContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Manajemen Anggota",
    },
  },
});

useHead({
  title: "Manajemen Anggota · Berkah Amanah",
});
</script>

<template>
  <UserListContainer />
</template>
