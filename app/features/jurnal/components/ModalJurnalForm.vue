<script setup lang="ts">
import type { FormDetailLine } from "../model";
import { getLocalTimeZone, today } from "@internationalized/date";
import InputCalendar from "~/components/input/InputCalendar.vue";
import { useToastError, useToastSuccess } from "~/composables/toast";
import { formatRupiah } from "../model";

const props = defineProps<{
  refresh?: () => void;
}>();

const emit = defineEmits<{ close: [] }>();

const tanggalTransaksi = shallowRef(today(getLocalTimeZone()));
const keterangan = ref("");

const debitItems = ref<FormDetailLine[]>([{ akunId: undefined, nominal: 0 }]);
const kreditItems = ref<FormDetailLine[]>([{ akunId: undefined, nominal: 0 }]);

// Fetch active master akun list for dropdown options
const { data: akunData, pending: loadingAkun } = await useLazyFetch("/api/v1/master/akun", {
  query: { limit: 1000 },
});

const akunOptions = computed(() => {
  const items = akunData.value?.items || [];
  return items
    .filter((a: any) => a.isActive)
    .map((a: any) => ({
      id: a.id,
      label: `[${a.kodeAkun}] ${a.namaAkun}`,
      kodeAkun: a.kodeAkun,
      namaAkun: a.namaAkun,
    }));
});

function addDebitRow() {
  debitItems.value.push({ akunId: undefined, nominal: 0 });
}

function removeDebitRow(index: number) {
  if (debitItems.value.length > 1) {
    debitItems.value.splice(index, 1);
  }
}

function addKreditRow() {
  kreditItems.value.push({ akunId: undefined, nominal: 0 });
}

function removeKreditRow(index: number) {
  if (kreditItems.value.length > 1) {
    kreditItems.value.splice(index, 1);
  }
}

const totalDebit = computed(() => {
  return debitItems.value.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);
});

const totalKredit = computed(() => {
  return kreditItems.value.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);
});

const selisih = computed(() => Math.abs(totalDebit.value - totalKredit.value));
const isBalanced = computed(() => totalDebit.value > 0 && totalDebit.value === totalKredit.value);

const isValidForm = computed(() => {
  if (!tanggalTransaksi.value)
    return false;
  if (!isBalanced.value)
    return false;

  const validDebits = debitItems.value.every(d => d.akunId && Number(d.nominal) > 0);
  const validKredits = kreditItems.value.every(k => k.akunId && Number(k.nominal) > 0);

  return validDebits && validKredits;
});

const isLoading = ref(false);

