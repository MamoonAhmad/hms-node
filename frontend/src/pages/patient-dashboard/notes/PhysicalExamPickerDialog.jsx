import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PHYSICAL_EXAM_SYSTEMS = [
  {
    key: 'general',
    label: 'General appearance',
    templates: [
      { label: 'Normal', value: 'Alert, oriented, in no acute distress.' },
      { label: 'Abnormal', value: 'Ill-appearing; in mild distress.' },
      { label: 'Not examined', value: 'Not examined.' },
    ],
  },
  {
    key: 'heent',
    label: 'HEENT',
    templates: [
      { label: 'Normal', value: 'Normocephalic, atraumatic; PERRLA; EOMI; mucous membranes moist.' },
      { label: 'Abnormal', value: 'Abnormal findings noted.' },
      { label: 'Not examined', value: 'Not examined.' },
    ],
  },
  {
    key: 'neck',
    label: 'Neck',
    templates: [
      { label: 'Normal', value: 'Supple; no lymphadenopathy; thyroid unremarkable.' },
      { label: 'Abnormal', value: 'Abnormal findings noted.' },
      { label: 'Not examined', value: 'Not examined.' },
    ],
  },
  {
    key: 'cardiovascular',
    label: 'Cardiovascular',
    templates: [
      { label: 'Normal', value: 'Regular rate and rhythm; no murmurs, rubs, or gallops.' },
      { label: 'Abnormal', value: 'Abnormal findings noted.' },
      { label: 'Not examined', value: 'Not examined.' },
    ],
  },
  {
    key: 'respiratory',
    label: 'Respiratory',
    templates: [
      { label: 'Normal', value: 'Clear to auscultation bilaterally; no wheezes, rales, or rhonchi.' },
      { label: 'Abnormal', value: 'Abnormal findings noted.' },
      { label: 'Not examined', value: 'Not examined.' },
    ],
  },
  {
    key: 'abdomen',
    label: 'Abdomen',
    templates: [
      { label: 'Normal', value: 'Soft, non-tender, non-distended; bowel sounds present.' },
      { label: 'Abnormal', value: 'Abnormal findings noted.' },
      { label: 'Not examined', value: 'Not examined.' },
    ],
  },
  {
    key: 'extremities',
    label: 'Extremities',
    templates: [
      { label: 'Normal', value: 'No cyanosis, clubbing, or edema; pulses intact.' },
      { label: 'Abnormal', value: 'Abnormal findings noted.' },
      { label: 'Not examined', value: 'Not examined.' },
    ],
  },
  {
    key: 'musculoskeletal',
    label: 'Musculoskeletal',
    templates: [
      { label: 'Normal', value: 'Normal range of motion; no deformities or joint swelling.' },
      { label: 'Abnormal', value: 'Abnormal findings noted.' },
      { label: 'Not examined', value: 'Not examined.' },
    ],
  },
  {
    key: 'neurological',
    label: 'Neurological',
    templates: [
      { label: 'Normal', value: 'Alert and oriented; cranial nerves grossly intact; no focal deficits.' },
      { label: 'Abnormal', value: 'Abnormal findings noted.' },
      { label: 'Not examined', value: 'Not examined.' },
    ],
  },
  {
    key: 'skin',
    label: 'Skin',
    templates: [
      { label: 'Normal', value: 'Warm, dry; no rashes or lesions.' },
      { label: 'Abnormal', value: 'Abnormal findings noted.' },
      { label: 'Not examined', value: 'Not examined.' },
    ],
  },
  {
    key: 'psych',
    label: 'Psychiatric',
    templates: [
      { label: 'Normal', value: 'Mood and affect appropriate; thought process linear.' },
      { label: 'Abnormal', value: 'Abnormal findings noted.' },
      { label: 'Not examined', value: 'Not examined.' },
    ],
  },
];

function emptyExamForm() {
  return Object.fromEntries(PHYSICAL_EXAM_SYSTEMS.map((s) => [s.key, '']));
}

