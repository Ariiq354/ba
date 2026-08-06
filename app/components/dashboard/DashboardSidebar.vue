<script setup lang="ts">
import { useAuthSession } from "~/composables/auth";
import { useToastError } from "~/composables/toast";
import { authClient } from "~/utils/auth";

const config = useRuntimeConfig();
const { session } = await useAuthSession();

async function signOut() {
  try {
    await authClient.signOut();
    await navigateTo("/", { external: true });
  }
  catch {
    useToastError("Gagal Keluar", "Terjadi kesalahan saat keluar, silahkan coba lagi.");
  }
}

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: session.value?.user.name ?? "User",
      avatar: {
        src: session.value?.user.image ? `${config.public.imageUrl}/${session.value.user.image}` : undefined,
        alt: session.value?.user.name ?? "User",
        loading: "lazy",
      },
      type: "label",
    },
  ],
  [
    {
      label: "Profil",
      icon: "i-tabler-user",
    },
    {
      label: "Ubah Password",
      icon: "i-tabler-lock-password",
    },
  ],
  [
    {
      label: "Keluar",
      icon: "i-tabler-logout",
      color: "error",
      onClick: signOut,
    },
  ],
]);
</script>

<template>
  <UDashboardSidebar collapsible resizable :default-size="35" :ui="{ footer: 'border-t border-default', root: 'min-w-0 transition-all duration-300 overflow-hidden' }">
    <template #header>
      <div class="flex h-14 w-full items-center gap-2 overflow-hidden px-3 py-2 text-left text-sm">
        <NuxtImg src="logo.webp" alt="Berkah Amanah" class="size-8" />

        <div class="grid flex-1 text-left text-sm leading-tight">
          <span class="truncate font-medium">Berkah Amanah</span>
          <span class="truncate text-xs">Koperasi</span>
        </div>
      </div>
    </template>

    <template #footer>
      <UDropdownMenu :items="items" :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width)' }">
        <UButton
          :avatar="{
            src: session?.user.image ? `${config.public.imageUrl}/${session.user.image}` : undefined,
            alt: session?.user.name ?? 'User',
            loading: 'lazy',
            size: 'lg',
          }"
          color="neutral"
          variant="ghost"
          class="w-full"
          trailing-icon="i-tabler-dots-vertical"
        >
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-medium">{{ session?.user.name ?? 'User' }}</span>
            <span class="truncate text-xs">{{ session?.user.username ?? 'Username' }}</span>
          </div>
        </UButton>
      </UDropdownMenu>
    </template>
  </UDashboardSidebar>
</template>
