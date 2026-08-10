<script setup lang='ts'>
import type { FormSubmitEvent } from "@nuxt/ui";
import type { RegisterSchema } from "./model";
import InputPassword from "~/components/input/InputPassword.vue";
import SelectKelompok from "~/components/select/SelectKelompok.vue";
import { useToastError, useToastSuccess } from "~/composables/toast";
import { authClient } from "~/utils/auth";
import { initRegisterFormdata, registerSchema } from "./model";

const state = reactive({ ...initRegisterFormdata });

const isLoading = ref(false);
async function onSubmit(event: FormSubmitEvent<RegisterSchema>) {
  await authClient.signUp.email({
    name: event.data.name,
    email: `${event.data.username}@auth.local`,
    username: event.data.username,
    password: event.data.password,
    idKelompok: event.data.idKelompok,
  }, {
    onRequest: () => {
      isLoading.value = true;
    },
    onSuccess: async () => {
      isLoading.value = false;
      useToastSuccess("Registrasi Berhasil", "Akun Anda telah berhasil dibuat. Silakan login untuk melanjutkan.");
      await navigateTo("/");
    },
    onError: (err) => {
      isLoading.value = false;

      switch (err.error.code) {
        case "USERNAME_IS_ALREADY_TAKEN":
          useToastError("Registrasi Gagal", "Username sudah digunakan. Silakan gunakan username lain.");
          break;
        default:
          useToastError("Registrasi Gagal", "Terjadi kesalahan. Silakan coba lagi beberapa saat lagi.");
      }
    },
  });
}
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0 grid md:grid-cols-2' }">
    <div class="flex flex-col items-center justify-center p-4 md:p-8 space-y-8">
      <div class="text-center">
        <NuxtImg
          src="/logo.webp"
          class="mx-auto h-24 w-24"
        />

        <h1 class="mt-4 text-2xl font-bold">
          Buat Akun Baru
        </h1>

        <p class="text-sm text-muted">
          Lengkapi data berikut untuk membuat akun baru.
        </p>
      </div>
      <UForm
        :schema="registerSchema"
        :state="state"
        class="w-full space-y-6"
        @submit="onSubmit"
      >
        <UFormField label="Nama Lengkap" name="name" required>
          <UInput
            v-model="state.name"
            :disabled="isLoading"
            placeholder="Masukkan nama lengkap anda"
          />
        </UFormField>

        <UFormField label="Username" name="username" required>
          <UInput
            v-model="state.username"
            :disabled="isLoading"
            placeholder="Masukkan username anda"
          />
        </UFormField>

        <UFormField label="Password" name="password" required>
          <InputPassword
            v-model="state.password"
            :disabled="isLoading"
            placeholder="Masukkan password anda"
          />
        </UFormField>

        <UFormField label="Konfirmasi Password" name="confirmPassword" required>
          <InputPassword
            v-model="state.confirmPassword"
            :disabled="isLoading"
            placeholder="Masukkan konfirmasi password"
          />
        </UFormField>

        <UFormField label="Pilih Kelompok" name="idKelompok" required>
          <SelectKelompok
            v-model="state.idKelompok"
            :disabled="isLoading"
          />
        </UFormField>

        <UButton
          class="flex w-full justify-center"
          type="submit"
          :loading="isLoading"
        >
          Daftar
        </UButton>
        <p class="text-center text-sm text-muted">
          Sudah punya akun?
          <NuxtLink
            to="/"
            class="font-medium text-primary hover:underline"
          >
            Masuk sekarang
          </NuxtLink>
        </p>
      </UForm>
    </div>

    <div class="bg-muted relative hidden md:block">
      <NuxtImg
        src="vertical.webp"
        alt="Image Vertical"
        class="h-full w-full object-cover"
      />
    </div>
  </UCard>
</template>
