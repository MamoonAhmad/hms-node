import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  ADRENAL_CONCERN_OPTIONS,
  BONE_STATUS_OPTIONS,
  CALCIUM_STATUS_OPTIONS,
  DEXA_SITE_OPTIONS,
  ENDO_PLAN_OPTIONS,
  FOLLOW_UP_INTERVAL_OPTIONS,
  HORMONE_VISIT_TYPE_OPTIONS,
  YES_NO_OPTIONS,
} from './endocrinologyConstants';
import { toggleListValue } from './endocrinologyUtils';

export function HormoneBoneAdrenalForm({ value, onChange, onOpenOrders, onOpenReferrals }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Broader endocrine workup for adrenal, bone/mineral, and pituitary / gonadal hormone
        evaluation with an actionable plan.
      </p>

      <SectionCard
        title="A. Visit & chief concern"
        description="Reason for broader endocrine evaluation."
        accent="info"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Examination Date" required>
            <TextInput
              type="date"
              value={value.examinationDate}
              onChange={(v) => set('examinationDate', v)}
            />
          </Field>
          <Field label="Provider" required>
            <TextInput
              value={value.provider}
              onChange={(v) => set('provider', v)}
              placeholder="Encounter provider"
            />
          </Field>
          <Field label="Visit Type">
            <TextSelect
              value={value.visitType}
              onChange={(v) => set('visitType', v)}
              options={HORMONE_VISIT_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Chief Concern" className="sm:col-span-3">
            <TextTextarea
              value={value.chiefConcern}
              onChange={(v) => set('chiefConcern', v)}
              placeholder="Fatigue, fractures, adrenal mass, amenorrhea…"
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="B. Adrenal workup"
        description="Cortisol axis, aldosterone/renin, and catecholamines."
        accent="warning"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Adrenal Concern">
            <TextSelect
              value={value.adrenalConcern}
              onChange={(v) => set('adrenalConcern', v)}
              options={ADRENAL_CONCERN_OPTIONS}
            />
          </Field>
          <Field label="Morning Cortisol">
            <TextInput
              value={value.morningCortisol}
              onChange={(v) => set('morningCortisol', v)}
              placeholder="µg/dL"
            />
          </Field>
          <Field label="ACTH">
            <TextInput value={value.acth} onChange={(v) => set('acth', v)} placeholder="pg/mL" />
          </Field>
          <Field label="Cosyntropin / Dynamic Testing">
            <TextInput
              value={value.cosyntropinResult}
              onChange={(v) => set('cosyntropinResult', v)}
              placeholder="Peak cortisol…"
            />
          </Field>
          <Field label="Aldosterone">
            <TextInput value={value.aldosterone} onChange={(v) => set('aldosterone', v)} />
          </Field>
          <Field label="Plasma Renin">
            <TextInput value={value.plasmaRenin} onChange={(v) => set('plasmaRenin', v)} />
          </Field>
          <Field label="Metanephrines">
            <TextInput value={value.metanephrines} onChange={(v) => set('metanephrines', v)} />
          </Field>
          <Field label="Adrenal Imaging">
            <TextInput
              value={value.adrenalImaging}
              onChange={(v) => set('adrenalImaging', v)}
              placeholder="CT/MRI summary"
            />
          </Field>
          <Field label="Adrenal Notes" className="sm:col-span-3">
            <TextTextarea
              value={value.adrenalNotes}
              onChange={(v) => set('adrenalNotes', v)}
              placeholder="Steroid exposure, illness, stress-dose needs…"
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="C. Bone & mineral"
        description="DEXA, calcium/PTH/Vit D, and fracture risk."
        accent="primary"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Bone Status">
            <TextSelect
              value={value.boneStatus}
              onChange={(v) => set('boneStatus', v)}
              options={BONE_STATUS_OPTIONS}
            />
          </Field>
          <Field label="DEXA Date">
            <TextInput type="date" value={value.dexaDate} onChange={(v) => set('dexaDate', v)} />
          </Field>
          <Field label="Calcium Status">
            <TextSelect
              value={value.calciumStatus}
              onChange={(v) => set('calciumStatus', v)}
              options={CALCIUM_STATUS_OPTIONS}
            />
          </Field>
          <Field label="T-score Spine">
            <TextInput
              value={value.tScoreSpine}
              onChange={(v) => set('tScoreSpine', v)}
              placeholder="-2.6"
            />
          </Field>
          <Field label="T-score Hip">
            <TextInput
              value={value.tScoreHip}
              onChange={(v) => set('tScoreHip', v)}
              placeholder="-1.8"
            />
          </Field>
          <Field label="Fracture History">
            <TextSelect
              value={value.fractureHistory}
              onChange={(v) => set('fractureHistory', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
          <Field label="Serum Calcium">
            <TextInput value={value.serumCalcium} onChange={(v) => set('serumCalcium', v)} />
          </Field>
          <Field label="Ionized Calcium">
            <TextInput value={value.ionizedCalcium} onChange={(v) => set('ionizedCalcium', v)} />
          </Field>
          <Field label="PTH">
            <TextInput value={value.pth} onChange={(v) => set('pth', v)} />
          </Field>
          <Field label="25-OH Vitamin D">
            <TextInput value={value.vitaminD} onChange={(v) => set('vitaminD', v)} />
          </Field>
          <Field label="Phosphate">
            <TextInput value={value.phosphate} onChange={(v) => set('phosphate', v)} />
          </Field>
          <Field label="Bone Therapy">
            <TextInput
              value={value.boneTherapy}
              onChange={(v) => set('boneTherapy', v)}
              placeholder="Bisphosphonate, denosumab, Ca/Vit D…"
            />
          </Field>
        </div>
        <Field label="DEXA Sites Reviewed">
          <MultiSelectChips
            values={value.dexaSites || []}
            options={DEXA_SITE_OPTIONS}
            onToggle={(opt) => set('dexaSites', toggleListValue(value.dexaSites, opt))}
            idPrefix="endo-dexa"
          />
        </Field>
        <Field label="Bone / Calcium Notes">
          <TextTextarea
            value={value.boneNotes}
            onChange={(v) => set('boneNotes', v)}
            placeholder="FRAX, glucocorticoid exposure, fall risk…"
            rows={2}
          />
        </Field>
      </SectionCard>

      <SectionCard title="D. Other endocrine labs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Prolactin">
            <TextInput value={value.prolactin} onChange={(v) => set('prolactin', v)} />
          </Field>
          <Field label="IGF-1">
            <TextInput value={value.igf1} onChange={(v) => set('igf1', v)} />
          </Field>
          <Field label="Testosterone">
            <TextInput value={value.testosterone} onChange={(v) => set('testosterone', v)} />
          </Field>
          <Field label="Estradiol">
            <TextInput value={value.estradiol} onChange={(v) => set('estradiol', v)} />
          </Field>
          <Field label="LH / FSH">
            <TextInput value={value.lhFsh} onChange={(v) => set('lhFsh', v)} placeholder="LH / FSH" />
          </Field>
          <Field label="Other Endocrine Labs" className="sm:col-span-3">
            <TextTextarea
              value={value.otherLabs}
              onChange={(v) => set('otherLabs', v)}
              placeholder="SHBG, DHEA-S, 17-OHP, urine free cortisol…"
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="E. Plan & follow-up" accent="success">
        <Field label="Plan Items">
          <MultiSelectChips
            values={value.planItems || []}
            options={ENDO_PLAN_OPTIONS}
            onToggle={(opt) => set('planItems', toggleListValue(value.planItems, opt))}
            idPrefix="endo-hormone-plan"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Follow-up Interval">
            <TextSelect
              value={value.followUpInterval}
              onChange={(v) => set('followUpInterval', v)}
              options={FOLLOW_UP_INTERVAL_OPTIONS}
            />
          </Field>
        </div>
        <Field label="Endocrine Plan">
          <TextTextarea
            value={value.endocrinePlan}
            onChange={(v) => set('endocrinePlan', v)}
            placeholder="Orders, medication changes, patient education, referrals…"
            rows={3}
          />
        </Field>
        {(onOpenOrders || onOpenReferrals) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {onOpenOrders && (
              <button
                type="button"
                onClick={onOpenOrders}
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                Open Orders
              </button>
            )}
            {onOpenReferrals && (
              <button
                type="button"
                onClick={onOpenReferrals}
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                Open Referrals
              </button>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
