<script setup lang="ts">
import { useToastError, useToastSuccess } from "~/composables/toast";
import { AKTIVA_OPTIONS } from "../model";

const props = defineProps<{
  effectiveSaldo: number;
  refresh?: () => void;
}>();

const emit = defineEmits<{ close: [] }>();

const akunId = ref<number>(1);
const nilaiTransaksi = ref<number | undefined>(undefined);
const keterangan = ref("");

const isLoading = ref(false);

function formatRupiah(val?: number) {
  if (val === undefined || val === null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

const isExceedingBalance = computed(() => {
  if (!nilaiTransaksi.value) return false;
  return nilaiTransaksi.value > props.effectiveSaldo;
});

const isValid = computed(() => {
  return (
    akunId.value &&
    nilaiTransaksi.value &&
    nilaiTransaksi.value > 0 &&
    !isExceedingBalance.value
  );
});

async function handleSubmit() {
  if (!isValid.value || !nilaiTransaksi.value) return;

  isLoading.value = true;
  try {
    await $fetch("/api/v1/simpanan/penarikan", {
      method: "POST",
      body: {
        akunId: akunId.value,
        nilaiTransaksi: nilaiTransaksi.value,
        keterangan: keterangan.value.trim() || undefined,
      },
    });
    useToastSuccess("Berhasil", "Pengajuan penarikan tabungan berhasil dikirim. Menunggu persetujuan admin.");
    props.refresh?.();
    emit("close");
  } catch (error: any) {
    useToastError(
      "Gagal Mengirim",
      error?.data?.statusMessage || error?.data?.message || "Terjadi kesalahan saat membuat pengajuan penarikan.",
    );
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UModal
    title="Pengajuan Penarikan Tabungan Berjangka"
    description="Isi formulir penarikan tabungan. Penarikan dibatasi oleh Saldo Efektif Anda saat ini."
    class="sm:max-w-lg"
  >
    <template #body>
      <form id="form-penarikan" class="space-y-4" @submit.prevent="handleSubmit">
        <div class="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between">
          <span class="text-xs font-medium text-emerald-800 dark:text-emerald-300">Saldo Efektif Tersedia:</span>
          <span class="text-sm font-bold text-emerald-700 dark:text-emerald-400">{{ formatRupiah(effectiveSaldo) }}</span>
        </div>

        <UFormField label="Tujuan Transfer / Pencairan" required>
          <USelectMenu
            v-model="akunId"
            :items="AKTIVA_OPTIONS"
            value-key="value"
            label-key="label"
            class="w-full"
            :disabled="isLoading"
          />
        </UFormField>

        <UFormField label="Nominal Penarikan (IDR)" required>
          <UInput
            v-model.number="nilaiTransaksi"
            type="number"
            min="1000"
            step="1000"
            placeholder="Masukkan nominal penarikan..."
            class="w-full"
            :disabled="isLoading"
          />
          <template v-if="isExceedingBalance" #hint>
            <span class="text-xs text-red-500 font-medium">Nominal melebihi saldo efektif tersedia!</span>
          </template>
        </UFormField>

        <UFormField label="Keterangan (Opsional)">
          <UTextarea
            v-model="keterangan"
            placeholder="Catatan keperluan penarikan..."
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
        form="form-penarikan"
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
