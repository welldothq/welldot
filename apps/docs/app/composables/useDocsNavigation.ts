import {
  type DocSection,
  SECTIONS,
  sectionForPath,
  sectionHome,
  sectionNavigation,
} from '~/sections';

/**
 * The current section, its sidebar and the switcher targets. The three collection
 * navigations are fetched once (shared `navigation` key) and filtered per section,
 * so the layout, the header and the page reuse them.
 */
export async function useDocsNavigation() {
  const route = useRoute();

  const { data: navs } = await useAsyncData('navigation', async () => {
    const [docs_en, spec, changelogs] = await Promise.all([
      queryCollectionNavigation('docs_en'),
      queryCollectionNavigation('spec'),
      queryCollectionNavigation('changelogs'),
    ]);
    return { docs_en, spec, changelogs };
  });

  const section = computed(() => sectionForPath(route.path));
  const navigation = computed(() =>
    section.value ? sectionNavigation(section.value, navs.value ?? {}) : [],
  );

  // Switcher targets: a section's first page until its own landing page exists
  const homes = computed(
    () =>
      Object.fromEntries(
        SECTIONS.map(s => [s.id, sectionHome(s, navs.value ?? {})]),
      ) as Record<DocSection['id'], string>,
  );

  return { section, navigation, homes, navs };
}
