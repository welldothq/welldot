<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content';

// The current section's sidebar, repeated in the mobile menu
defineProps<{ navigation: ContentNavigationItem[] }>();
</script>

<template>
  <UHeader to="/" title="welldot docs">
    <template #title>
      <img src="/logo.svg" alt="" class="size-6.5 shrink-0" />
      <span>welldot</span>
      <span class="font-mono text-xs font-normal text-muted">docs</span>
    </template>

    <LayoutModuleSwitcher />

    <template #right>
      <UContentSearchButton />
      <UTooltip text="GitHub" :content="{ side: 'bottom' }">
        <UButton
          to="https://github.com/welldothq/welldot"
          target="_blank"
          icon="i-ph-github-logo"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </UTooltip>
      <UColorModeButton />
    </template>

    <template #body>
      <p class="docs-label mb-2">Sections</p>
      <LayoutModuleSwitcher vertical />
      <template v-if="navigation.length">
        <USeparator class="my-5" />
        <UContentNavigation :navigation="navigation" highlight />
      </template>
    </template>
  </UHeader>
</template>
