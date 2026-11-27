<script setup lang="ts">
import type { Meter, ProductionEntry } from '@welldot/core';
import { ESTIMATION_METHODS, READING_SOURCES } from '@welldot/core';
import { meterLabel } from '~/utils/operationVocab';
import {
  fromProductionForm,
  isPeriodInvalid,
  isProductionFormValid,
  PRODUCTION_FORM_TYPES,
  toProductionForm,
} from './productionEntryForm';

/**
 * The entry being corrected. `null` means "adding a new one". `production`
 * is a ledger: a correction is saved as a NEW entry whose `corrects` points
 * to this one — the original is never edited in place.
 */
const model = defineModel<ProductionEntry | null>({ default: null });
const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{ save: [entry: ProductionEntry] }>();

const { t, locale } = useI18n();
const { vocabOptions } = useVocab();
const profileStore = useProfileStore();
const { volumeUnit, flowUnit, headUnit } = useUnitFormat();

const typeOptions = computed(() =>
  PRODUCTION_FORM_TYPES.map(value => ({
    value,
    label: t(`editor.operation.production.types.${value}`),
  })),
);

const meters = computed<Meter[]>(() =>
  [...(profileStore.well.meters ?? [])].sort(
    (a, b) =>
      new Date(b.installed_at).getTime() - new Date(a.installed_at).getTime(),
  ),
);
const meterOptions = computed(() =>
  meters.value.map(m => ({
    value: m.id,
    label: meterLabel(m, t, locale.value),
  })),
);
const sourceOptions = computed(() => vocabOptions(READING_SOURCES));
const methodOptions = computed(() => vocabOptions(ESTIMATION_METHODS));

/** Local copy — nothing reaches the ledger until Save. Numbers are canonical. */
const form = reactive(toProductionForm(null, null));

const periodInvalid = computed(() => isPeriodInvalid(form));

/** Non-blocking: a reading outside the selected meter's installation window. */
const readingOutsideInstallation = computed(() => {
  if (form.type === 'estimated_volume' || !form.datetime || !form.meterId)
    return false;
  const meter = meters.value.find(m => m.id === form.meterId);
  if (!meter) return false;
  const time = form.datetime.getTime();
  return (
    time < new Date(meter.installed_at).getTime() ||
    (!!meter.removed_at && time > new Date(meter.removed_at).getTime())
  );
});

const isFormValid = computed(() => isProductionFormValid(form));

// `immediate` so the dialog seeds when mounted already open (behind `v-if`).
watch(
  visible,
  open => {
    if (open)
      Object.assign(
        form,
        toProductionForm(
          model.value,
          meters.value.find(m => !m.removed_at)?.id ?? null,
        ),
      );
  },
  { immediate: true },
);

