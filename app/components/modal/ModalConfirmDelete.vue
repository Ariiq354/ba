<script lang="ts" setup>
import { useToastError, useToastSuccess } from "~/composables/toast";

const props = withDefaults(
  defineProps<{
    path?: string;
    body?: object;
    refresh?: () => void;
    title?: string;
    description?: string;
    method?: "DELETE" | "PATCH" | "POST" | "PUT";
    confirmText?: string;
    cancelText?: string;
    confirmColor?: "error" | "primary" | "secondary" | "success" | "warning" | "info" | "neutral";
    onConfirm?: () => Promise<void> | void;
  }>(),
  {
    title: "Konfirmasi",
    description: "Apakah Anda yakin ingin menghapus item yang dipilih?",
    method: "DELETE",
    confirmText: "Ya",
    cancelText: "Tidak",
    confirmColor: "error",
  },
);

const emit = defineEmits(["close"]);

const loading = ref(false);
async function onClick() {
  loading.value = true;
  try {
    if (props.onConfirm) {
      await props.onConfirm();
    }
    else if (props.path) {
      await $fetch(`${props.path}`, {
        method: props.method,
        body: props.body,
        credentials: "include",
      });
      useToastSuccess(props.method === "DELETE" ? "Berhasil Hapus Data" : "Berhasil Memproses Data");
    }
    props.refresh?.();
    emit("close", false);
  }
  catch (error: any) {
    useToastError("Gagal Memproses", error?.data?.message || "Terjadi kesalahan.");
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal
    :close="{ onClick: () => emit('close', false) }"
    :ui="{ body: 'sm:max-w-lg' }"
    :title="title"
  >
    <template #body>
      <div class="space-y-5">
        <div class="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-200">
          <UIcon
            :name="confirmColor === 'error' ? 'i-tabler-alert-triangle' : 'i-tabler-help-circle'"
            size="36"
            :class="confirmColor === 'error' ? 'text-red-500' : 'text-primary'"
            class="shrink-0"
          />
          <div>
            {{ description }}
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <UButton
        icon="i-tabler-x"
        :disabled="loading"
        class="text-base"
        variant="ghost"
        color="neutral"
        @click="emit('close')"
      >
        {{ cancelText }}
      </UButton>
      <UButton
        icon="i-tabler-check"
        :loading="loading"
        :color="confirmColor"
        class="text-base"
        @click="onClick"
      >
        {{ confirmText }}
      </UButton>
    </template>
  </UModal>
</template>
