<script setup lang="ts">
// A ```mermaid fence (routed here by ProsePre). Client only; mermaid is imported on demand so it
// stays out of the server build and the main chunk. Colors come from the Welldot tokens and the
// diagram is drawn again when the color mode changes.
const props = defineProps<{ code: string }>();

const colorMode = useColorMode();
const svg = ref('');
const failure = ref('');
const baseId = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
let token = 0;

const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function themeVariables(dark: boolean) {
  const surface = (step: number) => cssVar(`--w-surface-${step}`);
  const content = (step: number) => cssVar(`--w-content-${step}`);
  const primary = (step: number) => cssVar(`--w-primary-${step}`);
  return {
    darkMode: dark,
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    fontSize: '14px',
    background: surface(0),
    primaryColor: dark ? primary(950) : primary(50),
    primaryBorderColor: dark ? primary(400) : primary(500),
    primaryTextColor: content(50),
    secondaryColor: surface(100),
    secondaryBorderColor: surface(300),
    secondaryTextColor: content(100),
    tertiaryColor: surface(50),
    tertiaryBorderColor: surface(200),
    tertiaryTextColor: content(100),
    lineColor: content(400),
    textColor: content(200),
    clusterBkg: surface(50),
    clusterBorder: surface(200),
    edgeLabelBackground: surface(0),
    noteBkgColor: surface(100),
    noteBorderColor: surface(300),
    noteTextColor: content(100),
  };
}

async function render() {
  const current = ++token;
  // Let the color-mode class land on <html> before reading the tokens
  await nextTick();
  await new Promise(resolve => requestAnimationFrame(resolve));

  const dark = document.documentElement.classList.contains('dark-mode');
  const id = `${baseId}-${current}`;
  try {
    const { default: mermaid } = await import('mermaid');
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      themeVariables: themeVariables(dark),
    });
    const result = await mermaid.render(id, props.code);
    if (current !== token) return;
    svg.value = result.svg;
    failure.value = '';
  } catch (e) {
    if (current !== token) return;
    failure.value = e instanceof Error ? e.message : String(e);
    // mermaid leaves its scratch element behind when parsing fails
    document.getElementById(`d${id}`)?.remove();
  }
}

onMounted(render);
watch(() => colorMode.value, render);
watch(() => props.code, render);
</script>

<template>
  <figure
    class="not-prose my-6 overflow-x-auto rounded-lg border border-default bg-default p-4 sm:p-6"
    data-mermaid
  >
    <UAlert
      v-if="failure"
      color="error"
      variant="subtle"
      icon="i-lucide-triangle-alert"
      title="The diagram could not be drawn"
      :description="failure"
    />
    <!-- mermaid output, sanitized by mermaid itself (securityLevel: 'strict') -->
    <!-- eslint-disable vue/no-v-html -->
    <div
      v-else-if="svg"
      class="flex justify-center [&_svg]:h-auto [&_svg]:max-w-full"
      v-html="svg"
    />
    <!-- eslint-enable vue/no-v-html -->
    <USkeleton v-else class="h-40 w-full" />
  </figure>
</template>
