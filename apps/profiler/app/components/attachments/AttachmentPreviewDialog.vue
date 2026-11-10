<script setup lang="ts">
import type { Attachment } from '@welldot/core';
import { DOCUMENT_TYPES } from '@welldot/core';

/**
 * Read-only preview of one attachment: image, PDF, video or audio rendered
 * with native elements, plus an "open in new tab" link. The URI may be
 * unreachable (spec: consumers handle fetch failures gracefully), so a failed
 * load shows a message instead of a broken element.
 */
const props = defineProps<{ attachment: Attachment | null }>();
const visible = defineModel<boolean>('visible', { default: false });

const { t } = useI18n();
const { vocabLabel } = useVocab();
const { attachmentIcon, attachmentLabel } = useAttachmentDisplay();

const kind = computed(() =>
  props.attachment ? attachmentPreviewKind(props.attachment) : 'none',
);
const loadable = computed(
  () => !!props.attachment && isLoadableUri(props.attachment.uri),
);

const status = ref<'loading' | 'loaded' | 'error'>('loading');
watch(
  [visible, () => props.attachment?.uri],
  () => {
    status.value = 'loading';
  },
  { immediate: true },
);

/**
 * Escape closes only this dialog. PrimeVue's own handler listens on
 * `document` in every open Dialog and closes each of them, so a preview
 * opened from a view dialog would take its parent down too. A capture
 * listener on `window` runs first and stops the event there.
 */
function onEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape' || event.isComposing) return;
  event.stopPropagation();
  visible.value = false;
}

watch(visible, open => {
  if (open) window.addEventListener('keydown', onEscape, true);
  else window.removeEventListener('keydown', onEscape, true);
});
onBeforeUnmount(() => window.removeEventListener('keydown', onEscape, true));

const onLoad = () => (status.value = 'loaded');
const onError = () => (status.value = 'error');
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    maximizable
    dismissable-mask
    :close-on-escape="false"
    :header="attachment ? attachmentLabel(attachment) : ''"
    :style="{ width: '56rem' }"
    :breakpoints="{ '640px': '95vw' }"
  >
    <div v-if="attachment" class="flex flex-col gap-3">
      <div
        v-if="attachment.document_type || attachment.description"
        class="flex flex-col gap-1 text-sm text-content-400"
      >
        <span
          v-if="attachment.document_type"
          class="font-mono text-xs uppercase tracking-wider"
        >
          {{ vocabLabel(DOCUMENT_TYPES, attachment.document_type) }}
        </span>
        <p v-if="attachment.description" class="m-0">
          {{ attachment.description }}
        </p>
      </div>

      <Message v-if="status === 'error'" severity="error">
        <template #icon>
          <Icon name="ph:warning-circle-duotone" class="size-4 shrink-0" />
        </template>
        {{ t('editor.attachments.previewFailed') }}
      </Message>

      <div
        v-else-if="kind !== 'none'"
        class="preview-stage relative flex items-center justify-center rounded-lg bg-surface-100 overflow-hidden"
        :class="{ 'preview-stage--frame': kind === 'pdf' }"
      >
        <div
          v-if="status === 'loading'"
          class="absolute inset-0 animate-pulse bg-surface-100"
        />
        <img
          v-if="kind === 'image'"
          :key="attachment.uri"
          :src="attachment.uri"
          :alt="attachment.description ?? attachmentLabel(attachment)"
          referrerpolicy="no-referrer"
          class="preview-media object-contain"
          @load="onLoad"
          @error="onError"
        />
        <iframe
          v-else-if="kind === 'pdf'"
          :key="attachment.uri"
          :src="attachment.uri"
          :title="attachmentLabel(attachment)"
          referrerpolicy="no-referrer"
          class="size-full bg-surface-0"
          @load="onLoad"
        />
        <video
          v-else-if="kind === 'video'"
          :key="attachment.uri"
          :src="attachment.uri"
          controls
          preload="metadata"
          class="preview-media"
          @loadeddata="onLoad"
          @error="onError"
        />
        <audio
          v-else-if="kind === 'audio'"
          :key="attachment.uri"
          :src="attachment.uri"
          controls
          preload="metadata"
          class="relative w-full p-4"
          @loadeddata="onLoad"
          @error="onError"
        />
      </div>

      <div
        v-else
        class="flex flex-col items-center gap-3 rounded-lg bg-surface-50 px-6 py-12 text-center"
      >
        <Icon
          :name="attachmentIcon(attachment.media_type)"
          class="size-12 text-content-400"
        />
        <span class="text-sm text-content-300">
          {{
            loadable
              ? t('editor.attachments.previewUnavailable')
              : t('editor.attachments.notReachable')
          }}
        </span>
      </div>
    </div>

    <template v-if="loadable && attachment" #footer>
      <Button
        as="a"
        :href="attachment.uri"
        target="_blank"
        rel="noopener noreferrer"
        severity="secondary"
        text
        :label="t('editor.attachments.openInNewTab')"
      >
        <template #icon>
          <Icon name="ph:arrow-square-out-duotone" class="size-4" />
        </template>
      </Button>
    </template>
  </Dialog>
</template>

<style scoped>
.preview-stage {
  min-height: 12rem;
}

.preview-stage--frame {
  height: 75vh;
}

.preview-media {
  position: relative;
  display: block;
  max-width: 100%;
  max-height: 75vh;
}
</style>
