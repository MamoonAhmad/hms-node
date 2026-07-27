import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { IntakeSectionCard } from '../components/IntakeSectionCard';
import { useIntake } from '../IntakeContext';
import { INTAKE_SECTIONS } from '../intakeConstants';
import { cn } from '@/lib/utils';

const rosSections = [
  { title: 'Constitutional', items: ['Fever', 'Chills', 'Headache', 'Recent weight change <20 lbs.', 'Recent weight change >20 lbs.', 'Other'] },
  { title: 'Eyes/Nose/Throat', items: ['Glaucoma', 'Glasses', 'Sinus Problems', 'Other'] },
  { title: 'Cardiovascular', items: ['Chest Pain', 'Varicose Veins', 'High Blood Pressure', 'Other'] },
  { title: 'Respiratory', items: ['Wheezing/Asthma', 'COPD', 'Shortness of Breath', 'Sleep Apnea', 'Other'] },
  { title: 'Endocrine', items: ['Diabetes', 'Thyroid Disorder', 'Other'] },
  { title: 'Musculoskeletal', items: ['Joint Pain', 'Neck Pain', 'Back Pain', 'Other'] },
  { title: 'Gastrointestinal', items: ['Abdominal pain', 'Constipation', 'Diarrhea', 'Nausea/Vomiting', 'Indigestion/Heartburn', 'Other'] },
  { title: 'Hematology', items: ['Bleed', 'Bruise', 'Aspirin Last 2 Weeks', 'Other'] },
  { title: 'Neurologic', items: ['Tremors', 'Dizzy Spells', 'Numbness/Tingling', 'Other'] },
  { title: 'Genitourinary', items: ['Urinary Frequency', 'Urinary Retention', 'Painful Urination', 'Blood in Urine', 'Other'] },
  { title: 'Psychologic', items: ['Anxiety', 'Depression', 'Other'] },
];

function initRosState() {
  const sectionNegative = {};
  const selections = {};
  rosSections.forEach((s) => {
    sectionNegative[s.title] = false;
    s.items.forEach((item) => {
      selections[`${s.title}-${item}`] = '';
    });
  });
  return { sectionNegative, selections, otherTexts: {}, notes: '', markAllNegative: false };
}

export function ROSIntakeSection() {
  const { getRecordsBySection, saveSection, saving } = useIntake();
  const existing = getRecordsBySection(INTAKE_SECTIONS.ROS)[0];
  const [state, setState] = useState(() => existing?.payload || initRosState());

  const setSectionNegative = (title, negative) => {
    setState((prev) => ({
      ...prev,
      sectionNegative: { ...prev.sectionNegative, [title]: negative },
      markAllNegative: false,
    }));
  };

  const setMarkAllNegative = (negative) => {
    setState((prev) => {
      const sectionNegative = {};
      rosSections.forEach((s) => { sectionNegative[s.title] = negative; });
      return { ...prev, markAllNegative: negative, sectionNegative };
    });
  };

  const setSelection = (key, value) => {
    setState((prev) => ({
      ...prev,
      selections: { ...prev.selections, [key]: value },
    }));
  };

  const handleSave = async () => {
    await saveSection({ sectionType: INTAKE_SECTIONS.ROS, payload: state });
  };

  return (
    <IntakeSectionCard id="assessment-ros" title="ROS — Review of Systems" showAdd={false}>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label className="font-medium">Mark All as Negative</Label>
        <Button
          type="button"
          size="sm"
          variant={state.markAllNegative ? 'destructive' : 'default'}
          className={cn(!state.markAllNegative && 'bg-green-600 hover:bg-green-700')}
          onClick={() => setMarkAllNegative(!state.markAllNegative)}
        >
          {state.markAllNegative ? 'All Negative' : 'All Reviewed'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rosSections.map((section) => {
          const isNegative = state.sectionNegative[section.title];
          return (
            <div key={section.title} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{section.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{isNegative ? 'Negative' : 'Reviewed'}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant={isNegative ? 'destructive' : 'default'}
                    className={cn(!isNegative && 'bg-green-600 hover:bg-green-700')}
                    onClick={() => setSectionNegative(section.title, !isNegative)}
                  >
                    {isNegative ? 'Negative' : 'Active'}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1.5rem_1.5rem] items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <span />
                  <span className="text-center">Y</span>
                  <span className="text-center">N</span>
                </div>
                {section.items.map((item) => {
                  const key = `${section.title}-${item}`;
                  return (
                    <div key={item} className="grid grid-cols-[1fr_1.5rem_1.5rem] items-center gap-2 text-sm">
                      <span>{item}</span>
                      <input
                        type="radio"
                        name={key}
                        value="yes"
                        aria-label={`${item} yes`}
                        disabled={isNegative}
                        checked={state.selections[key] === 'yes'}
                        onChange={() => setSelection(key, 'yes')}
                        className="h-4 w-4 justify-self-center"
                      />
                      <input
                        type="radio"
                        name={key}
                        value="no"
                        aria-label={`${item} no`}
                        disabled={isNegative}
                        checked={state.selections[key] === 'no'}
                        onChange={() => setSelection(key, 'no')}
                        className="h-4 w-4 justify-self-center"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label>ROS Notes</Label>
        <Textarea
          value={state.notes}
          onChange={(e) => setState((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Additional ROS comments..."
        />
      </div>

      <Button onClick={handleSave} disabled={saving}>Save ROS</Button>
    </IntakeSectionCard>
  );
}
