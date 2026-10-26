<script setup lang="ts">
/**
 * Live `.well` preview: the source (collapsible) next to the profile drawn by `@welldot/render`.
 *
 * MDC:
 *   ::well-preview{example="irece-ba-carste-bambui"}   a file from packages/core/examples
 *   ::
 *   ::well-preview                                      an inline, complete .well document
 *   ```well
 *   { … }
 *   ```
 *   ::
 *
 * Everything runs in `onMounted`, so nothing is validated or drawn during SSR or prerender;
 * the server sends the source and a skeleton. Invalid input shows the `validateWell` errors,
 * and a renderer failure on schema-valid data shows its message, never a blank box.
 */
import type { DeepPartial, WellTheme } from '@welldot/render';
import type { Well } from '@welldot/core';
import { parseWell } from '@welldot/core';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { getExample } from '~/utils/examples';
import { validateWell, type WellIssue } from '#shared/utils/validate-well';

const props = withDefaults(
  defineProps<{
    /** Id of a file in `packages/core/examples` (without `.well`). */
    example?: string;
    /** Inline source; otherwise read from the slot's `well` fence. */
    code?: string;
    /** Height of the drawing in px. */
    height?: number;
  }>(),
  { example: undefined, code: undefined, height: 560 },
);

const MARGINS = { top: 24, right: 16, bottom: 20, left: 48 };
const MAX_ERRORS = 20;

// Same dark overrides as the profiler canvas (apps/profiler WellCanvas.vue)
const DARK_THEME: DeepPartial<WellTheme> = {
  labels: {
    color: 'rgba(255,255,255,0.55)',
    bodyColor: 'rgba(255,255,255,0.40)',
    dividerStroke: 'rgba(255,255,255,0.15)',
    annotationBg: '#1a2230',
    depthTipFill: '#2a3344',
  },
  constructionLabels: {
    labelFill: '#1a2230',
    labelColor: 'rgba(255,255,255,0.65)',
  },
  unitLabels: {
    geologicFill: '#2a3344',
    aquiferFill: '#1e3250',
    stroke: 'rgba(255,255,255,0.15)',
  },
};

type Status = 'loading' | 'unknown' | 'invalid' | 'error' | 'ready';

const status = ref<Status>('loading');
const mounted = ref(false);
const source = ref<string>();
const errors = ref<WellIssue[]>([]);
const failure = ref('');
/** Set when the renderer fails on schema-valid data; cleared by the next successful draw. */
const drawError = ref('');
const open = ref(true);
const isDark = ref(false);

const svgId = `well-preview-${Math.random().toString(36).slice(2, 10)}`;
const canvasRef = ref<HTMLElement | null>(null);
const sourceRef = ref<HTMLElement | null>(null);

const label = computed(() =>
  props.example ? `${props.example}.well` : 'inline .well',
);
const shownErrors = computed(() => errors.value.slice(0, MAX_ERRORS));

let well: Well | null = null;
let renderToken = 0;
let lastWidth = 0;
let resizeTimer: ReturnType<typeof setTimeout> | undefined;
let resizeObserver: ResizeObserver | null = null;
let classObserver: MutationObserver | null = null;

async function load(): Promise<string | undefined> {
  if (props.example) {
    try {
      return await getExample(props.example);
    } catch {
      status.value = 'unknown';
      return undefined;
    }
  }
  // The slot's fence is rendered in the source column; its <pre> holds the raw text
  return (
    props.code ??
    sourceRef.value?.querySelector('pre')?.textContent ??
    sourceRef.value?.textContent ??
    ''
  );
}

async function draw() {
  const el = canvasRef.value;
  if (!el || !well) return;
  const token = ++renderToken;
  let failed = false;
  // WellRenderer.draw() catches its own drawing errors and reports them through onError
  const fail = (e: unknown) => {
    if (token !== renderToken) return; // a stale draw must not overwrite a newer result
    failed = true;
    drawError.value = e instanceof Error ? e.message : String(e);
  };
  try {
    // Loaded on demand: keeps d3 and the textures out of the server build and the main chunk
    const { WellRenderer, INTERACTIVE_RENDER_CONFIG, applyRenderLocale } =
      await import('@welldot/render');
    lastWidth = el.clientWidth;
    const renderer = new WellRenderer(
      [
        {
          selector: `#${svgId}`,
          width: Math.max(lastWidth - MARGINS.left - MARGINS.right, 120),
          height: Math.max(props.height - MARGINS.top - MARGINS.bottom, 120),
          margins: MARGINS,
        },
      ],
      {
        // The renderer defaults to 'pt'; its labels and tooltip text are resolved into the
        // render config by applyRenderLocale, as the profiler canvas does
        locale: 'en',
        onError: fail,
        // No wheel zoom or drag pan: on a docs page they would capture the page scroll
        renderConfig: {
          ...applyRenderLocale(INTERACTIVE_RENDER_CONFIG, 'en'),
          zoom: false,
          pan: false,
        },
        ...(isDark.value && { theme: DARK_THEME }),
      },
    );
    await renderer.prepareSvg();
    if (token !== renderToken) return; // a newer draw started meanwhile
    renderer.draw(well);
    if (!failed && token === renderToken) drawError.value = '';
  } catch (e) {
    fail(e);
  }
}

