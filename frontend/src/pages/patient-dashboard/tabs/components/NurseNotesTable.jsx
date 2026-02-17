import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function NurseNotesTable({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nurse Notes</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No nurse notes recorded</p>
        ) : (
          <div>Nurse notes content</div>
        )}
      </CardContent>
    </Card>
  );
}


