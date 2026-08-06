<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator color="blue" :height="5" />
    <UApp>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UApp>
  </div>
</template>
