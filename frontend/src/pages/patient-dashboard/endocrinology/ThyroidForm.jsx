import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from '../womens-health/WomensHealthFields';
import {
  FOLLOW_UP_INTERVAL_OPTIONS,
  NODULE_STATUS_OPTIONS,
  THYROID_DIAGNOSIS_OPTIONS,
  THYROID_EXAM_OPTIONS,
  THYROID_SYMPTOM_OPTIONS,
  THYROID_THERAPY_OPTIONS,
  THYROID_VISIT_TYPE_OPTIONS,
} from './endocrinologyConstants';
import { toggleListValue } from './endocrinologyUtils';

export function ThyroidForm({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Document thyroid symptoms, exam, TSH/FT4 labs, nodule imaging, and therapy plan.
      </p>

      <SectionCard
        title="A. Visit & diagnosis"
        description="Encounter context and working thyroid diagnosis."
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
              options={THYROID_VISIT_TYPE_OPTIONS}
            />
          </Field>
          <Field label="Working Diagnosis" className="sm:col-span-2">
            <TextSelect
              value={value.diagnosis}
              onChange={(v) => set('diagnosis', v)}
              options={THYROID_DIAGNOSIS_OPTIONS}
            />
          </Field>
          <Field label="Symptom Onset">
            <TextInput
              value={value.symptomOnset}
              onChange={(v) => set('symptomOnset', v)}
              placeholder="e.g. 3 months"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="B. Symptoms" accent="warning">
        <Field label="Thyroid-related Symptoms">
          <MultiSelectChips
            values={value.symptoms || []}
            options={THYROID_SYMPTOM_OPTIONS}
            onToggle={(opt) => set('symptoms', toggleListValue(value.symptoms, opt))}
            idPrefix="endo-thyroid-sx"
          />
        </Field>
      </SectionCard>

      <SectionCard title="C. Neck / thyroid exam">
        <Field label="Exam Findings">
          <MultiSelectChips
            values={value.neckExam || []}
            options={THYROID_EXAM_OPTIONS}
            onToggle={(opt) => set('neckExam', toggleListValue(value.neckExam, opt))}
            idPrefix="endo-thyroid-exam"
          />
        </Field>
        <Field label="Exam Notes">
          <TextTextarea
            value={value.examNotes}
            onChange={(v) => set('examNotes', v)}
            placeholder="Size estimate, laterality, consistency…"
            rows={2}
          />
        </Field>
      </SectionCard>

      <SectionCard
        title="D. Thyroid labs"
        description="TSH, free hormones, and antibody panel."
        accent="primary"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="TSH">
            <TextInput value={value.tsh} onChange={(v) => set('tsh', v)} placeholder="mIU/L" />
          </Field>
          <Field label="TSH Date">
            <TextInput type="date" value={value.tshDate} onChange={(v) => set('tshDate', v)} />
          </Field>
          <Field label="Free T4">
            <TextInput value={value.freeT4} onChange={(v) => set('freeT4', v)} placeholder="ng/dL" />
          </Field>
          <Field label="Free T3">
            <TextInput value={value.freeT3} onChange={(v) => set('freeT3', v)} placeholder="pg/mL" />
          </Field>
          <Field label="TPO Ab">
            <TextInput value={value.tpoAb} onChange={(v) => set('tpoAb', v)} />
          </Field>
          <Field label="TgAb">
            <TextInput value={value.tgab} onChange={(v) => set('tgab', v)} />
          </Field>
          <Field label="TRAb / TSI">
            <TextInput value={value.trab} onChange={(v) => set('trab', v)} />
          </Field>
          <Field label="Prior Labs Notes" className="sm:col-span-2">
            <TextTextarea
              value={value.priorLabsNotes}
              onChange={(v) => set('priorLabsNotes', v)}
              placeholder="Trend vs prior TSH, pregnancy trimester targets…"
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="E. Nodule / ultrasound">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nodule Status">
            <TextSelect
              value={value.noduleStatus}
              onChange={(v) => set('noduleStatus', v)}
              options={NODULE_STATUS_OPTIONS}
            />
          </Field>
          <Field label="Nodule Size">
            <TextInput
              value={value.noduleSize}
              onChange={(v) => set('noduleSize', v)}
              placeholder="e.g. 1.4 cm right"
            />
          </Field>
          <Field label="TI-RADS / ACR">
            <TextInput
              value={value.tirads}
              onChange={(v) => set('tirads', v)}
              placeholder="e.g. TR4"
            />
          </Field>
          <Field label="Ultrasound Findings" className="sm:col-span-3">
            <TextTextarea
              value={value.ultrasoundFindings}
              onChange={(v) => set('ultrasoundFindings', v)}
              placeholder="Composition, echogenicity, margins, vascularity…"
              rows={2}
            />
          </Field>
          <Field label="FNA Result" className="sm:col-span-3">
            <TextTextarea
              value={value.fnaResult}
              onChange={(v) => set('fnaResult', v)}
              placeholder="Bethesda category and cytology summary…"
              rows={2}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="F. Therapy & plan" accent="success">
        <Field label="Thyroid Therapy">
          <MultiSelectChips
            values={value.therapy || []}
            options={THYROID_THERAPY_OPTIONS}
            onToggle={(opt) => set('therapy', toggleListValue(value.therapy, opt))}
            idPrefix="endo-thyroid-rx"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Levothyroxine Dose">
            <TextInput
              value={value.levothyroxineDose}
              onChange={(v) => set('levothyroxineDose', v)}
              placeholder="e.g. 88 mcg daily"
            />
          </Field>
          <Field label="Antithyroid Dose">
            <TextInput
              value={value.antithyroidDose}
              onChange={(v) => set('antithyroidDose', v)}
              placeholder="e.g. MMI 10 mg"
            />
          </Field>
          <Field label="Follow-up Interval">
            <TextSelect
              value={value.followUpInterval}
              onChange={(v) => set('followUpInterval', v)}
              options={FOLLOW_UP_INTERVAL_OPTIONS}
            />
          </Field>
          <Field label="Therapy Notes" className="sm:col-span-3">
            <TextTextarea
              value={value.therapyNotes}
              onChange={(v) => set('therapyNotes', v)}
              placeholder="Titration plan, adherence, side effects…"
              rows={2}
            />
          </Field>
          <Field label="Thyroid Plan" className="sm:col-span-3">
            <TextTextarea
              value={value.thyroidPlan}
              onChange={(v) => set('thyroidPlan', v)}
              placeholder="Lab timing, US/FNA, dose change, education…"
              rows={3}
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
