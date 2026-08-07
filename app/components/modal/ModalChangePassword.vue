<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";
import { useToastError, useToastSuccess } from "~/composables/toast";
import { authClient } from "~/utils/auth";
import InputPassword from "../input/InputPassword.vue";

const emit = defineEmits<{ close: [] }>();

const schema = z.object({
  oldPassword: z.string("Password lama wajib diisi").min(8, "Password lama minimal 8 karakter"),
  newPassword: z.string("Password baru wajib diisi").min(8, "Password baru minimal 8 karakter"),
  confirmPassword: z.string("Konfirmasi password wajib diisi").min(8, "Konfirmasi password minimal 8 karakter"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Password baru dan konfirmasi password tidak sama",
  path: ["confirmPassword"],
});
type Schema = z.infer<typeof schema>;

const state = ref<Partial<Schema>>({
  oldPassword: undefined,
  newPassword: undefined,
  confirmPassword: undefined,
});

const isLoading = ref(false);
async function onSubmit(event: FormSubmitEvent<Schema>) {
  isLoading.value = true;

  await authClient.changePassword({
    currentPassword: event.data.oldPassword,
    newPassword: event.data.newPassword,
  }, {
    onError(err) {
      if (err.error.code === "INVALID_PASSWORD") {
        useToastError("Gagal", "Password lama yang Anda masukkan salah.");
      }
      else {
        useToastError("Gagal", "Password gagal diubah. Silakan coba lagi.");
      }
    },
    onResponse() {
      isLoading.value = false;
    },
    onSuccess() {
      useToastSuccess("Berhasil", "Password Anda berhasil diubah");
      emit("close");
    },
  });
}
</script>

<template>
  <UModal
    :ui="{ body: 'sm:max-w-lg' }"
    title="Ubah Password"
    description="Masukkan password lama dan password baru Anda."
  >
    <template #body>
      <UForm
        id="form-password"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="flex flex-col gap-4">
          <UFormField label="Password Lama" name="oldPassword">
            <InputPassword
              v-model="state.oldPassword"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="Password Baru" name="newPassword">
            <InputPassword
              v-model="state.newPassword"
              :disabled="isLoading"
            />
          </UFormField>

          <UFormField label="Konfirmasi Password Baru" name="confirmPassword">
            <InputPassword
              v-model="state.confirmPassword"
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
        :disabled="isLoading"
        @click="emit('close')"
      >
        Batal
      </UButton>
      <UButton
        type="submit"
        form="form-password"
        icon="i-tabler-check"
        :loading="isLoading"
      >
        Simpan
      </UButton>
    </template>
  </UModal>
</template>
