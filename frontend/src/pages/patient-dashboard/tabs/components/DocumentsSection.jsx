import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2 } from 'lucide-react';

const mockDocuments = [
  {
    id: 1,
    srNo: 1,
    takenBy: 'Dr. Smith',
    dateTime: '2025-01-15T10:30:00',
    category: 'Lab Report',
  },
];

export function DocumentsSection({ patientId }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sr #</TableHead>
              <TableHead>Taken By</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Document Category</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              mockDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.srNo}</TableCell>
                  <TableCell>{doc.takenBy}</TableCell>
                  <TableCell>{new Date(doc.dateTime).toLocaleString()}</TableCell>
                  <TableCell>{doc.category}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 icon-action-view" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4 icon-action-edit" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 icon-action-delete" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


