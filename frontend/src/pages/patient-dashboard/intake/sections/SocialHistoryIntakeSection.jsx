import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { IntakeSectionCard } from '../components/IntakeSectionCard';
import { IntakeInlineFormPanel } from '../components/IntakeInlineFormPanel';
import { useIntake } from '../IntakeContext';
import { INTAKE_SECTIONS } from '../intakeConstants';

const TAB_FIELDS = {
  tobacco: { status: '', types: [], packsPerDay: '', years: '', quitDate: '' },
  alcohol: { status: '', frequency: '', drinksPerWeek: '' },
  substance: { status: '', drugTypes: [], route: '' },
  caffeine: { sources: [], cupsPerDay: '' },
  exercise: { frequency: '', types: [], minutesPerWeek: '' },
  diet: { specialDiet: '', notes: '' },
  sexual: { active: '', partners: '', contraception: '', notes: '' },
  employment: { status: '', occupation: '', employer: '' },
  living: { housingStatus: '', livesWith: '', notes: '' },
  sdoh: { financial: '', foodSecurity: '', transportation: '', safety: '' },
  education: { level: '' },
  notes: { generalNotes: '' },
};

const CONTROL = 'h-9 w-full';
const TAB_GRID = 'mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2';

function defaultData() {
  return JSON.parse(JSON.stringify(TAB_FIELDS));
}

function Field({ label, children, className }) {
  return (
    <div className={cn('min-w-0 space-y-2', className)}>
      <Label className="block text-sm font-medium leading-none">{label}</Label>
      {children}
    </div>
  );
}

const SUMMARY_TILES = [
  { label: 'Tobacco', get: (d) => d.tobacco?.status },
  { label: 'Alcohol', get: (d) => d.alcohol?.status },
  { label: 'Substance', get: (d) => d.substance?.status },
  { label: 'Exercise', get: (d) => d.exercise?.minutesPerWeek && `${d.exercise.minutesPerWeek} min/wk` },
  { label: 'Diet', get: (d) => d.diet?.specialDiet },
  { label: 'Employment', get: (d) => d.employment?.status },
  { label: 'Living', get: (d) => d.living?.housingStatus },
  { label: 'Education', get: (d) => d.education?.level },
];

