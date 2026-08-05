<script setup lang='ts'>
import type { FormSubmitEvent } from "@nuxt/ui";
import type { LoginSchema } from "./model";
import InputPassword from "~/components/input/InputPassword.vue";
import { useToastError } from "~/composables/toast";
import { authClient } from "~/utils/auth";
import { initLoginFormdata, loginSchema } from "./model";

const state = reactive({ ...initLoginFormdata });

const isLoading = ref(false);
async function onSubmit(event: FormSubmitEvent<LoginSchema>) {
  await authClient.signIn.username({
    username: event.data.username,
    password: event.data.password,
    rememberMe: event.data.rememberMe,
  }, {
    onRequest: () => {
      isLoading.value = true;
    },
    onSuccess: async () => {
      isLoading.value = false;
      await navigateTo("/dashboard", { external: true });
    },
    onError: (err) => {
      isLoading.value = false;

      console.log("Hai", err.error);

      switch (err.error.code) {
        case "BANNED_USER":
          useToastError("Akun ditangguhkan", err.error.message);
          break;
        case "INVALID_USERNAME_OR_PASSWORD":
          useToastError("Login Gagal", "Username atau password yang Anda masukkan salah.");
          break;
        default:
          useToastError("Login Gagal", "Terjadi kesalahan. Silakan coba lagi beberapa saat lagi.");
      }
    },
  });
}
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0 grid md:grid-cols-2' }">
    <div class="flex flex-col items-center justify-center space-y-8 p-4 md:p-8">
      <div class="text-center">
        <NuxtImg
          src="/logo.webp"
          class="mx-auto h-24 w-24"
        />

        <h1 class="mt-4 text-2xl font-bold">
          Selamat Datang
        </h1>

        <p class="text-sm text-muted">
          Masuk menggunakan akun Anda untuk melanjutkan.
        </p>
      </div>
      <UForm
        :schema="loginSchema"
        :state="state"
        class="w-full space-y-4"
        @submit="onSubmit"
      >
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

        <UCheckbox
          v-model="state.rememberMe"
          :disabled="isLoading"
          label="Ingat saya"
        />

        <UButton
          class="flex w-full justify-center"
          type="submit"
          :loading="isLoading"
        >
          Masuk
        </UButton>
        <p class="text-center text-sm text-muted">
          Belum punya akun?
          <NuxtLink
            to="/register"
            class="font-medium text-primary hover:underline"
          >
            Daftar sekarang
          </NuxtLink>
        </p>
      </UForm>
    </div>

    <div class="bg-muted relative hidden md:block">
      <NuxtImg
        src="vertical.png"
        alt="Image Vertical"
        class="h-full w-full object-cover"
      />
    </div>
  </UCard>
</template>
