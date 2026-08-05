<script setup lang="ts">
import type { NuxtError } from "#app";

interface errorMessage {
  [id: string]: {
    name: string;
    message: string;
  };
}

defineProps<{
  error: NuxtError;
}>();

const statusMessage: errorMessage = {
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
};
</script>

<template>
  <UError
    :error="{
      statusCode: error?.status,
      statusMessage: statusMessage[String(error?.status)]?.name,
      message: error?.message,
    }"
    redirect="/"
  />
</template>
