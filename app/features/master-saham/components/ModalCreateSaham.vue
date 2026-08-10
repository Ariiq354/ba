<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { SahamFormSchema } from "../model";
import { useToastError, useToastSuccess } from "~/composables/toast";
import { sahamSchema } from "../model";

const props = defineProps<{
  refresh?: () => void;
}>();

const emit = defineEmits<{ close: [] }>();

const state = ref<Partial<SahamFormSchema>>({
  hargaNominal: undefined,
  hargaJual: undefined,
});

const isLoading = ref(false);

async function onSubmit(event: FormSubmitEvent<SahamFormSchema>) {
  isLoading.value = true;

  try {
    await $fetch("/api/v1/master/saham", {
      method: "POST",
      body: event.data,
    });
    useToastSuccess("Berhasil", "Data harga saham baru berhasil ditambahkan");
    props.refresh?.();
    emit("close");
  }
  catch (error: any) {
    useToastError("Gagal", error?.data?.message || "Terjadi kesalahan saat menyimpan data.");
  }
  finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UModal
    title="Tambah Price Point Saham Baru"
    description="Masukkan harga nominal dan harga jual saham terbaru. Perubahan harga akan dicatat sebagai entri historis baru."
  >
    <template #body>
      <UForm
        id="form-saham"
        :schema="sahamSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="space-y-4">
          <UFormField label="Harga Nominal Saham (Rp)" name="hargaNominal">
            <UInput
              v-model="state.hargaNominal"
              type="number"
              min="0"
              placeholder="100000"
              class="w-full"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="Harga Jual Saham (Rp)" name="hargaJual">
            <UInput
              v-model="state.hargaJual"
              type="number"
              min="0"
              placeholder="105000"
              class="w-full"
              :disabled="isLoading"
            />
          </UFormField>
        </div>
      </UForm>
    </template>
    <template #footer>
      <UButton
        icon="i-tabler-x"
        variant="ghost"
        color="neutral"
        :disabled="isLoading"
        @click="emit('close')"
      >
        Batal
      </UButton>
      <UButton
        type="submit"
        form="form-saham"
        icon="i-tabler-check"
        :loading="isLoading"
      >
        Simpan
      </UButton>
    </template>
  </UModal>
</template>
