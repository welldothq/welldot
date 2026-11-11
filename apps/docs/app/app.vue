<script setup lang="ts">
useHead({
  titleTemplate: title => (title ? `${title} · welldot docs` : 'welldot docs'),
  link: [{ rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
});

// Site-wide social card (public/og-image.png, source in scripts/og-image). Pages set their own
// og/twitter title and description in pages/[...slug].vue
const { siteUrl } = useRuntimeConfig().public;
const ogImage = `${siteUrl}/og-image.png`;
useSeoMeta({
  ogSiteName: 'welldot docs',
  ogType: 'website',
  ogImage,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: 'image/png',
  ogImageAlt:
    'welldot docs: the record of a water well, as data. A .well JSON file next to the well profile it describes.',
  twitterCard: 'summary_large_image',
  twitterImage: ogImage,
});
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