function parsePhysicalExamNarrative(text) {
  const form = emptyExamForm();
  if (!text?.trim()) return form;

  const labelToKey = {
    general: 'general',
    'general appearance': 'general',
    heent: 'heent',
    neck: 'neck',
    cardiovascular: 'cardiovascular',
    cvs: 'cardiovascular',
    cv: 'cardiovascular',
    respiratory: 'respiratory',
    lungs: 'respiratory',
    pulm: 'respiratory',
    abdomen: 'abdomen',
    extremities: 'extremities',
    msk: 'musculoskeletal',
    musculoskeletal: 'musculoskeletal',
    neuro: 'neurological',
    neurological: 'neurological',
    skin: 'skin',
    psych: 'psych',
    psychiatric: 'psych',
  };
  PHYSICAL_EXAM_SYSTEMS.forEach((s) => {
    labelToKey[s.label.toLowerCase()] = s.key;
  });

  const lines = String(text).split(/\n+/);
  let currentKey = null;
  const buffers = {};

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      const label = match[1].trim().toLowerCase();
      const key = labelToKey[label];
      if (key) {
        currentKey = key;
        buffers[key] = match[2] || '';
        continue;
      }
    }
    if (currentKey) {
      buffers[currentKey] = [buffers[currentKey], line].filter(Boolean).join(' ');
    }
  }

  return { ...form, ...buffers };
}

function buildPhysicalExamNarrative(form) {
  return PHYSICAL_EXAM_SYSTEMS.map((system) => {
    const value = String(form[system.key] || '').trim();
    if (!value) return null;
    return `${system.label}: ${value}`;
  })
    .filter(Boolean)
    .join('\n');
}

function PhysicalExamPickerForm({ value, onApply, onCancel }) {
  const [form, setForm] = useState(() => parsePhysicalExamNarrative(value));

  const filledCount = useMemo(
    () => PHYSICAL_EXAM_SYSTEMS.filter((s) => String(form[s.key] || '').trim()).length,
    [form],
  );

  const updateField = (key, next) => setForm((prev) => ({ ...prev, [key]: next }));

  const markAllNormal = () => {
    const next = emptyExamForm();
    PHYSICAL_EXAM_SYSTEMS.forEach((system) => {
      const normal = system.templates.find((t) => t.label === 'Normal');
      if (normal) next[system.key] = normal.value;
    });
    setForm(next);
  };

  return (
    <>
      <DialogBody className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {filledCount} of {PHYSICAL_EXAM_SYSTEMS.length} systems documented
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={markAllNormal}>
              Mark all normal
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setForm(emptyExamForm())}>
              Clear all
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PHYSICAL_EXAM_SYSTEMS.map((system) => (
            <div key={system.key} className="space-y-2 rounded-lg border border-border/80 p-3">
              <Label htmlFor={`pe-${system.key}`}>{system.label}</Label>
              <Select onValueChange={(v) => updateField(system.key, v)}>
                <SelectTrigger aria-label={`${system.label} template`}>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {system.templates.map((t) => (
                    <SelectItem key={t.label} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                id={`pe-${system.key}`}
                rows={2}
                value={form[system.key] || ''}
                onChange={(e) => updateField(system.key, e.target.value)}
                placeholder={`${system.label} findings…`}
              />
            </div>
          ))}
        </div>
      </DialogBody>

      <DialogFooter className="border-t border-border/80 bg-muted/25 px-6 py-4 sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={filledCount === 0}
          onClick={() => onApply?.(buildPhysicalExamNarrative(form))}
        >
          Apply to note
        </Button>
      </DialogFooter>
    </>
  );
}

export function PhysicalExamPickerDialog({ open, onOpenChange, value = '', onApply }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="!m-0 flex flex-col gap-0 rounded-t-lg border-b border-white/20 bg-primary px-8 py-7 text-left">
          <DialogTitle className="text-xl font-semibold leading-snug tracking-tight text-white">
            Physical exam picker
          </DialogTitle>
          <DialogDescription className="mt-3 max-w-none text-[15px] font-normal leading-relaxed text-white/95">
            Document findings by system. Use templates for common normals, then edit details. Applying
            updates the Physical exam field on the SOAP note.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <PhysicalExamPickerForm
            value={value}
            onCancel={() => onOpenChange?.(false)}
            onApply={(narrative) => {
              onApply?.(narrative);
              onOpenChange?.(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
