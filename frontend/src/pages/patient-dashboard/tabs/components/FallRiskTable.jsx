import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function FallRiskTable({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fall Risk Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No fall risk assessment recorded</p>
        ) : (
          <div>Fall risk assessment content</div>
        )}
      </CardContent>
    </Card>
  );
}


