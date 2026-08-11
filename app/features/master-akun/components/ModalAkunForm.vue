<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { AkunFormSchema, AkunItem } from "../model";
import { useToastError, useToastSuccess } from "~/composables/toast";
import { akunSchema } from "../model";

const props = defineProps<{
  item?: AkunItem;
  refresh?: () => void;
}>();

const emit = defineEmits<{ close: [] }>();

const isEdit = computed(() => !!props.item);

const state = ref<Partial<AkunFormSchema>>({
  kodeAkun: props.item?.kodeAkun ?? "",
  namaAkun: props.item?.namaAkun ?? "",
  kategori: props.item?.kategori ?? "aktiva",
  normalBalance: props.item?.normalBalance ?? "debit",
  isActive: props.item?.isActive ?? true,
});

const kategoriOptions = [
  { label: "Aktiva", value: "aktiva" },
  { label: "Pasiva", value: "pasiva" },
  { label: "Pendapatan", value: "pendapatan" },
  { label: "Biaya", value: "biaya" },
];

const normalBalanceOptions = [
  { label: "Debit", value: "debit" },
  { label: "Kredit", value: "kredit" },
];

// Auto-suggest normal balance based on selected category when category changes
watch(() => state.value.kategori, (newKategori) => {
  if (newKategori === "aktiva" || newKategori === "biaya") {
    state.value.normalBalance = "debit";
  }
  else if (newKategori === "pasiva" || newKategori === "pendapatan") {
    state.value.normalBalance = "kredit";
  }
});

const isLoading = ref(false);

async function onSubmit(event: FormSubmitEvent<AkunFormSchema>) {
  isLoading.value = true;

  try {
    if (isEdit.value && props.item) {
      await $fetch(`/api/v1/master/akun/${props.item.id}`, {
        method: "PUT",
        body: event.data,
      });
      useToastSuccess("Berhasil", "Data akun berhasil diperbarui");
    }
    else {
      await $fetch("/api/v1/master/akun", {
        method: "POST",
        body: event.data,
      });
      useToastSuccess("Berhasil", "Data akun baru berhasil ditambahkan");
    }
    props.refresh?.();
    emit("close");
  }
  catch (error: any) {
    useToastError("Gagal", error?.data?.statusMessage || error?.data?.message || "Terjadi kesalahan saat menyimpan data.");
  }
  finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UModal
    :title="isEdit ? 'Edit Master Akun' : 'Tambah Master Akun'"
    :description="isEdit ? 'Ubah informasi dan konfigurasi akun transaksi.' : 'Tambahkan akun perkiraan / chart of accounts baru.'"
  >
    <template #body>
      <UForm
        id="form-akun"
        :schema="akunSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Kode Akun" name="kodeAkun">
            <UInput
              v-model="state.kodeAkun"
              placeholder="Contoh: 101.01"
              class="w-full"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="Nama Akun" name="namaAkun">
            <UInput
              v-model="state.namaAkun"
              placeholder="Contoh: Kas Utama"
              class="w-full"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="Kategori Akun" name="kategori">
            <USelect
              v-model="state.kategori"
              :items="kategoriOptions"
              value-attribute="value"
              option-attribute="label"
              class="w-full"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="Normal Balance" name="normalBalance">
            <USelect
              v-model="state.normalBalance"
              :items="normalBalanceOptions"
              value-attribute="value"
              option-attribute="label"
              class="w-full"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="Status Akun" name="isActive" class="sm:col-span-2">
            <div class="flex items-center gap-3 pt-2">
              <USwitch
                v-model="state.isActive"
                :disabled="isLoading"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ state.isActive ? 'Aktif (Dapat digunakan dalam transaksi)' : 'Nonaktif' }}
              </span>
            </div>
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
        form="form-akun"
        icon="i-tabler-check"
        :loading="isLoading"
      >
        Simpan
      </UButton>
    </template>
  </UModal>
</template>
