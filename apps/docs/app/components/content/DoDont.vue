<script setup lang="ts">
// MDC: ::do-dont with a #do and a #dont slot (text and optional fenced blocks)
defineSlots<{ do?: () => unknown; dont?: () => unknown }>();

const columns = [
  {
    slot: 'do',
    label: 'Do',
    icon: 'i-lucide-check',
    tone: 'border-success/30',
    head: 'bg-success/8 text-success border-success/20',
    badge: 'bg-success text-inverted',
  },
  {
    slot: 'dont',
    label: "Don't",
    icon: 'i-lucide-x',
    tone: 'border-error/30',
    head: 'bg-error/8 text-error border-error/20',
    badge: 'bg-error text-inverted',
  },
] as const;
</script>

<template>
  <div class="my-6 grid gap-3 sm:grid-cols-2">
    <section
      v-for="col in columns"
      :key="col.slot"
      data-do-dont
      :class="[
        'flex min-w-0 flex-col overflow-hidden rounded-lg border bg-default',
        col.tone,
      ]"
    >
      <header
        :class="[
          'flex items-center gap-2 border-b px-4 py-2 font-mono text-[11px] font-medium tracking-wider uppercase',
          col.head,
        ]"
      >
        <span
          :class="[
            'inline-flex size-4 items-center justify-center rounded-full',
            col.badge,
          ]"
        >
          <UIcon :name="col.icon" class="size-3" />
        </span>
        {{ col.label }}
      </header>
      <div
        class="min-w-0 px-4 py-3 text-sm/6 *:first:mt-0 *:last:mb-0 [&_pre]:my-3"
      >
        <slot :name="col.slot" />
      </div>
    </section>
  </div>
</template>
