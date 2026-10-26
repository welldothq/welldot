<script setup lang="ts">
useHead({
  titleTemplate: title => (title ? `${title} · welldot docs` : 'welldot docs'),
  link: [{ rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
});
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
