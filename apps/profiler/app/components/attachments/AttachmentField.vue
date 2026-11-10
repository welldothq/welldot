<script setup lang="ts">
import type { Attachment, DocumentTypeContext } from '@welldot/core';
import { useConfirm } from 'primevue/useconfirm';
import AttachmentDialog from './AttachmentDialog.vue';
import AttachmentPreviewDialog from './AttachmentPreviewDialog.vue';
import AttachmentThumb from './AttachmentThumb.vue';

/**
 * Self-contained attachment editor for one record: a label row with an "add"
 * button, a thumbnail strip (click to preview) with copy / edit / delete
 * actions, the add/edit dialog and the preview dialog. Bind the record's list with `v-model`; every change is
 * emitted as a new array (never mutated in place), so the caller decides
 * where it lands — a local form draft or the store.
 */
const props = withDefaults(
  defineProps<{
    /** Where the attachments live — orders the suggested `document_type`s. */
    context?: DocumentTypeContext;
    /** Thumbnails shown before the "+N more" toggle. */
    visibleCount?: number;
    /** Ask before deleting — use for saved records, not form drafts. */
    confirmDelete?: boolean;
    /** View only: no add / edit / delete, and nothing rendered when empty. */
    readonly?: boolean;
  }>(),
  {
    context: 'history',
    visibleCount: 3,
    confirmDelete: false,
    readonly: false,
  },
);

// A record without attachments passes `undefined`; emitted lists are always arrays.
const model = defineModel<Attachment[]>({ default: () => [] });
const list = computed(() => model.value ?? []);

const { t } = useI18n();
const confirm = useConfirm();
const { copiedAttachmentId, copyAttachmentPath } = useAttachmentDisplay();

const expanded = ref(false);
const shown = computed(() =>
  expanded.value ? list.value : list.value.slice(0, props.visibleCount),
);

// ─── Preview — open in every mode, read-only included ────────────────────────

const previewing = ref<Attachment | null>(null);
const previewVisible = ref(false);

function openPreview(attachment: Attachment) {
  previewing.value = attachment;
  previewVisible.value = true;
}

// ─── Dialog — the draft stays local until the dialog saves ───────────────────

const draft = ref<Attachment | null>(null);
const dialogVisible = ref(false);

function open(attachment: Attachment | null = null) {
  draft.value = attachment;
  dialogVisible.value = true;
}

function upsert(attachment: Attachment) {
  const next = [...list.value];
  const idx = next.findIndex(a => a.id === attachment.id);
  if (idx === -1) next.push(attachment);
  else next[idx] = attachment;
  model.value = next;
}

function remove(attachment: Attachment) {
  const apply = () => {
    model.value = list.value.filter(a => a.id !== attachment.id);
  };
  if (!props.confirmDelete) return apply();
  confirm.require({
    icon: 'ph:warning-duotone',
    header: t('editor.historyLog.logs.deleteAttachment'),
    message: t('editor.historyLog.logs.deleteAttachment'),
    acceptLabel: t('editor.confirmClear.accept'),
    rejectLabel: t('editor.confirmClear.reject'),
    acceptProps: { severity: 'danger' },
    rejectProps: { text: true, severity: 'secondary' },
    defaultFocus: 'reject',
    accept: apply,
  });
}

defineExpose({ open });
</script>

<template>
  <div v-if="!readonly || list.length" class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <span
        class="font-mono text-[10px] tracking-[0.08em] uppercase text-content-400"
      >
        {{ t('editor.historyLog.logs.attachments', { n: list.length }) }}
      </span>
      <button
        v-if="!readonly"
        class="add-attachment-btn"
        type="button"
        @click="open()"
      >
        <Icon name="ph:plus" class="size-3" />
        {{ t('editor.historyLog.logs.addAttachment') }}
      </button>
    </div>

    <div v-if="list.length" class="flex flex-wrap gap-2">
      <AttachmentThumb
        v-for="att in shown"
        :key="att.id"
        :attachment="att"
        :readonly="readonly"
        :copied="copiedAttachmentId === att.id"
        @preview="openPreview(att)"
        @copy="copyAttachmentPath(att)"
        @edit="open(att)"
        @remove="remove(att)"
      />

      <button
        v-if="list.length > visibleCount"
        class="attachment-overflow-btn"
        type="button"
        @click="expanded = !expanded"
      >
        <span v-if="!expanded">
          +{{ list.length - visibleCount }}
          {{ t('editor.historyLog.logs.showMore') }}
        </span>
        <span v-else>{{ t('editor.historyLog.logs.showLess') }}</span>
      </button>
    </div>
  </div>

  <AttachmentDialog
    v-if="!readonly"
    v-model="draft"
    v-model:visible="dialogVisible"
    :context="context"
    @save="upsert"
  />

  <AttachmentPreviewDialog
    v-model:visible="previewVisible"
    :attachment="previewing"
  />
</template>

<style scoped>
.add-attachment-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px dashed var(--color-surface-300);
  background: transparent;
  color: var(--color-content-400);
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition:
    background 120ms ease,
    color 120ms ease,
    border-color 120ms ease;
}

.add-attachment-btn:hover {
  background: var(--color-surface-50);
  color: var(--color-content-200);
  border-color: var(--color-surface-400);
}

.attachment-overflow-btn {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px dashed var(--color-surface-300);
  background: transparent;
  color: var(--color-content-400);
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 120ms ease,
    color 120ms ease;
}

.attachment-overflow-btn:hover {
  background: var(--color-surface-50);
  color: var(--color-primary-500);
}
</style>
