import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp } from 'lucide-react';

// Static data
const labResults = [
  {
    id: 1,
    testName: 'HbA1c',
    result: '6.5%',
    normalRange: '<7%',
    flag: 'Normal',
    date: '2025-01-15',
  },
  {
    id: 2,
    testName: 'Cholesterol',
    result: '180 mg/dL',
    normalRange: '<200 mg/dL',
    flag: 'Normal',
    date: '2025-01-15',
  },
  {
    id: 3,
    testName: 'LDL',
    result: '110 mg/dL',
    normalRange: '<100 mg/dL',
    flag: 'Abnormal',
    date: '2025-01-15',
  },
  {
    id: 4,
    testName: 'HDL',
    result: '45 mg/dL',
    normalRange: '>40 mg/dL',
    flag: 'Normal',
    date: '2025-01-15',
  },
  {
    id: 5,
    testName: 'Triglycerides',
    result: '150 mg/dL',
    normalRange: '<150 mg/dL',
    flag: 'Normal',
    date: '2025-01-15',
  },
];

// Mock trend data for chart
const trendData = [
  { date: '2024-07', value: 7.2 },
  { date: '2024-10', value: 6.8 },
  { date: '2025-01', value: 6.5 },
];

export function ResultsTab({ patient }) {
  const getFlagBadge = (flag) => {
    return flag === 'Normal' ? 'default' : 'destructive';
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Lab Results</h2>
        <Button variant="outline" className="w-full sm:w-auto">
          <TrendingUp className="h-4 w-4 mr-2" />
          View Trends
        </Button>
      </div>

      {/* Simple Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>HbA1c Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end justify-between gap-4">
            {trendData.map((point, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-primary rounded-t transition-all"
                  style={{ height: `${(point.value / 8) * 100}%` }}
                />
                <p className="text-xs text-muted-foreground mt-2">{point.date}</p>
                <p className="text-xs font-medium">{point.value}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lab Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Normal Range</TableHead>
                  <TableHead>Flag</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.testName}</TableCell>
                    <TableCell>{result.result}</TableCell>
                    <TableCell className="text-muted-foreground">{result.normalRange}</TableCell>
                    <TableCell>
                      <Badge variant={getFlagBadge(result.flag)}>{result.flag}</Badge>
                    </TableCell>
                    <TableCell>{new Date(result.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