/** Emits a NEW ledger entry (see `fromProductionForm`). */
function save() {
  if (!isFormValid.value) return;
  emit('save', fromProductionForm(form, model.value, crypto.randomUUID()));
  visible.value = false;
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="
      model
        ? t('editor.operation.production.correct')
        : t('editor.operation.production.add')
    "
    :style="{ width: '100vw', maxWidth: '36rem' }"
  >
    <div class="flex flex-col gap-5 pt-2">
      <Message v-if="model" severity="info" size="small" variant="simple">
        {{ t('editor.operation.production.correctInfo') }}
      </Message>

      <SelectButton
        v-model="form.type"
        :options="typeOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        class="self-start flex-wrap"
      />

      <!-- ── Meter reading ──────────────────────────────────────────────── -->
      <template v-if="form.type === 'meter_reading'">
        <Message
          v-if="!meters.length"
          severity="warn"
          size="small"
          variant="simple"
        >
          {{ t('editor.operation.production.noMeters') }}
        </Message>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <WellLabeledField
            :label="t('editor.operation.production.fields.meter')"
          >
            <Select
              v-model="form.meterId"
              :options="meterOptions"
              option-label="label"
              option-value="value"
              :invalid="!form.meterId"
              class="w-full"
            />
          </WellLabeledField>
          <WellLabeledField
            :label="t('editor.operation.production.fields.datetime')"
          >
            <DatePicker
              v-model="form.datetime"
              show-time
              hour-format="24"
              date-format="dd/mm/yy"
              class="w-full"
              :pt="{ pcInput: { root: 'font-mono text-sm w-full' } }"
            />
          </WellLabeledField>
          <WellLabeledField
            :label="t('editor.operation.production.fields.reading')"
            :info="t('editor.operation.production.fields.readingInfo')"
            :info-label="t('editor.fieldInfo')"
          >
            <WellUnitInput
              v-model="form.reading"
              unit-type="volume"
              :min="0"
              :max-fraction-digits="3"
              :suffix="` ${volumeUnit}`"
              class="w-full"
              :pt="{ pcInput: { root: 'w-full font-mono text-sm' } }"
            />
          </WellLabeledField>
          <WellLabeledField
            :label="t('editor.operation.production.fields.source')"
          >
            <WellComboSelect
              v-model="form.source"
              :options="sourceOptions"
              option-label="label"
              option-value="value"
              :hint="t('editor.comboHint')"
              show-clear
              class="w-full"
            />
          </WellLabeledField>
        </div>
        <Message
          v-if="readingOutsideInstallation"
          severity="warn"
          size="small"
          variant="simple"
        >
          {{ t('editor.operation.warnings.reading_outside_installation') }}
        </Message>
      </template>

      <!-- ── Flow reading ───────────────────────────────────────────────── -->
      <template v-else-if="form.type === 'flow_reading'">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <WellLabeledField
            :label="t('editor.operation.production.fields.datetime')"
          >
            <DatePicker
              v-model="form.datetime"
              show-time
              hour-format="24"
              date-format="dd/mm/yy"
              class="w-full"
              :pt="{ pcInput: { root: 'font-mono text-sm w-full' } }"
            />
          </WellLabeledField>
          <WellLabeledField
            :label="t('editor.operation.production.fields.flowRate')"
          >
            <WellUnitInput
              v-model="form.flowRate"
              unit-type="flow"
              :min="0"
              :max-fraction-digits="3"
              :suffix="` ${flowUnit}`"
              :invalid="form.flowRate == null"
              class="w-full"
              :pt="{ pcInput: { root: 'w-full font-mono text-sm' } }"
            />
          </WellLabeledField>
          <WellLabeledField
            :label="t('editor.operation.production.fields.dischargeHead')"
            :info="t('editor.operation.production.fields.dischargeHeadInfo')"
            :info-label="t('editor.fieldInfo')"
          >
            <WellUnitInput
              v-model="form.dischargeHead"
              unit-type="head"
              :max-fraction-digits="3"
              :suffix="` ${headUnit}`"
              class="w-full"
              :pt="{ pcInput: { root: 'w-full font-mono text-sm' } }"
            />
          </WellLabeledField>
          <WellLabeledField
            :label="t('editor.operation.production.fields.meter')"
          >
            <Select
              v-model="form.meterId"
              :options="meterOptions"
              option-label="label"
              option-value="value"
              show-clear
              :disabled="!meterOptions.length"
              placeholder="—"
              class="w-full"
            />
          </WellLabeledField>
          <WellLabeledField
            :label="t('editor.operation.production.fields.source')"
          >
            <WellComboSelect
              v-model="form.source"
              :options="sourceOptions"
              option-label="label"
              option-value="value"
              :hint="t('editor.comboHint')"
              show-clear
              class="w-full"
            />
          </WellLabeledField>
        </div>
        <Message
          v-if="readingOutsideInstallation"
          severity="warn"
          size="small"
          variant="simple"
        >
          {{ t('editor.operation.warnings.reading_outside_installation') }}
        </Message>
      </template>

      <!-- ── Estimated volume ───────────────────────────────────────────── -->
      <template v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <WellLabeledField
            :label="t('editor.operation.production.fields.periodStart')"
          >
            <DatePicker
              v-model="form.periodStart"
              show-time
              hour-format="24"
              date-format="dd/mm/yy"
              class="w-full"
              :pt="{ pcInput: { root: 'font-mono text-sm w-full' } }"
            />
          </WellLabeledField>
          <WellLabeledField
            :label="t('editor.operation.production.fields.periodEnd')"
          >
            <DatePicker
              v-model="form.periodEnd"
              show-time
              hour-format="24"
              date-format="dd/mm/yy"
              class="w-full"
              :invalid="periodInvalid"
              :pt="{ pcInput: { root: 'font-mono text-sm w-full' } }"
            />
          </WellLabeledField>
        </div>
        <Message
          v-if="periodInvalid"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ t('editor.operation.warnings.estimate_period_invalid') }}
        </Message>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <WellLabeledField
            :label="t('editor.operation.production.fields.volume')"
          >
            <WellUnitInput
              v-model="form.volume"
              unit-type="volume"
              :min="0"
              :max-fraction-digits="3"
              :suffix="` ${volumeUnit}`"
              class="w-full"
              :pt="{ pcInput: { root: 'w-full font-mono text-sm' } }"
            />
          </WellLabeledField>
          <WellLabeledField
            :label="t('editor.operation.production.fields.method')"
            :info="t('editor.operation.production.fields.methodInfo')"
            :info-label="t('editor.fieldInfo')"
          >
            <WellComboSelect
              v-model="form.method"
              :options="methodOptions"
              option-label="label"
              option-value="value"
              :hint="t('editor.comboHint')"
              show-clear
              class="w-full"
            />
          </WellLabeledField>
        </div>
      </template>

      <WellLabeledField :label="t('editor.operation.production.fields.notes')">
        <Textarea v-model="form.notes" :rows="2" class="w-full text-sm" />
      </WellLabeledField>
    </div>

    <template #footer>
      <Button
        :label="t('editor.confirmClear.reject')"
        severity="secondary"
        text
        @click="visible = false"
      />
      <Button
        :label="
          model
            ? t('editor.operation.production.saveCorrection')
            : t('editor.operation.production.add')
        "
        :disabled="!isFormValid"
        @click="save"
      />
    </template>
  </Dialog>
</template>
