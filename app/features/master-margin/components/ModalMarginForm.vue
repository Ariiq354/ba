<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { MarginFormSchema, MarginItem } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { marginSchema } from "../model";

const props = defineProps<{
  item?: MarginItem;
  refresh?: () => void;
}>();

const emit = defineEmits<{ close: [] }>();

const isEdit = computed(() => !!props.item);

const state = ref<Partial<MarginFormSchema>>({
  minNominal: props.item?.minNominal ?? 0,
  maxNominal: props.item?.maxNominal ?? 0,
  persenMarginTahun: props.item?.persenMarginTahun ?? 0,
  jaminan: props.item?.jaminan ?? "TIDAK_ADA",
  biayaAkad: props.item?.biayaAkad ?? 0,
});

const jaminanOptions = [
  { label: "Tidak Ada Jaminan", value: "TIDAK_ADA" },
  { label: "Ada Jaminan", value: "ADA" },
];

const isLoading = ref(false);

async function onSubmit(event: FormSubmitEvent<MarginFormSchema>) {
  isLoading.value = true;

  try {
    if (isEdit.value && props.item) {
      await $fetch(`/api/v1/master/margin/${props.item.id}`, {
        method: "PUT",
        body: event.data,
      });
      useToastSuccess("Berhasil", "Data master margin berhasil diperbarui");
    }
    else {
      await $fetch("/api/v1/master/margin", {
        method: "POST",
        body: event.data,
      });
      useToastSuccess("Berhasil", "Data master margin berhasil ditambahkan");
    }
    props.refresh?.();
    emit("close");
  }
  catch (error: unknown) {
    useToastError("Gagal", extractErrorMessage(error, "Terjadi kesalahan saat menyimpan data."));
  }
  finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UModal
    :title="isEdit ? 'Edit Master Margin' : 'Tambah Master Margin'"
    :description="isEdit ? 'Ubah parameter skema margin dan biaya akad.' : 'Tambahkan skema tiering margin baru untuk pembiayaan.'"
  >
    <template #body>
      <UForm
        id="form-margin"
        :schema="marginSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Minimal Nominal (Rp)" name="minNominal">
            <UInput
              v-model="state.minNominal"
              type="number"
              min="0"
              placeholder="0"
              class="w-full"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="Maksimal Nominal (Rp)" name="maxNominal">
            <UInput
              v-model="state.maxNominal"
              type="number"
              min="0"
              placeholder="10000000"
              class="w-full"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="Margin Pertahun (%)" name="persenMarginTahun">
            <UInput
              v-model="state.persenMarginTahun"
              type="number"
              step="0.1"
              min="0"
              placeholder="10"
              class="w-full"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="Biaya Akad (Rp)" name="biayaAkad">
            <UInput
              v-model="state.biayaAkad"
              type="number"
              min="0"
              placeholder="50000"
              class="w-full"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="Persyaratan Jaminan" name="jaminan" class="sm:col-span-2">
            <USelect
              v-model="state.jaminan"
              :items="jaminanOptions"
              value-attribute="value"
              option-attribute="label"
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
        form="form-margin"
        icon="i-tabler-check"
        :loading="isLoading"
      >
        Simpan
      </UButton>
    </template>
  </UModal>
</template>
