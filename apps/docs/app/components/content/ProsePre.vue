<script setup lang="ts">
// Overrides Nuxt UI's ProsePre: `mermaid` fences become diagrams, every other fence is handed to
// Nuxt UI's own component unchanged (copy button, filename header, code-group `hide-header`).
import NuxtUiProsePre from '@nuxt/ui/components/prose/Pre.vue';

defineOptions({ inheritAttrs: false });

const props = defineProps<{ code?: string; language?: string }>();
</script>

<template>
  <ClientOnly v-if="props.language === 'mermaid'">
    <MermaidDiagram :code="props.code ?? ''" />
    <template #fallback>
      <USkeleton class="my-6 h-48 w-full rounded-lg" />
    </template>
  </ClientOnly>
  <NuxtUiProsePre
    v-else
    v-bind="$attrs"
    :code="props.code"
    :language="props.language"
  >
    <slot />
  </NuxtUiProsePre>
</template>
