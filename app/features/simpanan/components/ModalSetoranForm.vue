<script setup lang="ts">
import { useToastError, useToastSuccess } from "~/composables/toast";
import { AKTIVA_OPTIONS, setoranSchema } from "../model";

const props = defineProps<{
  refresh?: () => void;
}>();

const emit = defineEmits<{ close: [] }>();

const akunId = ref<number>(1);
const nilaiTransaksi = ref<number | undefined>(undefined);
const keterangan = ref("");

const isLoading = ref(false);

const isValid = computed(() => {
  return setoranSchema.safeParse({
    akunId: akunId.value,
    nilaiTransaksi: nilaiTransaksi.value,
    keterangan: keterangan.value,
  }).success;
});

async function handleSubmit() {
  const result = setoranSchema.safeParse({
    akunId: akunId.value,
    nilaiTransaksi: nilaiTransaksi.value,
    keterangan: keterangan.value.trim() || undefined,
  });

  if (!result.success)
    return;

  isLoading.value = true;
  try {
    await $fetch("/api/v1/simpanan/setoran", {
      method: "POST",
      body: result.data,
    });
    useToastSuccess("Berhasil", "Pengajuan setoran tabungan berhasil dikirim. Menunggu persetujuan admin.");
    props.refresh?.();
    emit("close");
  }
  catch (error: any) {
    useToastError(
      "Gagal Mengirim",
      error?.data?.statusMessage || error?.data?.message || "Terjadi kesalahan saat membuat pengajuan setoran.",
    );
  }
  finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UModal
    title="Pengajuan Setoran Tabungan Berjangka"
    description="Isi formulir setoran tabungan berjangka. Pengajuan akan diproses oleh Administrator."
    class="sm:max-w-lg"
  >
    <template #body>
      <form id="form-setoran" class="space-y-4" @submit.prevent="handleSubmit">
        <UFormField label="Sumber Rekening / Pembayaran" required>
          <USelectMenu
            v-model="akunId"
            :items="AKTIVA_OPTIONS"
            value-key="value"
            label-key="label"
            class="w-full"
            :disabled="isLoading"
          />
        </UFormField>

        <UFormField label="Nominal Setoran (IDR)" required>
          <UInput
            v-model.number="nilaiTransaksi"
            type="number"
            min="1000"
            step="1000"
            placeholder="Masukkan nominal, misal: 100000"
            class="w-full"
            :disabled="isLoading"
          />
        </UFormField>

        <UFormField label="Keterangan (Opsional)">
          <UTextarea
            v-model="keterangan"
            placeholder="Catatan tambahan untuk setoran..."
            class="w-full"
            :rows="2"
            :disabled="isLoading"
          />
        </UFormField>
      </form>
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
        form="form-setoran"
        icon="i-tabler-send"
        color="primary"
        :disabled="!isValid || isLoading"
        :loading="isLoading"
      >
        Kirim Pengajuan
      </UButton>
    </template>
  </UModal>
</template>
