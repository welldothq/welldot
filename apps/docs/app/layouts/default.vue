<script setup lang="ts">
const { section, navigation, navs } = await useDocsNavigation();
</script>

<template>
  <div>
    <LayoutSiteHeader :navigation="navigation" />
    <LayoutSiteSearch :navs="navs ?? {}" />

    <UMain>
      <UContainer>
        <UPage>
          <template v-if="section" #left>
            <UPageAside>
              <p class="docs-label mb-3">{{ section.title }}</p>
              <UContentNavigation
                v-if="navigation.length"
                :navigation="navigation"
                highlight
              />
              <p v-else class="text-sm text-dimmed">No pages yet.</p>
            </UPageAside>
          </template>

          <slot />
        </UPage>
      </UContainer>
    </UMain>
  </div>
</template>
