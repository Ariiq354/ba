<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";
import { useUploadFile } from "~/composables/upload";
import InputFile from "../input/InputFile.vue";
import SelectKecamatan from "../select/SelectKecamatan.vue";
import SelectKelurahan from "../select/SelectKelurahan.vue";
import SelectKota from "../select/SelectKota.vue";
import SelectProvinsi from "../select/SelectProvinsi.vue";

const emit = defineEmits<{ close: [] }>();

const schema = z.object({
  avatar: z.file().max(5 * 1024 * 1024, "Ukuran foto profil maksimal 5MB").mime(["image/png", "image/jpeg", "image/jpg"], "Format foto profil harus PNG, JPEG, atau JPG").nullish(),
  avatarUrl: z.string().optional(),
  name: z.string().min(1, "Nama wajib diisi"),
  noHp: z.string().optional(),
  nik: z.string().optional(),
  namaBank: z.string().optional(),
  noRekening: z.string().optional(),
  pemilikRekening: z.string().optional(),
  jalan: z.string().optional(),
  idProvinsi: z.string().optional(),
  idKota: z.string().optional(),
  idKecamatan: z.string().optional(),
  idKelurahan: z.string().optional(),
});
type Schema = z.infer<typeof schema>;

const state = ref<Partial<Schema>>({});

const isLoading = ref(false);
async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (event.data.avatar) {
    const uploadKey = await useUploadFile(event.data.avatar, "avatar");
  }
}
</script>

<template>
  <UModal
    title="Ubah Profil"
    description="Perbarui informasi profil Anda."\
    class="max-w-2xl"
  >
    <template #body>
      <UForm
        id="form-profile"
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <UFormField name="avatar">
          <InputFile
            v-model:file="state.avatar"
            v-model:foto="state.avatarUrl"
            :disabled="isLoading"
            label="Foto Profil"
            description="(max. 5MB)"
          />
        </UFormField>
        <!-- Informasi Pribadi -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
            Informasi Pribadi
          </h3>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField label="Nama Lengkap" name="name" required class="sm:col-span-2">
              <UInput
                v-model="state.name"
                :disabled="isLoading"
                placeholder="Masukkan nama lengkap"
              />
            </UFormField>

            <UFormField label="No. Handphone" name="noHp">
              <UInput
                v-model="state.noHp"
                :disabled="isLoading"
                placeholder="08xxxxxxxxxx"
              />
            </UFormField>

            <UFormField label="NIK" name="nik">
              <UInput
                v-model="state.nik"
                :disabled="isLoading"
                placeholder="Masukkan NIK"
              />
            </UFormField>
          </div>
        </div>

        <!-- Informasi Rekening Bank -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
            Informasi Rekening Bank
          </h3>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField label="Nama Bank" name="namaBank">
              <UInput
                v-model="state.namaBank"
                :disabled="isLoading"
                placeholder="Contoh: BCA, Mandiri, BNI"
              />
            </UFormField>

            <UFormField label="No. Rekening" name="noRekening">
              <UInput
                v-model="state.noRekening"
                :disabled="isLoading"
                placeholder="Masukkan nomor rekening"
              />
            </UFormField>

            <UFormField label="Pemilik Rekening" name="pemilikRekening" class="sm:col-span-2">
              <UInput
                v-model="state.pemilikRekening"
                :disabled="isLoading"
                placeholder="Nama pemilik rekening sesuai buku tabungan"
              />
            </UFormField>
          </div>
        </div>

        <!-- Informasi Alamat & Wilayah -->
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">
            Alamat & Wilayah
          </h3>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField label="Alamat / Jalan" name="jalan" class="sm:col-span-2">
              <UInput
                v-model="state.jalan"
                :disabled="isLoading"
                placeholder="Masukkan nama jalan, RT/RW, dsb."
              />
            </UFormField>

            <UFormField label="Provinsi" name="idProvinsi">
              <SelectProvinsi
                v-model="state.idProvinsi"
                :disabled="isLoading"
              />
            </UFormField>

            <UFormField label="Kota / Kabupaten" name="idKota">
              <SelectKota
                v-model="state.idKota"
                :id-provinsi="state.idProvinsi"
                :disabled="isLoading"
              />
            </UFormField>

            <UFormField label="Kecamatan" name="idKecamatan">
              <SelectKecamatan
                v-model="state.idKecamatan"
                :id-kota="state.idKota"
                :disabled="isLoading"
              />
            </UFormField>

            <UFormField label="Desa / Kelurahan" name="idKelurahan">
              <SelectKelurahan
                v-model="state.idKelurahan"
                :id-kecamatan="state.idKecamatan"
                :disabled="isLoading"
              />
            </UFormField>
          </div>
        </div>
      </UForm>
    </template>
    <template #footer>
      <UButton
        icon="i-tabler-x"
        variant="ghost"
        :disabled="isLoading"
        @click="emit('close')"
      >
        Batal
      </UButton>
      <UButton
        type="submit"
        form="form-profile"
        icon="i-tabler-check"
        :loading="isLoading"
      >
        Simpan
      </UButton>
    </template>
  </UModal>
</template>
