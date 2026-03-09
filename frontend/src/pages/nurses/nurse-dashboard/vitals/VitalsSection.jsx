import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { VitalsForm, getDefaultVitalsData } from './VitalsForm';

export function VitalsSection() {
  const [vitalsData, setVitalsData] = useState(getDefaultVitalsData());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Patient Vitals</CardTitle>
      </CardHeader>
      <CardContent>
        <Input id="vitals-timestamp" className="hidden" disabled />
        <VitalsForm data={vitalsData} onChange={setVitalsData} showTimestamp />
      </CardContent>
    </Card>
  );
}