function onResize() {
  const width = canvasRef.value?.clientWidth ?? 0;
  if (!width || width === lastWidth) return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(draw, 150);
}

onMounted(async () => {
  mounted.value = true;
  isDark.value = document.documentElement.classList.contains('dark-mode');
  classObserver = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark-mode');
  });
  classObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  const text = await load();
  if (text === undefined) return;
  source.value = text;

  const result = validateWell(text);
  if (!result.valid) {
    errors.value = result.errors;
    status.value = 'invalid';
    return;
  }
  try {
    well = parseWell(text);
  } catch (e) {
    failure.value = e instanceof Error ? e.message : String(e);
    status.value = 'error';
    return;
  }

  status.value = 'ready';
  await nextTick();
  await draw();

  if (canvasRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(canvasRef.value);
  }
});

watch(isDark, () => {
  if (status.value === 'ready') draw();
});

// The source column opening or closing changes the drawing width
watch(open, () => nextTick(onResize));

onBeforeUnmount(() => {
  renderToken++;
  clearTimeout(resizeTimer);
  resizeObserver?.disconnect();
  classObserver?.disconnect();
});
</script>

<template>
  <div
    class="not-prose my-6 overflow-hidden rounded-lg border border-default bg-default"
  >
    <header
      class="flex items-center gap-2 border-b border-default bg-muted px-3 py-1.5"
    >
      <UIcon name="i-lucide-layers" class="size-4 shrink-0 text-primary" />
      <span class="docs-label shrink-0 whitespace-nowrap text-toned"
        >Live preview</span
      >
      <span class="min-w-0 truncate font-mono text-xs text-muted">
        {{ label }}
      </span>
      <UButton
        class="ms-auto"
        color="neutral"
        variant="ghost"
        size="xs"
        :icon="open ? 'i-lucide-panel-left-close' : 'i-lucide-braces'"
        :label="open ? 'Hide source' : 'Show source'"
        :aria-expanded="open"
        @click="open = !open"
      />
    </header>

    <div :class="['grid', open && 'lg:grid-cols-2']">
      <!-- Source -->
      <UCollapsible
        v-model:open="open"
        :unmount-on-hide="false"
        class="min-w-0 border-t border-default lg:border-t-0 lg:border-e"
      >
        <template #content>
          <div
            ref="sourceRef"
            class="overflow-auto [&_pre]:my-0! [&_pre]:rounded-none [&_pre]:border-0 [&>div]:my-0"
            :style="{ maxHeight: `${height}px` }"
          >
            <slot v-if="!example" />
            <ProsePre
              v-else-if="source"
              :code="source"
              language="json"
              class="text-xs/5"
            >
              {{ source }}
            </ProsePre>
          </div>
        </template>
      </UCollapsible>

      <!-- Drawing, validation errors or failure -->
      <div class="relative order-first min-w-0 lg:order-none">
        <div
          v-if="status === 'loading'"
          class="p-4"
          :style="{ height: `${height}px` }"
        >
          <USkeleton class="size-full" />
        </div>

        <div v-else-if="status === 'unknown'" class="p-4">
          <UAlert
            color="error"
            variant="subtle"
            icon="i-lucide-file-question"
            title="Unknown example"
            :description="`There is no example named “${example}” in packages/core/examples.`"
          />
        </div>

        <div v-else-if="status === 'invalid'" class="p-4">
          <UAlert
            color="error"
            variant="subtle"
            icon="i-lucide-circle-alert"
            :title="`Not a valid .well file (${errors.length} ${errors.length === 1 ? 'error' : 'errors'})`"
          >
            <template #description>
              <ul data-well-errors class="mt-1 space-y-1">
                <li
                  v-for="(error, i) in shownErrors"
                  :key="i"
                  class="flex flex-wrap gap-x-2"
                >
                  <code class="font-mono text-xs font-medium">{{
                    error.path || '(root)'
                  }}</code>
                  <span>{{ error.message }}</span>
                </li>
                <li v-if="errors.length > shownErrors.length" class="italic">
                  and {{ errors.length - shownErrors.length }} more
                </li>
              </ul>
            </template>
          </UAlert>
        </div>

        <!-- parseWell failed after validation passed (defensive) -->
        <div v-else-if="status === 'error'" class="p-4">
          <UAlert
            color="error"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            title="The profile could not be drawn"
            :description="failure"
          />
        </div>

        <!-- Over the drawing, which stays laid out so a resize or theme change can redraw it -->
        <div
          v-if="status === 'ready' && drawError"
          class="absolute inset-x-4 top-4 z-10"
        >
          <UAlert
            color="error"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            title="The profile could not be drawn"
            :description="drawError"
          />
        </div>

        <div
          v-show="status === 'ready'"
          ref="canvasRef"
          class="w-full"
          :style="{ height: `${height}px` }"
        >
          <svg
            v-if="mounted"
            :id="svgId"
            class="block"
            style="overflow: visible"
          />
        </div>
      </div>
    </div>
  </div>
</template>
