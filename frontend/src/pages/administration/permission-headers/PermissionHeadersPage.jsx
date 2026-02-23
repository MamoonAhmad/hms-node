import { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { PermissionHeaderFormDialog } from './PermissionHeaderFormDialog';
import { permissionHeaderApi } from '@/services/api';

export function PermissionHeadersPage() {
  const [headers, setHeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHeader, setSelectedHeader] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchHeaders();
  }, []);

  const fetchHeaders = async () => {
    setIsLoading(true);
    try {
      const response = await permissionHeaderApi.getAll();
      setHeaders(response.data || response || []);
    } catch (err) {
      console.error('Error fetching permission headers:', err);
      setHeaders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedHeader(null);
    setIsFormOpen(true);
  };

  const handleEdit = (header) => {
    setSelectedHeader(header);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (selectedHeader) {
        await permissionHeaderApi.update(selectedHeader.id, data);
      } else {
        await permissionHeaderApi.create(data);
      }
      setIsFormOpen(false);
      setSelectedHeader(null);
      fetchHeaders();
    } catch (err) {
      alert(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Permission Headers</h1>
          <p className="text-muted-foreground">Manage permission headers</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Header
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission Header Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center h-32">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : headers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground h-32">
                    No permission headers found
                  </TableCell>
                </TableRow>
              ) : (
                headers.map((header) => (
                  <TableRow key={header.id}>
                    <TableCell className="font-medium">
                      {header.name || header.permissionHeaderName}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(header)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PermissionHeaderFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        header={selectedHeader}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}


