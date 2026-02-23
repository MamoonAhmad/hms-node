import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const rosSections = [
  {
    title: 'Constitutional',
    items: ['Fever', 'Chills', 'Headache', 'Recent weight change <20 lbs.', 'Recent weight change >20 lbs.', 'Other'],
  },
  {
    title: 'Eyes/Nose/Throat',
    items: ['Glaucoma', 'Glasses', 'Sinus Problems', 'Other'],
  },
  {
    title: 'Cardiovascular',
    items: ['Chest Pain', 'Varicose Veins', 'High Blood Pressure', 'Other'],
  },
  {
    title: 'Respiratory',
    items: ['Wheezing/Asthma', 'COPD', 'Shortness of Breath', 'Sleep Apnea', 'Other'],
  },
  {
    title: 'Endocrine',
    items: ['Diabetes', 'Thyroid Disorder', 'Other'],
  },
  {
    title: 'Musculoskeletal',
    items: ['Joint Pain', 'Neck Pain', 'Back Pain', 'Other'],
  },
  {
    title: 'Gastrointestinal',
    items: ['Abdominal pain', 'Constipation', 'Diarrhea', 'Nausea/Vomiting', 'Indigestion/Heartburn', 'Other'],
  },
  {
    title: 'Hematology',
    items: ['Bleed', 'Bruise', 'Aspirin Last 2 Weeks', 'Other'],
  },
  {
    title: 'Neurologic',
    items: ['Tremors', 'Dizzy Spells', 'Numbness/Tingling', 'Other'],
  },
  {
    title: 'Genitourinary',
    items: ['Urinary Frequency', 'Urinary Retention', 'Painful Urination', 'Blood in Urine', 'Other'],
  },
  {
    title: 'Psychologic',
    items: ['Anxiety', 'Depression', 'Other'],
  },
];

export function ROSSection() {
  const [rosNotes, setRosNotes] = useState('');
  const [otherSelections, setOtherSelections] = useState({});
  const [otherTexts, setOtherTexts] = useState({});

  const handleOtherSelection = (sectionTitle, item, value) => {
    const key = `${sectionTitle}-${item}`;
    if (value === 'yes') {
      setOtherSelections((prev) => ({ ...prev, [key]: true }));
    } else {
      setOtherSelections((prev) => ({ ...prev, [key]: false }));
      setOtherTexts((prev) => {
        const newTexts = { ...prev };
        delete newTexts[key];
        return newTexts;
      });
    }
  };

  const handleOtherTextChange = (sectionTitle, item, text) => {
    const key = `${sectionTitle}-${item}`;
    setOtherTexts((prev) => ({ ...prev, [key]: text }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">ROS (Review of the System)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input id="ros-timestamp" className="hidden" disabled />
        <div className="grid gap-4 md:grid-cols-2">
          {rosSections.map((section) => (
            <div key={section.title} className="rounded-lg border border-border/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{section.title}</p>
                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                  <span>Y</span>
                  <span>N</span>
                </div>
              </div>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const key = `${section.title}-${item}`;
                  const isOther = item === 'Other';
                  const showTextarea = isOther && otherSelections[key];
                  
                  return (
                    <div key={item} className="space-y-2">
                      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-sm">
                        <span className="text-foreground">{item}</span>
                        <input
                          type="radio"
                          name={key}
                          value="yes"
                          onChange={(e) => handleOtherSelection(section.title, item, e.target.value)}
                          className="h-4 w-4 justify-self-end"
                        />
                        <input
                          type="radio"
                          name={key}
                          value="no"
                          onChange={(e) => handleOtherSelection(section.title, item, e.target.value)}
                          className="h-4 w-4 justify-self-end"
                        />
                      </div>
                      {showTextarea && (
                        <div className="ml-4">
                          <Textarea
                            placeholder="Please specify..."
                            value={otherTexts[key] || ''}
                            onChange={(e) => handleOtherTextChange(section.title, item, e.target.value)}
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ros-notes">ROS Notes</Label>
          <Textarea
            id="ros-notes"
            placeholder="Add ROS notes..."
            value={rosNotes}
            onChange={(e) => setRosNotes(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}