export function SocialHistoryIntakeSection() {
  const { getRecordsBySection, saveSection, updateRecord, saving } = useIntake();
  const existing = getRecordsBySection(INTAKE_SECTIONS.SOCIAL_HISTORY)[0];
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(defaultData);

  const openDialog = () => {
    setData({ ...defaultData(), ...(existing?.payload || {}) });
    setOpen(true);
  };

  const updateTab = (tab, field, value) => {
    setData((prev) => ({ ...prev, [tab]: { ...prev[tab], [field]: value } }));
  };

  const handleSave = async () => {
    if (existing?.id) {
      await updateRecord(existing.id, { payload: data });
    } else {
      await saveSection({ sectionType: INTAKE_SECTIONS.SOCIAL_HISTORY, payload: data });
    }
    setOpen(false);
  };

  const hasData = !!existing;
  const filledTiles = SUMMARY_TILES.map((t) => ({ ...t, value: t.get(existing?.payload || {}) })).filter((t) => t.value);

  return (
    <IntakeSectionCard id="assessment-social-history" title="Social History" onAdd={openDialog}>
      <IntakeInlineFormPanel
        open={open}
        onOpenChange={setOpen}
        title={hasData ? 'Edit Social History' : 'Social History'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {hasData ? 'Save Changes' : 'Save Social History'}
            </Button>
          </>
        }
      >
        <Tabs defaultValue="tobacco" className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1">
                {Object.keys(TAB_FIELDS).map((tab) => (
                  <TabsTrigger key={tab} value={tab} className="capitalize text-xs sm:text-sm">
                    {tab === 'sdoh' ? 'SDOH' : tab.replace('-', ' ')}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="tobacco" className={TAB_GRID}>
                <Field label="Tobacco Use">
                  <Select value={data.tobacco.status} onValueChange={(v) => updateTab('tobacco', 'status', v)}>
                    <SelectTrigger className={CONTROL}><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      {['Never', 'Former', 'Current', 'Unknown'].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Tobacco Types">
                  <Input
                    className={CONTROL}
                    placeholder="Cigarettes, Cigars, Vape..."
                    value={data.tobacco.types?.join?.(', ') || ''}
                    onChange={(e) => updateTab('tobacco', 'types', e.target.value.split(',').map((s) => s.trim()))}
                  />
                </Field>
              </TabsContent>

              <TabsContent value="alcohol" className={TAB_GRID}>
                <Field label="Alcohol Use">
                  <Select value={data.alcohol.status} onValueChange={(v) => updateTab('alcohol', 'status', v)}>
                    <SelectTrigger className={CONTROL}><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      {['Never', 'Former', 'Current', 'Unknown'].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Frequency">
                  <Select value={data.alcohol.frequency} onValueChange={(v) => updateTab('alcohol', 'frequency', v)}>
                    <SelectTrigger className={CONTROL}><SelectValue placeholder="Frequency" /></SelectTrigger>
                    <SelectContent>
                      {['Daily', 'Weekly', 'Monthly', 'Occasionally', 'Socially'].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </TabsContent>

              <TabsContent value="substance" className={TAB_GRID}>
                <Field label="Substance Use">
                  <Select value={data.substance.status} onValueChange={(v) => updateTab('substance', 'status', v)}>
                    <SelectTrigger className={CONTROL}><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      {['Never', 'Former', 'Current', 'Unknown'].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Drug Types">
                  <Input
                    className={CONTROL}
                    placeholder="Marijuana, Cocaine..."
                    value={data.substance.drugTypes?.join?.(', ') || ''}
                    onChange={(e) => updateTab('substance', 'drugTypes', e.target.value.split(',').map((s) => s.trim()))}
                  />
                </Field>
                <Field label="Route">
                  <Select value={data.substance.route} onValueChange={(v) => updateTab('substance', 'route', v)}>
                    <SelectTrigger className={CONTROL}><SelectValue placeholder="Route" /></SelectTrigger>
                    <SelectContent>
                      {['Oral', 'Smoking', 'Injection', 'Inhalation', 'Other'].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </TabsContent>

              <TabsContent value="caffeine" className={TAB_GRID}>
                <Field label="Sources">
                  <Input
                    className={CONTROL}
                    placeholder="Coffee, Tea, Energy Drinks..."
                    value={data.caffeine.sources?.join?.(', ') || ''}
                    onChange={(e) => updateTab('caffeine', 'sources', e.target.value.split(',').map((s) => s.trim()))}
                  />
                </Field>
                <Field label="Cups / Day">
                  <Input
                    className={CONTROL}
                    value={data.caffeine.cupsPerDay}
                    onChange={(e) => updateTab('caffeine', 'cupsPerDay', e.target.value)}
                  />
                </Field>
              </TabsContent>

              <TabsContent value="exercise" className={TAB_GRID}>
                <Field label="Exercise Types">
                  <Input
                    className={CONTROL}
                    placeholder="Walking, Running, Gym..."
                    value={data.exercise.types?.join?.(', ') || ''}
                    onChange={(e) => updateTab('exercise', 'types', e.target.value.split(',').map((s) => s.trim()))}
                  />
                </Field>
                <Field label="Minutes / Week">
                  <Input
                    className={CONTROL}
                    value={data.exercise.minutesPerWeek}
                    onChange={(e) => updateTab('exercise', 'minutesPerWeek', e.target.value)}
                  />
                </Field>
              </TabsContent>

              <TabsContent value="diet" className={TAB_GRID}>
                <Field label="Special Diet">
                  <Select value={data.diet.specialDiet} onValueChange={(v) => updateTab('diet', 'specialDiet', v)}>
                    <SelectTrigger className={CONTROL}><SelectValue placeholder="Diet" /></SelectTrigger>
                    <SelectContent>
                      {['Regular', 'Vegetarian', 'Vegan', 'Low Sodium', 'Diabetic', 'Keto', 'Gluten Free', 'Other'].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </TabsContent>

              <TabsContent value="sexual" className={TAB_GRID}>
                <Field label="Sexually Active">
                  <Select value={data.sexual.active} onValueChange={(v) => updateTab('sexual', 'active', v)}>
                    <SelectTrigger className={CONTROL}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['Yes', 'No', 'Unknown'].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Notes">
                  <Input
                    className={CONTROL}
                    value={data.sexual.notes}
                    onChange={(e) => updateTab('sexual', 'notes', e.target.value)}
                    placeholder="Notes"
                  />
                </Field>
              </TabsContent>

              <TabsContent value="employment" className={TAB_GRID}>
                <Field label="Employment Status">
                  <Select value={data.employment.status} onValueChange={(v) => updateTab('employment', 'status', v)}>
                    <SelectTrigger className={CONTROL}><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      {['Full Time', 'Part Time', 'Self Employed', 'Unemployed', 'Retired', 'Student'].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Occupation">
                  <Input
                    className={CONTROL}
                    value={data.employment.occupation}
                    onChange={(e) => updateTab('employment', 'occupation', e.target.value)}
                  />
                </Field>
              </TabsContent>

              <TabsContent value="living" className={TAB_GRID}>
                <Field label="Housing Status">
                  <Select value={data.living.housingStatus} onValueChange={(v) => updateTab('living', 'housingStatus', v)}>
                    <SelectTrigger className={CONTROL}><SelectValue placeholder="Housing" /></SelectTrigger>
                    <SelectContent>
                      {['Own Home', 'Rent', 'Assisted Living', 'Nursing Home', 'Shelter', 'Homeless', 'Other'].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Lives With">
                  <Select value={data.living.livesWith} onValueChange={(v) => updateTab('living', 'livesWith', v)}>
                    <SelectTrigger className={CONTROL}><SelectValue placeholder="Lives with" /></SelectTrigger>
                    <SelectContent>
                      {['Alone', 'Spouse', 'Parents', 'Children', 'Family', 'Friends', 'Caregiver'].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </TabsContent>

              <TabsContent value="sdoh" className={TAB_GRID}>
                {['financial', 'foodSecurity', 'transportation', 'safety'].map((field) => (
                  <Field key={field} label={field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}>
                    <Input
                      className={CONTROL}
                      value={data.sdoh[field]}
                      onChange={(e) => updateTab('sdoh', field, e.target.value)}
                    />
                  </Field>
                ))}
              </TabsContent>

              <TabsContent value="education" className={TAB_GRID}>
                <Field label="Education Level">
                  <Select value={data.education.level} onValueChange={(v) => updateTab('education', 'level', v)}>
                    <SelectTrigger className={CONTROL}><SelectValue placeholder="Education" /></SelectTrigger>
                    <SelectContent>
                      {['No Formal Education', 'Primary School', 'High School', 'College', "Bachelor's Degree", "Master's Degree", 'Doctorate'].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <Field label="General Social History Notes">
                  <Textarea
                    className="min-h-[5.5rem] w-full resize-y"
                    rows={5}
                    value={data.notes.generalNotes}
                    onChange={(e) => updateTab('notes', 'generalNotes', e.target.value)}
                  />
                </Field>
              </TabsContent>
        </Tabs>
      </IntakeInlineFormPanel>

      {hasData && filledTiles.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-end">
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={openDialog}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {filledTiles.map((tile) => (
              <div key={tile.label} className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{tile.label}</p>
                <p className="text-sm font-medium text-foreground">{tile.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No social history recorded yet. Use the + button to add.</p>
      )}
    </IntakeSectionCard>
  );
}
