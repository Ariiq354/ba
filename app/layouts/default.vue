<script setup lang="ts">
import DashboardSidebar from "~/components/dashboard/DashboardSidebar.vue";

defineProps<{
  title?: string;
}>();
</script>

<template>
  <UDashboardGroup>
    <DashboardSidebar />

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar :title="title">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
        </udashboardnavbar>
      </template>
      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
