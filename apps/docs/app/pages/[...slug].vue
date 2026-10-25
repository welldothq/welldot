<script setup lang="ts">
import { surroundFor } from '~/sections';
import { droppedTitleId, dropTitleHeading } from '~/utils/drop-title-heading';

// The layout comes from the page's frontmatter (`layout: landing`), so it is chosen here
definePageMeta({ layout: false });

const route = useRoute();

// Native pages first, then the spec and changelog collections rendered in place
const { data } = await useAsyncData(`page-${route.path}`, async () => {
  for (const collection of ['docs_en', 'spec', 'changelogs'] as const) {
    const page = await queryCollection(collection).path(route.path).first();
    if (page) return { collection, page };
  }
  return null;
});

if (!data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
    fatal: true,
  });
}

const page = computed(() => data.value!.page);

// Frontmatter keys outside the collection schema land in `meta`
const layout = computed(() =>
  (page.value.meta as { layout?: string } | undefined)?.layout === 'landing'
    ? 'landing'
    : 'default',
);

const { section, navigation } = await useDocsNavigation();

// UPageHeader shows the title; drop the body's leading `#` heading only when it repeats it
const content = computed(() => ({
  ...page.value,
  body: dropTitleHeading(page.value.body, page.value.title),
}));

// Keeps the removed heading's anchor, which the spec's own table of contents links to
const titleId = computed(() =>
  droppedTitleId(page.value.body, page.value.title),
);

// Spec and changelog descriptions are derived from their first paragraph; only native pages set one
const description = computed(() =>
  data.value!.collection === 'docs_en' ? page.value.description : undefined,
);

// The sidebar group the page sits in, else the section
const headline = computed(() => {
  const group = navigation.value.find(item =>
    item.children?.some(child => child.path === route.path),
  );
  return group?.title ?? section.value?.title;
});

// Prev/next in sidebar order, so the pager follows the spec reading order across collections
const surround = computed(() => {
  const links = surroundFor(navigation.value, route.path);
  return links.some(Boolean) ? links : undefined;
});

// A changelog's `#` heading is the package name, which the headline already shows
const title = computed(() =>
  data.value!.collection === 'changelogs' ? 'Changelog' : page.value.title,
);

const toc = computed(() => page.value.body.toc?.links ?? []);

useSeoMeta({
  title:
    data.value!.collection === 'changelogs'
      ? `${page.value.title} changelog`
      : page.value.title,
  description: description.value,
});
</script>

<template>
  <NuxtLayout v-if="layout === 'landing'" name="landing">
    <ContentRenderer :value="page" />
  </NuxtLayout>
  <NuxtLayout v-else name="default">
    <UPage>
      <span v-if="titleId" :id="titleId" />
      <UPageHeader
        :title="title"
        :description="description"
        :headline="headline"
      />

      <UPageBody>
        <ContentRenderer :value="content" />

        <template v-if="surround">
          <USeparator />
          <UContentSurround :surround="surround" />
        </template>
      </UPageBody>

      <template #right>
        <UContentToc
          v-if="toc.length"
          :links="toc"
          title="On this page"
          highlight
        >
          <template #bottom>
            <LayoutPageActions :page="page" />
          </template>
        </UContentToc>
        <LayoutPageActions v-else :page="page" />
      </template>
    </UPage>
  </NuxtLayout>
</template>
