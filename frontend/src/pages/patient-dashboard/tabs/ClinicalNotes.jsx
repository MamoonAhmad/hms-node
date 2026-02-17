import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

const mockNotes = [
  {
    id: 1,
    type: 'Consult',
    createdBy: 'Dr. Smith',
    createdAt: '2025-01-15T10:30:00',
    title: 'Initial Consultation',
  },
  {
    id: 2,
    type: 'History & Physical',
    createdBy: 'Dr. Johnson',
    createdAt: '2025-01-15T11:00:00',
    title: 'H&P Examination',
  },
];

export function ClinicalNotes({ patientId }) {
  const [activeTab, setActiveTab] = useState('consult');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinical Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="consult">Consult</TabsTrigger>
            <TabsTrigger value="history-physical">History & Physical</TabsTrigger>
          </TabsList>

          <TabsContent value="consult" className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockNotes.filter(n => n.type === 'Consult').map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>{note.title}</TableCell>
                    <TableCell>{note.createdBy}</TableCell>
                    <TableCell>{new Date(note.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="history-physical" className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockNotes.filter(n => n.type === 'History & Physical').map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>{note.title}</TableCell>
                    <TableCell>{note.createdBy}</TableCell>
                    <TableCell>{new Date(note.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


