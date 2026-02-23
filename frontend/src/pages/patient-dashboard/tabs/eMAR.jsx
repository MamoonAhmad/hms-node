import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function eMAR({ patientId }) {
  const handleOpenNewTab = () => {
    window.open(`/emar/${patientId}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>eMAR (Electronic Medication Administration Record)</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">eMAR opens in a new tab with editable logs and printable reports.</p>
        <Button onClick={handleOpenNewTab}>Open eMAR in New Tab</Button>
      </CardContent>
    </Card>
  );
}


