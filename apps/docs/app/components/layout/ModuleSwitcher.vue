<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import { SECTIONS } from '~/sections';

// Icon row in the header; `vertical` is the labelled list used in the mobile menu
const props = defineProps<{ vertical?: boolean }>();

const { section, homes } = await useDocsNavigation();
const current = computed(() => section.value?.id);

// `active` is always set: on the catch-all route the router would mark every link active
const items = computed<NavigationMenuItem[]>(() =>
  SECTIONS.map(s => ({
    label: s.title,
    icon: s.icon,
    to: homes.value[s.id],
    active: s.id === current.value,
  })),
);
</script>

<template>
  <UNavigationMenu
    v-if="props.vertical"
    :items="items"
    orientation="vertical"
    aria-label="Sections"
  />
  <nav v-else aria-label="Sections" class="flex items-center gap-1">
    <UTooltip
      v-for="s in SECTIONS"
      :key="s.id"
      :text="s.title"
      :content="{ side: 'bottom' }"
    >
      <UButton
        :to="homes[s.id]"
        :icon="s.icon"
        :aria-label="s.title"
        :aria-current="s.id === current ? 'true' : undefined"
        :active="s.id === current"
        color="neutral"
        variant="ghost"
        active-color="primary"
        active-variant="soft"
      />
    </UTooltip>
  </nav>
</template>
