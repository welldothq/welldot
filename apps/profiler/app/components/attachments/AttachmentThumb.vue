<script setup lang="ts">
import type { Attachment } from '@welldot/core';
import { DOCUMENT_TYPES } from '@welldot/core';

/**
 * One attachment tile: a thumbnail (the image itself for image attachments,
 * else the type icon) and the label open the preview; copy / edit / delete
 * sit beside them. Actions are emitted, the parent owns the list.
 */
const props = defineProps<{
  attachment: Attachment;
  readonly: boolean;
  /** The copy-path feedback is showing for this tile. */
  copied: boolean;
}>();

defineEmits<{ preview: []; copy: []; edit: []; remove: [] }>();

const { t } = useI18n();
const { vocabLabel } = useVocab();
const { attachmentIcon, attachmentLabel } = useAttachmentDisplay();

const imageState = ref<'loading' | 'loaded' | 'error'>('loading');
watch(
  () => props.attachment.uri,
  () => {
    imageState.value = 'loading';
  },
);

const showImage = computed(
  () =>
    attachmentPreviewKind(props.attachment) === 'image' &&
    imageState.value !== 'error',
);
</script>

<template>
  <div class="attachment-thumb">
    <button
      type="button"
      class="thumb-open"
      :aria-label="
        t('editor.attachments.preview', { name: attachmentLabel(attachment) })
      "
      :title="attachment.description ?? attachment.uri"
      @click="$emit('preview')"
    >
      <span
        class="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-100"
      >
        <template v-if="showImage">
          <span
            v-if="imageState === 'loading'"
            class="absolute inset-0 animate-pulse bg-surface-200"
          />
          <img
            :key="attachment.uri"
            :src="attachment.uri"
            alt=""
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
            class="size-full object-cover"
            @load="imageState = 'loaded'"
            @error="imageState = 'error'"
          />
        </template>
        <Icon
          v-else
          :name="attachmentIcon(attachment.media_type)"
          class="size-5 text-content-300"
        />
      </span>
      <span class="flex min-w-0 flex-1 flex-col text-left">
        <span class="thumb-label truncate font-mono text-content-300">
          {{ attachmentLabel(attachment) }}
        </span>
        <span
          v-if="attachment.document_type"
          class="thumb-type truncate uppercase tracking-wider text-content-500"
        >
          {{ vocabLabel(DOCUMENT_TYPES, attachment.document_type) }}
        </span>
      </span>
    </button>

    <div class="flex shrink-0 items-center gap-1">
      <button
        class="thumb-action"
        type="button"
        :aria-label="t('editor.historyLog.logs.copyPath')"
        :title="
          copied
            ? t('editor.historyLog.logs.copied')
            : t('editor.historyLog.logs.copyPath')
        "
        @click="$emit('copy')"
      >
        <Icon
          :name="copied ? 'ph:check-bold' : 'ph:copy-duotone'"
          class="size-3"
        />
      </button>
      <button
        v-if="!readonly"
        class="thumb-action"
        type="button"
        :aria-label="t('editor.historyLog.logs.editAttachment')"
        @click="$emit('edit')"
      >
        <Icon name="ph:pencil-simple-duotone" class="size-3" />
      </button>
      <button
        v-if="!readonly"
        class="thumb-action thumb-action--danger"
        type="button"
        :aria-label="t('editor.historyLog.logs.deleteAttachment')"
        @click="$emit('remove')"
      >
        <Icon name="ph:trash-duotone" class="size-3" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.attachment-thumb {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 4px;
  border-radius: 8px;
  border: 1px solid var(--color-surface-200);
  background: var(--color-surface-50);
  max-width: 220px;
  min-width: 120px;
}

.thumb-open {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: none;
  cursor: pointer;
}

.thumb-open:hover .thumb-label {
  color: var(--color-primary-500);
}

.thumb-open:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

.thumb-label {
  font-size: 10px;
}

.thumb-type {
  font-size: 9px;
}

.thumb-action {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 2px;
  border-radius: 4px;
  color: var(--color-content-400);
  cursor: pointer;
  transition:
    color 100ms ease,
    background 100ms ease;
}

.thumb-action:hover {
  background: var(--color-surface-100);
  color: var(--color-content-100);
}

.thumb-action--danger:hover {
  background: color-mix(in srgb, var(--color-error-500) 10%, transparent);
  color: var(--color-error-500);
}
</style>
