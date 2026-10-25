<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content';
import type { sectionNavigation } from '~/sections';
import { searchNavigation } from '~/utils/search-navigation';
import { shortenSections } from '~/utils/search-titles';

// The command palette groups results by section, so each section becomes a top-level group
const props = defineProps<{
  navs: Parameters<typeof sectionNavigation>[1];
}>();

// The sections of every page are fetched on first open, never at page load or prerender
const { open } = useContentSearch();
const {
  data: files,
  status,
  execute,
} = useLazyAsyncData(
  'search-sections',
  async () => {
    const lists = await Promise.all([
      queryCollectionSearchSections('docs_en'),
      queryCollectionSearchSections('spec'),
      queryCollectionSearchSections('changelogs'),
    ]);
    return shortenSections(lists.flat());
  },
  { server: false, immediate: false, default: () => [] },
);
// Built from the loaded sections too, so generated pages without a sidebar entry stay searchable
const navigation = computed<ContentNavigationItem[]>(() =>
  searchNavigation(props.navs, files.value ?? []),
);

// First open starts the fetch; a failed fetch retries on the next open
watch(open, isOpen => {
  if (isOpen && (status.value === 'idle' || status.value === 'error'))
    execute();
});
</script>

<template>
  <UContentSearch
    :files="files ?? []"
    :navigation="navigation"
    :fuse="{ resultLimit: 20 }"
    :loading="status === 'pending'"
    placeholder="Search the docs, e.g. drilling_method"
  >
    <template #empty="{ searchTerm }">
      <span v-if="status === 'error'">
        Search could not be loaded.
        <!-- Content caches a rejected dump request for the session, so a retry needs a reload -->
        <UButton
          label="Reload"
          variant="link"
          color="primary"
          size="sm"
          @click="reloadNuxtApp()"
        />
      </span>
      <span v-else-if="status === 'pending'">Loading search index…</span>
      <span v-else-if="searchTerm">No results for "{{ searchTerm }}".</span>
      <span v-else>Type to search the docs.</span>
    </template>
  </UContentSearch>
</template>
