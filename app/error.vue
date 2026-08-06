<script setup lang="ts">
import type { NuxtError } from "#app";

interface ErrorMessage {
  [id: string]: {
    name: string;
    message: string;
  };
}

const props = defineProps<{
  error: NuxtError;
}>();

const statusMessage: ErrorMessage = {
  400: {
    name: "Permintaan tidak valid",
    message:
        "Oops! Terjadi kesalahan pada permintaan ini. Silakan periksa kembali lalu coba lagi.",
  },
  404: {
    name: "Halaman tidak ditemukan",
    message:
        "Oops! Kami tidak dapat menemukan halaman yang Anda cari. Mungkin telah dipindahkan atau dihapus.",
  },
  401: {
    name: "Tidak terotorisasi",
    message:
        "Oops! Sepertinya Anda perlu masuk untuk mengakses halaman ini. Silakan periksa kredensial Anda dan coba lagi.",
  },
  403: {
    name: "Dilarang",
    message:
        "Maaf, Anda tidak memiliki izin untuk mengakses halaman ini. Jika Anda yakin ini adalah kesalahan, silakan hubungi dukungan.",
  },
  500: {
    name: "Kesalahan server internal",
    message:
        "Uh-oh! Ada yang salah di sistem kami. Kami sedang bekerja keras untuk memperbaikinya. Silakan coba lagi nanti.",
  },
  503: {
    name: "Layanan tidak tersedia",
    message:
        "Mohon maaf, layanan sedang sibuk atau menjalani pemeliharaan. Silakan coba lagi beberapa saat lagi.",
  },
  default: {
    name: "Terjadi kesalahan",
    message:
        "Oops! Ada yang tidak beres. Silakan coba lagi nanti.",
  },
};

const matched = computed(
  () => statusMessage[String(props.error?.status)] ?? statusMessage.default,
);
</script>

<template>
  <UError
    :error="{
      statusCode: props.error?.status,
      statusMessage: matched?.name,
      message: matched?.message,
    }"
    redirect="/"
  />
</template>
