import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function ROSTable({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review of Systems (ROS)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No ROS data recorded</p>
        ) : (
          <div>ROS content</div>
        )}
      </CardContent>
    </Card>
  );
}


