import { SectionCard } from '../components/chart-ui';
import {
  Field,
  TextInput,
  TextSelect,
  TextTextarea,
  MultiSelectChips,
} from './WomensHealthFields';
import {
  ADNEXA_FINDINGS,
  BETHESDA_OPTIONS,
  BREAST_EXAM_FINDINGS,
  CERVIX_FINDINGS,
  EXTERNAL_GENITALIA_FINDINGS,
  FLOW_OPTIONS,
  GYN_PLAN_ACTIONS,
  GYN_VISIT_TYPES,
  MENOPAUSE_STATUS_OPTIONS,
  RECTOVAGINAL_OPTIONS,
  STI_TESTS,
  UTERUS_FINDINGS,
  VAGINAL_EXAM_FINDINGS,
  YES_NO_OPTIONS,
} from './womensHealthConstants';
import { toggleListValue } from './womensHealthUtils';

export function GynExaminationForm({ value, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <SectionCard
        title="A. Visit Type"
        description="Reason for this gynecologic encounter."
        accent="info"
      >
        <Field label="Visit Type" className="max-w-md">
          <TextSelect
            value={value.visitType}
            onChange={(v) => set('visitType', v)}
            options={GYN_VISIT_TYPES}
          />
        </Field>
      </SectionCard>

      <SectionCard title="B. Menstrual History" description="Cycle pattern and menopause status.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="LMP">
            <TextInput type="date" value={value.lmp} onChange={(v) => set('lmp', v)} />
          </Field>
          <Field label="Cycle Length (days)">
            <TextInput type="number" min={0} value={value.cycleLength} onChange={(v) => set('cycleLength', v)} />
          </Field>
          <Field label="Regular Cycles">
            <TextSelect value={value.regularCycles} onChange={(v) => set('regularCycles', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Duration (days)">
            <TextInput type="number" min={0} value={value.duration} onChange={(v) => set('duration', v)} />
          </Field>
          <Field label="Flow">
            <TextSelect value={value.flow} onChange={(v) => set('flow', v)} options={FLOW_OPTIONS} />
          </Field>
          <Field label="Dysmenorrhea">
            <TextSelect
              value={value.dysmenorrhea}
              onChange={(v) => set('dysmenorrhea', v)}
              options={['None', 'Mild', 'Moderate', 'Severe']}
            />
          </Field>
          <Field label="Menopause Status">
            <TextSelect
              value={value.menopauseStatus}
              onChange={(v) => set('menopauseStatus', v)}
              options={MENOPAUSE_STATUS_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="C. Sexual History">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Sexually Active">
            <TextSelect value={value.sexuallyActive} onChange={(v) => set('sexuallyActive', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Contraception">
            <TextInput
              value={value.contraception}
              onChange={(v) => set('contraception', v)}
              placeholder="None, OCP, IUD…"
            />
          </Field>
          <Field label="Number of Partners">
            <TextInput
              type="number"
              min={0}
              value={value.numberOfPartners}
              onChange={(v) => set('numberOfPartners', v)}
            />
          </Field>
          <Field label="STI History" className="sm:col-span-2">
            <TextInput
              value={value.stiHistory}
              onChange={(v) => set('stiHistory', v)}
              placeholder="Prior STI diagnoses…"
            />
          </Field>
          <Field label="Dyspareunia">
            <TextSelect value={value.dyspareunia} onChange={(v) => set('dyspareunia', v)} options={YES_NO_OPTIONS} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="D. Breast Examination" accent="warning">
        <Field label="Findings">
          <MultiSelectChips
            idPrefix="gyn-breast"
            options={BREAST_EXAM_FINDINGS}
            values={value.breastExam}
            onToggle={(opt) => set('breastExam', toggleListValue(value.breastExam, opt))}
          />
        </Field>
        <Field label="Notes">
          <TextTextarea value={value.breastNotes} onChange={(v) => set('breastNotes', v)} />
        </Field>
      </SectionCard>

      <SectionCard title="E. External Genitalia">
        <MultiSelectChips
          idPrefix="gyn-ext"
          options={EXTERNAL_GENITALIA_FINDINGS}
          values={value.externalGenitalia}
          onToggle={(opt) => set('externalGenitalia', toggleListValue(value.externalGenitalia, opt))}
        />
      </SectionCard>

      <SectionCard title="F. Vaginal Examination">
        <MultiSelectChips
          idPrefix="gyn-vag"
          options={VAGINAL_EXAM_FINDINGS}
          values={value.vaginalExam}
          onToggle={(opt) => set('vaginalExam', toggleListValue(value.vaginalExam, opt))}
        />
      </SectionCard>

      <SectionCard title="G. Cervix">
        <MultiSelectChips
          idPrefix="gyn-cx"
          options={CERVIX_FINDINGS}
          values={value.cervix}
          onToggle={(opt) => set('cervix', toggleListValue(value.cervix, opt))}
        />
      </SectionCard>

      <SectionCard title="H. Uterus">
        <MultiSelectChips
          idPrefix="gyn-ut"
          options={UTERUS_FINDINGS}
          values={value.uterus}
          onToggle={(opt) => set('uterus', toggleListValue(value.uterus, opt))}
        />
      </SectionCard>

      <SectionCard title="I. Adnexa">
        <MultiSelectChips
          idPrefix="gyn-adx"
          options={ADNEXA_FINDINGS}
          values={value.adnexa}
          onToggle={(opt) => set('adnexa', toggleListValue(value.adnexa, opt))}
        />
      </SectionCard>

      <SectionCard title="J. Rectovaginal Exam">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Exam">
            <TextSelect
              value={value.rectovaginalExam}
              onChange={(v) => set('rectovaginalExam', v)}
              options={RECTOVAGINAL_OPTIONS}
            />
          </Field>
          <Field label="Notes">
            <TextTextarea value={value.rectovaginalNotes} onChange={(v) => set('rectovaginalNotes', v)} rows={2} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="K. Pap Smear" accent="info">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Pap Collected">
            <TextSelect value={value.papCollected} onChange={(v) => set('papCollected', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Collection Date">
            <TextInput
              type="date"
              value={value.papCollectionDate}
              onChange={(v) => set('papCollectionDate', v)}
            />
          </Field>
          <Field label="Sample Adequate">
            <TextSelect value={value.sampleAdequate} onChange={(v) => set('sampleAdequate', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="Cytology Result">
            <TextInput value={value.cytologyResult} onChange={(v) => set('cytologyResult', v)} />
          </Field>
          <Field label="Bethesda Classification">
            <TextSelect
              value={value.bethesdaClassification}
              onChange={(v) => set('bethesdaClassification', v)}
              options={BETHESDA_OPTIONS}
            />
          </Field>
          <Field label="Follow-up Required">
            <TextSelect
              value={value.papFollowUpRequired}
              onChange={(v) => set('papFollowUpRequired', v)}
              options={YES_NO_OPTIONS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="L. HPV">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="HPV Test Ordered">
            <TextSelect value={value.hpvTestOrdered} onChange={(v) => set('hpvTestOrdered', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="HPV Collected">
            <TextSelect value={value.hpvCollected} onChange={(v) => set('hpvCollected', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="HPV Result">
            <TextInput value={value.hpvResult} onChange={(v) => set('hpvResult', v)} />
          </Field>
          <Field label="High Risk HPV">
            <TextSelect value={value.highRiskHpv} onChange={(v) => set('highRiskHpv', v)} options={YES_NO_OPTIONS} />
          </Field>
          <Field label="HPV Genotype">
            <TextInput value={value.hpvGenotype} onChange={(v) => set('hpvGenotype', v)} placeholder="16, 18…" />
          </Field>
          <Field label="Follow-up">
            <TextInput value={value.hpvFollowUp} onChange={(v) => set('hpvFollowUp', v)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="M. STI Testing" description="Tests ordered or reviewed this visit.">
        <MultiSelectChips
          idPrefix="gyn-sti"
          options={STI_TESTS}
          values={value.stiTesting}
          onToggle={(opt) => set('stiTesting', toggleListValue(value.stiTesting, opt))}
        />
      </SectionCard>

      <SectionCard title="N. Assessment" accent="primary">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Pelvic Findings">
            <TextTextarea value={value.pelvicFindings} onChange={(v) => set('pelvicFindings', v)} />
          </Field>
          <Field label="Clinical Impression">
            <TextTextarea value={value.clinicalImpression} onChange={(v) => set('clinicalImpression', v)} />
          </Field>
          <Field label="Diagnoses (ICD-10)" className="sm:col-span-2">
            <TextTextarea
              value={value.diagnoses}
              onChange={(v) => set('diagnoses', v)}
              placeholder="e.g. N92.0, Z12.4…"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="O. Plan" accent="success">
        <Field label="Plan actions">
          <MultiSelectChips
            idPrefix="gyn-plan"
            options={GYN_PLAN_ACTIONS}
            values={value.planActions}
            onToggle={(opt) => set('planActions', toggleListValue(value.planActions, opt))}
          />
        </Field>
        <Field label="Plan notes">
          <TextTextarea
            value={value.planNotes}
            onChange={(v) => set('planNotes', v)}
            placeholder="Follow-up timing, meds, counseling…"
          />
        </Field>
      </SectionCard>
    </div>
  );
}
