import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye } from 'lucide-react';

// Static data
const encounters = [
  {
    id: 1,
    visitDate: '2025-01-20',
    department: 'Internal Medicine',
    provider: 'Dr. Sarah Smith',
    visitType: 'OPD',
  },
  {
    id: 2,
    visitDate: '2025-01-15',
    department: 'Internal Medicine',
    provider: 'Dr. John Williams',
    visitType: 'Follow-up',
  },
  {
    id: 3,
    visitDate: '2025-01-10',
    department: 'Cardiology',
    provider: 'Dr. Sarah Smith',
    visitType: 'OPD',
  },
  {
    id: 4,
    visitDate: '2024-12-28',
    department: 'Internal Medicine',
    provider: 'Dr. John Williams',
    visitType: 'Follow-up',
  },
];

const visitDetails = {
  1: {
    chiefComplaint: 'Routine follow-up for diabetes and hypertension',
    diagnosis: 'Type 2 Diabetes, Hypertension',
    treatment: 'Continue current medications',
    notes: 'Patient is doing well. Blood pressure and glucose levels are stable.',
  },
};

export function EncountersTab({ patient }) {
  const [selectedVisit, setSelectedVisit] = useState(null);

  const handleViewDetails = (encounter) => {
    setSelectedVisit(encounter.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Encounters / Visit History</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visit History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visit Date</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Visit Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {encounters.map((encounter) => (
                  <TableRow key={encounter.id}>
                    <TableCell className="font-medium">
                      {new Date(encounter.visitDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{encounter.department}</TableCell>
                    <TableCell>{encounter.provider}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{encounter.visitType}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(encounter)}
                      >
                        <Eye className="h-4 w-4 mr-1 icon-action-view" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Visit Details Dialog */}
      <Dialog open={selectedVisit !== null} onOpenChange={() => setSelectedVisit(null)}>
        <DialogContent className="min-w-[800px] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visit Summary</DialogTitle>
          </DialogHeader>
          {selectedVisit && visitDetails[selectedVisit] && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Chief Complaint</p>
                <p className="text-sm text-muted-foreground">
                  {visitDetails[selectedVisit].chiefComplaint}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Diagnosis</p>
                <p className="text-sm text-muted-foreground">{visitDetails[selectedVisit].diagnosis}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Treatment</p>
                <p className="text-sm text-muted-foreground">{visitDetails[selectedVisit].treatment}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{visitDetails[selectedVisit].notes}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