async function handleSubmit() {
  if (!isValidForm.value)
    return;

  isLoading.value = true;

  const detailsPayload: { akunId: number; debit: number; kredit: number }[] = [];

  for (const d of debitItems.value) {
    if (d.akunId && d.nominal > 0) {
      detailsPayload.push({
        akunId: d.akunId,
        debit: Number(d.nominal),
        kredit: 0,
      });
    }
  }

  for (const k of kreditItems.value) {
    if (k.akunId && k.nominal > 0) {
      detailsPayload.push({
        akunId: k.akunId,
        debit: 0,
        kredit: Number(k.nominal),
      });
    }
  }

  const payload = {
    tanggalTransaksi: tanggalTransaksi.value ? tanggalTransaksi.value.toString() : "",
    keterangan: keterangan.value.trim() || undefined,
    details: detailsPayload,
  };

  try {
    await $fetch("/api/v1/jurnal", {
      method: "POST",
      body: payload,
    });
    useToastSuccess("Berhasil", "Transaksi jurnal baru berhasil disimpan");
    props.refresh?.();
    emit("close");
  }
  catch (error: any) {
    useToastError(
      "Gagal Menyimpan",
      error?.data?.statusMessage || error?.data?.message || "Terjadi kesalahan saat menyimpan transaksi.",
    );
  }
  finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UModal
    title="Buat Transaksi Jurnal Baru"
    description="Masukkan transaksi jurnal baru dengan rincian debit dan kredit."
    class="sm:max-w-4xl"
  >
    <template #body>
      <form id="form-jurnal" class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Header Info Fields -->
        <div class="space-y-4">
          <UFormField label="Tanggal Transaksi" required>
            <InputCalendar
              v-model="tanggalTransaksi"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="Keterangan / Catatan" class="sm:col-span-2">
            <UTextarea
              v-model="keterangan"
              placeholder="Catatan penjelas transaksi (misal: Pembayaran sewa kantor bulan Agustus)..."
              class="w-full"
              :rows="2"
              :disabled="isLoading"
            />
          </UFormField>
        </div>

        <USeparator />

        <!-- Section 1: Dynamic Debit Table -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UBadge color="primary" variant="subtle" size="md">
                Entry Debit
              </UBadge>
              <span class="text-xs text-gray-500">Pilih akun dan isi nominal di posisi Debit</span>
            </div>
            <UButton
              icon="i-tabler-plus"
              color="primary"
              variant="soft"
              size="xs"
              @click="addDebitRow"
            >
              Tambah Baris Debit
            </UButton>
          </div>

          <div class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <table class="w-full text-sm text-left">
              <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th class="px-4 py-2 font-medium text-gray-600 dark:text-gray-400">
                    Akun Perkiraan
                  </th>
                  <th class="px-4 py-2 font-medium text-gray-600 dark:text-gray-400 w-48 text-right">
                    Nominal Debit (IDR)
                  </th>
                  <th class="px-3 py-2 w-12 text-center" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="(row, idx) in debitItems" :key="`debit-${idx}`">
                  <td class="px-4 py-2">
                    <USelectMenu
                      v-model="row.akunId"
                      :items="akunOptions"
                      :loading="loadingAkun"
                      value-key="id"
                      label-key="label"
                      placeholder="Cari & pilih akun debit..."
                      class="w-full"
                      searchable
                    />
                  </td>
                  <td class="px-4 py-2">
                    <UInput
                      v-model.number="row.nominal"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="w-full text-right"
                    />
                  </td>
                  <td class="px-3 py-2 text-center">
                    <UButton
                      icon="i-tabler-trash"
                      color="error"
                      variant="ghost"
                      size="xs"
                      :disabled="debitItems.length <= 1"
                      @click="removeDebitRow(idx)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section 2: Dynamic Kredit Table -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UBadge color="neutral" variant="subtle" size="md">
                Entry Kredit
              </UBadge>
              <span class="text-xs text-gray-500">Pilih akun dan isi nominal di posisi Kredit</span>
            </div>
            <UButton
              icon="i-tabler-plus"
              color="neutral"
              variant="soft"
              size="xs"
              @click="addKreditRow"
            >
              Tambah Baris Kredit
            </UButton>
          </div>

          <div class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <table class="w-full text-sm text-left">
              <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th class="px-4 py-2 font-medium text-gray-600 dark:text-gray-400">
                    Akun Perkiraan
                  </th>
                  <th class="px-4 py-2 font-medium text-gray-600 dark:text-gray-400 w-48 text-right">
                    Nominal Kredit (IDR)
                  </th>
                  <th class="px-3 py-2 w-12 text-center" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="(row, idx) in kreditItems" :key="`kredit-${idx}`">
                  <td class="px-4 py-2">
                    <USelectMenu
                      v-model="row.akunId"
                      :items="akunOptions"
                      :loading="loadingAkun"
                      value-key="id"
                      label-key="label"
                      placeholder="Cari & pilih akun kredit..."
                      class="w-full"
                      searchable
                    />
                  </td>
                  <td class="px-4 py-2">
                    <UInput
                      v-model.number="row.nominal"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="w-full text-right"
                    />
                  </td>
                  <td class="px-3 py-2 text-center">
                    <UButton
                      icon="i-tabler-trash"
                      color="error"
                      variant="ghost"
                      size="xs"
                      :disabled="kreditItems.length <= 1"
                      @click="removeKreditRow(idx)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Live Balance Summary Bar -->
        <div class="p-4 rounded-xl border bg-gray-50/70 dark:bg-gray-900/60 border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-6 text-sm">
            <div>
              <span class="text-gray-500 block text-xs">Total Debit</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{ formatRupiah(totalDebit) }}</span>
            </div>
            <div class="h-8 w-px bg-gray-200 dark:bg-gray-800" />
            <div>
              <span class="text-gray-500 block text-xs">Total Kredit</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{ formatRupiah(totalKredit) }}</span>
            </div>
            <div class="h-8 w-px bg-gray-200 dark:bg-gray-800" />
            <div>
              <span class="text-gray-500 block text-xs">Selisih</span>
              <span :class="selisih === 0 ? 'text-gray-600 dark:text-gray-400 font-semibold' : 'text-red-500 font-bold'">
                {{ formatRupiah(selisih) }}
              </span>
            </div>
          </div>

          <div>
            <UBadge
              v-if="isBalanced"
              color="success"
              variant="solid"
              size="md"
              class="gap-1 px-3 py-1"
            >
              <UIcon name="i-tabler-circle-check-filled" class="w-4 h-4" />
              Seimbang (Balanced)
            </UBadge>
            <UBadge
              v-else
              color="error"
              variant="solid"
              size="md"
              class="gap-1 px-3 py-1"
            >
              <UIcon name="i-tabler-alert-circle-filled" class="w-4 h-4" />
              Belum Seimbang (Unbalanced)
            </UBadge>
          </div>
        </div>
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
        form="form-jurnal"
        icon="i-tabler-check"
        color="primary"
        :disabled="!isValidForm || isLoading"
        :loading="isLoading"
      >
        Simpan Transaksi
      </UButton>
    </template>
  </UModal>
</template>
