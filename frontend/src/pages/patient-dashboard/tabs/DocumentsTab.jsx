import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Eye, Download, Trash2, FileText } from 'lucide-react';

// Static data
const documents = [
  {
    id: 1,
    fileName: 'Lab Report - CBC.pdf',
    type: 'Lab Report',
    date: '2025-01-15',
    size: '245 KB',
  },
  {
    id: 2,
    fileName: 'Referral Letter.pdf',
    type: 'Referral Letter',
    date: '2025-01-10',
    size: '180 KB',
  },
  {
    id: 3,
    fileName: 'Insurance Card.jpg',
    type: 'Insurance Document',
    date: '2025-01-05',
    size: '125 KB',
  },
  {
    id: 4,
    fileName: 'X-Ray Report.pdf',
    type: 'Radiology Report',
    date: '2025-01-18',
    size: '320 KB',
  },
];

export function DocumentsTab({ patient }) {
  const [docs, setDocs] = useState(documents);

  const handleUpload = () => {
    // Mock: Add new document
    const newDoc = {
      id: Date.now(),
      fileName: 'New Document.pdf',
      type: 'Other',
      date: new Date().toISOString().split('T')[0],
      size: '150 KB',
    };
    setDocs([newDoc, ...docs]);
  };

  const handleDelete = (docId) => {
    setDocs(docs.filter((d) => d.id !== docId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Documents & Attachments</h2>
        <Button onClick={handleUpload}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-32 text-muted-foreground">
                      No documents uploaded
                    </TableCell>
                  </TableRow>
                ) : (
                  docs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{doc.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>{new Date(doc.date).toLocaleDateString()}</TableCell>
                      <TableCell>{doc.size}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
