<script setup lang="ts">
import type { PdfInfoItem } from '~/stores/pdfExport.store';
import type { WellMetadataFieldKey } from '~/composables/useWellMetadataFields';

const props = defineProps<{
  emptyMessage: string;
  addLabel: string;
  metadataButtonLabel: string;
  labelPlaceholder: string;
  valuePlaceholder: string;
  syncedTooltip: string;
  deleteLabel: string;
}>();

const items = defineModel<PdfInfoItem[]>('items', { default: () => [] });

const profileStore = useProfileStore();
const { metadataFields, resolveMetadataValue } = useWellMetadataFields();

function addBlankItem() {
  items.value.push({ id: crypto.randomUUID(), label: '', value: '' });
}

function removeItem(index: number) {
  items.value.splice(index, 1);
}

const metadataPopover = ref();
const selectedFields = ref<WellMetadataFieldKey[]>([]);

function toggleMetadataPopover(event: Event) {
  selectedFields.value = [];
  metadataPopover.value?.toggle(event);
}

function confirmMetadataFields() {
  const fieldByKey = new Map(metadataFields.value.map(f => [f.key, f.label]));
  for (const key of selectedFields.value) {
    items.value.push({
      id: crypto.randomUUID(),
      label: fieldByKey.get(key) ?? key,
      value: '',
      profileField: key,
    });
  }
  selectedFields.value = [];
  metadataPopover.value?.hide();
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <OrderList
      v-model="items"
      data-key="id"
      scroll-height="16rem"
      :empty-message="props.emptyMessage"
    >
      <template #option="{ option, index }">
        <div
          class="flex items-center gap-2 w-full min-w-0"
          @click.stop
          @mousedown.stop
          @keydown.stop
        >
          <InputText
            v-model="option.label"
            :placeholder="props.labelPlaceholder"
            class="flex-1 min-w-0"
          />
          <InputText
            v-if="option.profileField"
            v-tooltip.top="props.syncedTooltip"
            :model-value="
              resolveMetadataValue(profileStore.well, option.profileField)
            "
            disabled
            class="flex-1 min-w-0"
          />
          <InputText
            v-else
            v-model="option.value"
            :placeholder="props.valuePlaceholder"
            class="flex-1 min-w-0"
          />
          <button
            type="button"
            class="flex size-6 shrink-0 items-center justify-center rounded-md border-none bg-transparent text-content-400 transition-colors duration-100 hover:bg-error-500/10 hover:text-error-500 cursor-pointer"
            :aria-label="props.deleteLabel"
            @click="removeItem(index)"
          >
            <Icon name="ph:x-bold" class="size-3" />
          </button>
        </div>
      </template>
    </OrderList>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-surface-200 text-xs font-medium text-content-400 hover:text-content-0 hover:border-surface-300 transition-colors cursor-pointer bg-transparent"
        @click="addBlankItem"
      >
        <Icon name="ph:plus-bold" class="size-3" />
        {{ props.addLabel }}
      </button>
      <button
        type="button"
        class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-surface-200 text-xs font-medium text-content-400 hover:text-content-0 hover:border-surface-300 transition-colors cursor-pointer bg-transparent"
        @click="toggleMetadataPopover"
      >
        <Icon name="ph:file-text-duotone" class="size-3" />
        {{ props.metadataButtonLabel }}
      </button>
    </div>

    <Popover ref="metadataPopover">
      <div class="flex flex-col gap-2.5 p-1 w-56">
        <label
          v-for="field in metadataFields"
          :key="field.key"
          class="flex items-center gap-2.5 text-sm text-content-0 cursor-pointer"
        >
          <Checkbox v-model="selectedFields" :value="field.key" />
          {{ field.label }}
        </label>
        <Button
          size="small"
          :label="props.addLabel"
          :disabled="selectedFields.length === 0"
          @click="confirmMetadataFields"
        >
          <template #icon>
            <Icon name="ph:plus-bold" class="size-3.5 shrink-0" />
          </template>
        </Button>
      </div>
    </Popover>
  </div>
</template>
