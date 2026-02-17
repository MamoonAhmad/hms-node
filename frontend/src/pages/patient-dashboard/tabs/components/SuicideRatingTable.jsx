import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function SuicideRatingTable({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Suicide Severity Rating</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No suicide rating recorded</p>
        ) : (
          <div>Suicide rating content</div>
        )}
      </CardContent>
    </Card>
  );
}


