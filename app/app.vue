<!-- app/app.vue -->
<script setup lang="ts">
// Varsayılan temayı koyu başlatmak istersen (opsiyonel):
// useHead({ htmlAttrs: { class: 'dark' } })
// veya: useHead({ bodyAttrs: { class: 'dark' } })
</script>

<template>
  <NuxtLayout>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </NuxtLayout>
</template>
