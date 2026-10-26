<script setup lang="ts">
defineProps<{
  title: string;
  path: string;
  href: string;
  linkLabel: string;
  /** Optional page on docs.welldot.org, shown before the source link. */
  docsHref?: string;
  docsLabel?: string;
}>();

const linkClass =
  'font-mono text-[11px] tracking-[0.04em] text-primary-500 inline-flex items-center gap-1 ' +
  'no-underline hover:underline underline-offset-2';
</script>

<template>
  <div
    class="glass rounded-3.5 p-5.5 flex flex-col hover:-translate-y-0.5 transition-transform duration-200"
  >
    <div
      class="font-mono text-[10px] tracking-[0.12em] text-primary-500 mb-1.5"
    >
      {{ path }}
    </div>
    <h3
      class="font-serif text-[20px] font-medium tracking-[-0.01em] text-content-0 mb-1.5"
    >
      {{ title }}
    </h3>
    <p
      class="font-display text-[14px] leading-normal text-content-400 mb-3 flex-1"
    >
      <slot />
    </p>
    <div class="flex flex-wrap gap-x-4 gap-y-1">
      <a
        v-if="docsHref"
        :href="docsHref"
        target="_blank"
        rel="noopener"
        :class="linkClass"
      >
        <Icon name="ph:book-open-duotone" size="14" />
        {{ docsLabel }}
      </a>
      <a :href="href" target="_blank" rel="noopener" :class="linkClass">
        <Icon name="ph:github-logo-duotone" size="14" />
        {{ linkLabel }}
      </a>
    </div>
  </div>
</template>
