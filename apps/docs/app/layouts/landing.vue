<script setup lang="ts">
// Full-width layout for the home page: the site header without a section sidebar
const { navs } = await useDocsNavigation();
</script>

<template>
  <div class="landing">
    <LayoutSiteHeader :navigation="[]" />
    <LayoutSiteSearch :navs="navs ?? {}" />

    <UMain class="landing-bg">
      <slot />
    </UMain>

    <USeparator />
    <UFooter :ui="{ root: 'py-6', left: 'text-sm text-muted' }">
      <template #left>
        <span>
          Apache 2.0 · the <code class="font-mono text-[13px]">.well</code>
          format and the
          <code class="font-mono text-[13px]">@welldot/*</code> packages
        </span>
      </template>
      <template #right>
        <UButton
          to="https://welldot.org"
          target="_blank"
          label="welldot.org"
          color="neutral"
          variant="ghost"
          size="sm"
        />
        <UButton
          to="/contributing"
          label="Contributing"
          color="neutral"
          variant="ghost"
          size="sm"
        />
        <UButton
          to="https://github.com/welldothq/welldot"
          target="_blank"
          icon="i-ph-github-logo"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
          size="sm"
        />
      </template>
    </UFooter>
  </div>
</template>

<style>
/* welldot.org's hero wash: two soft radial glows (primary blue and a warm accent) */
.landing-bg {
  background:
    radial-gradient(
      900px 520px at 90% -80px,
      color-mix(in oklch, var(--w-primary-400) 16%, transparent),
      transparent 70%
    ),
    radial-gradient(
      600px 420px at 0% 30%,
      color-mix(in oklch, var(--w-warning-400) 9%, transparent),
      transparent 70%
    );
}

/* The emphasized words of the hero title, as on welldot.org */
.landing .landing-em {
  font-style: italic;
  color: var(--ui-primary);
}

/* Page sections center their text; put the card icons on the same axis */
.landing [data-slot='wrapper'] > [data-slot='leading'] {
  align-self: center;
}

/* Sections after the hero sit on a hairline, like welldot.org's bands */
.landing [data-slot='root'] + [data-slot='root'] {
  border-top: 1px solid var(--ui-border);
}
</style>
