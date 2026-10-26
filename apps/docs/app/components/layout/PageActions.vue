<script setup lang="ts">
import { editUrl, rawPath } from '#shared/utils/page-links';

// Copy page, view the Markdown source and edit on GitHub. Sits in the TOC `bottom` slot.
const props = defineProps<{
  page: { id?: string; path: string; meta?: Record<string, unknown> };
}>();

const toast = useToast();
const copied = ref(false);
const raw = computed(() => rawPath(props.page.path));
const edit = computed(() => editUrl(props.page));

async function copyPage() {
  try {
    // The raw route serves the page's Markdown source (prerendered file or server route)
    const markdown = await $fetch<string>(raw.value, { responseType: 'text' });
    await navigator.clipboard.writeText(markdown);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    toast.add({
      title: 'Could not copy the page',
      description: 'Use "View as Markdown" and copy from there.',
      color: 'error',
    });
  }
}

const links = computed(() => [
  {
    label: copied.value ? 'Copied' : 'Copy page',
    icon: copied.value ? 'i-lucide-check' : 'i-lucide-copy',
    onClick: copyPage,
  },
  {
    label: 'View as Markdown',
    icon: 'i-lucide-file-text',
    to: raw.value,
    target: '_blank',
  },
  ...(edit.value
    ? [
        {
          label: 'Edit this page',
          icon: 'i-lucide-pencil',
          to: edit.value,
          target: '_blank',
        },
      ]
    : []),
]);
</script>

<template>
  <div class="mt-6 border-t border-default pt-4">
    <UPageLinks title="Page actions" :links="links" />
  </div>
</template>
