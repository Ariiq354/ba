<script setup lang="ts">
import type { CalendarDate } from "@internationalized/date";
import { DateFormatter, getLocalTimeZone } from "@internationalized/date";

defineProps<{
  disabled?: boolean;
}>();

const df = new DateFormatter("id-ID", {
  dateStyle: "long",
});

const tanggal = defineModel<CalendarDate>();
</script>

<template>
  <UPopover>
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-calendar"
      :label="tanggal ? df.format(tanggal.toDate(getLocalTimeZone())) : 'Pilih Tanggal'"
      :disabled="disabled"
      class="w-full justify-start"
    />

    <template #content>
      <UCalendar v-model="tanggal" class="p-2" locale="id-ID" />
    </template>
  </UPopover>
</template>
