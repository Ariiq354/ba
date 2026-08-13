<script setup lang="ts">
import { useToastError, useToastSuccess } from "~/composables/toast";
import { formatRupiah } from "~/utils/formatter";
import { AKTIVA_OPTIONS, setorSahamSchema } from "../model";

const props = defineProps<{
  refresh?: () => void;
}>();

const emit = defineEmits<{ close: [] }>();

const { data: sahamPrice, pending: loadingPrice } = await useFetch("/api/v1/simpanan/saham-price");

const akunId = ref<number>(1);
const jumlahLembar = ref<number | undefined>(1);
const keterangan = ref("");

const isLoading = ref(false);

const hargaNominal = computed(() => sahamPrice.value?.hargaNominal ?? 50000);
const hargaJual = computed(() => sahamPrice.value?.hargaJual ?? 50000);

const nominalTotal = computed(() => (jumlahLembar.value || 0) * hargaNominal.value);
const agioTotal = computed(() => (jumlahLembar.value || 0) * Math.max(0, hargaJual.value - hargaNominal.value));
const totalBayar = computed(() => nominalTotal.value + agioTotal.value);

const isValid = computed(() => {
  const schemaValid = setorSahamSchema.safeParse({
    akunId: akunId.value,
    jumlahLembar: jumlahLembar.value,
    keterangan: keterangan.value,
  }).success;
  return schemaValid && sahamPrice.value !== null && sahamPrice.value !== undefined;
});

async function handleSubmit() {
  const result = setorSahamSchema.safeParse({
    akunId: akunId.value,
    jumlahLembar: jumlahLembar.value,
    keterangan: keterangan.value.trim() || undefined,
  });

  if (!result.success || !sahamPrice.value)
    return;

  isLoading.value = true;
  try {
    await $fetch("/api/v1/simpanan/saham", {
      method: "POST",
      body: result.data,
    });
    useToastSuccess("Berhasil", "Pengajuan setor saham berhasil dikirim. Menunggu persetujuan admin.");
    props.refresh?.();
    emit("close");
  }
  catch (error: any) {
    useToastError(
      "Gagal Mengirim",
      error?.data?.statusMessage || error?.data?.message || "Terjadi kesalahan saat membuat pengajuan setor saham.",
    );
  }
  finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UModal
    title="Pengajuan Setor Saham (Modal Saham)"
    description="Beli saham institusi dengan harga pasar terkini."
    class="sm:max-w-lg"
  >
    <template #body>
      <form id="form-saham" class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="loadingPrice" class="space-y-2">
          <USkeleton class="h-16 w-full" />
        </div>

        <div v-else-if="!sahamPrice" class="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">
          Master harga saham belum dikonfigurasi oleh administrator. Silakan hubungi admin.
        </div>

        <template v-else>
          <div class="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs space-y-1">
            <div class="flex justify-between font-medium text-blue-900 dark:text-blue-200">
              <span>Harga Pasar Saham Terkini:</span>
              <span class="font-bold">{{ formatRupiah(hargaJual) }} / lembar</span>
            </div>
            <div class="flex justify-between text-blue-700 dark:text-blue-300 text-[11px]">
              <span>Nilai Nominal: {{ formatRupiah(hargaNominal) }}</span>
              <span>Agio per Lembar: {{ formatRupiah(hargaJual - hargaNominal) }}</span>
            </div>
          </div>

          <UFormField label="Sumber Pembayaran" required>
            <USelectMenu
              v-model="akunId"
              :items="AKTIVA_OPTIONS"
              value-key="value"
              label-key="label"
              class="w-full"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="Jumlah Lembar Saham" required>
            <UInput
              v-model.number="jumlahLembar"
              type="number"
              min="1"
              step="1"
              placeholder="Jumlah lembar yang dibeli..."
              class="w-full"
              :disabled="isLoading"
            />
          </UFormField>

          <!-- Calculated Breakdown Card -->
          <div class="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/60 dark:bg-gray-900/60 space-y-2 text-xs">
            <div class="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Nominal Saham50 ({{ jumlahLembar || 0 }} x {{ formatRupiah(hargaNominal) }}):</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{ formatRupiah(nominalTotal) }}</span>
            </div>
            <div class="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Agio Saham:</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{ formatRupiah(agioTotal) }}</span>
            </div>
            <USeparator />
            <div class="flex justify-between font-bold text-sm text-gray-900 dark:text-white pt-1">
              <span>Total yang Harus Dibayar:</span>
              <span class="text-primary-600 dark:text-primary-400">{{ formatRupiah(totalBayar) }}</span>
            </div>
          </div>

          <UFormField label="Keterangan (Opsional)">
            <UTextarea
              v-model="keterangan"
              placeholder="Catatan setor saham..."
              class="w-full"
              :rows="2"
              :disabled="isLoading"
            />
          </UFormField>
        </template>
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
        form="form-saham"
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
