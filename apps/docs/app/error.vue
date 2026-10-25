<script setup lang="ts">
import type { NuxtError } from '#app';
import { SECTIONS } from '~/sections';

// Nuxt renders this outside the router and layouts, so it brings its own chrome
const props = defineProps<{ error: NuxtError }>();

const { navigation, homes, navs } = await useDocsNavigation();

const is404 = computed(() => props.error.statusCode === 404);
const message = computed(() =>
  is404.value
    ? 'This page does not exist, or it has moved.'
    : props.error.message || 'Something went wrong.',
);

useHead({
  titleTemplate: title => (title ? `${title} · welldot docs` : 'welldot docs'),
  link: [{ rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
});
useSeoMeta({
  title: is404.value ? 'Page not found' : `Error ${props.error.statusCode}`,
  robots: 'noindex',
});
</script>

<template>
  <UApp>
    <LayoutSiteHeader :navigation="navigation" />
    <LayoutSiteSearch :navs="navs ?? {}" />

    <UMain>
      <UContainer>
        <UError
          :error="{
            statusCode: error.statusCode,
            statusMessage: is404 ? 'Page not found' : error.statusMessage,
            message,
          }"
          as="div"
          :clear="false"
        >
          <template #links>
            <div class="flex flex-wrap justify-center gap-2">
              <UButton to="/" label="Home" icon="i-lucide-house" />
              <UButton
                v-for="s in SECTIONS"
                :key="s.id"
                :to="homes[s.id]"
                :label="s.title"
                :icon="s.icon"
                color="neutral"
                variant="subtle"
              />
            </div>
          </template>
        </UError>
      </UContainer>
    </UMain>
  </UApp>
</template>
