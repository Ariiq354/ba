<script setup lang="ts">
import { useToastError, useToastSuccess } from "~/composables/toast";
import { rejectMutasiSchema } from "../model";

const props = defineProps<{
  mutasiId: number;
  kodeTransaksi: string;
  refresh?: () => void;
}>();

const emit = defineEmits<{ close: [] }>();

const alasanPenolakan = ref("");
const isLoading = ref(false);

const isValid = computed(() => {
  return rejectMutasiSchema.safeParse({
    alasanPenolakan: alasanPenolakan.value.trim(),
  }).success;
});

async function handleSubmit() {
  const result = rejectMutasiSchema.safeParse({
    alasanPenolakan: alasanPenolakan.value.trim(),
  });

  if (!result.success)
    return;

  isLoading.value = true;
  try {
    await $fetch(`/api/v1/simpanan/admin/reject/${props.mutasiId}`, {
      method: "POST",
      body: result.data,
    });
    useToastSuccess("Berhasil Ditolak", `Transaksi ${props.kodeTransaksi} telah ditolak.`);
    props.refresh?.();
    emit("close");
  }
  catch (error: any) {
    useToastError(
      "Gagal Menolak",
      error?.data?.statusMessage || error?.data?.message || "Terjadi kesalahan saat menolak transaksi.",
    );
  }
  finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UModal
    title="Tolak Pengajuan Mutasi Simpanan"
    :description="`Masukkan alasan penolakan untuk transaksi ${kodeTransaksi}.`"
    class="sm:max-w-md"
  >
    <template #body>
      <form id="form-reject" class="space-y-4" @submit.prevent="handleSubmit">
        <UFormField label="Alasan Penolakan" required>
          <UTextarea
            v-model="alasanPenolakan"
            placeholder="Jelaskan alasan mengapa transaksi ini ditolak..."
            class="w-full"
            :rows="3"
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
        form="form-reject"
        icon="i-tabler-x-circle"
        color="error"
        :disabled="!isValid || isLoading"
        :loading="isLoading"
      >
        Konfirmasi Penolakan
      </UButton>
    </template>
  </UModal>
</template>
