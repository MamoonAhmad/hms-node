import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';

const ChiefComplaint = () => {
  const [complaints, setComplaints] = useState([
    { id: 1, name: 'Fever' },
    { id: 2, name: 'Cough' },
    { id: 3, name: 'Pain' },
    { id: 4, name: 'Headache' },
    { id: 5, name: 'Nausea' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [chiefComplaintName, setChiefComplaintName] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return complaints;
    return complaints.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [complaints, search]);

  const total = filtered.length;
  const currentPage = Math.min(Math.max(1, pagination.page), Math.max(1, Math.ceil(total / pagination.limit)));
  const rows = useMemo(
    () =>
      filtered
        .slice((currentPage - 1) * pagination.limit, currentPage * pagination.limit)
        .map((row, i) => ({ ...row, _srNo: (currentPage - 1) * pagination.limit + i + 1 })),
    [filtered, currentPage, pagination.limit]
  );

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);
  const handlePageChange = useCallback((page) => setPagination((p) => ({ ...p, page })), []);
  const handlePageSizeChange = useCallback((limit) => setPagination((p) => ({ ...p, limit, page: 1 })), []);

  const handleAddComplaint = () => {
    if (chiefComplaintName.trim()) {
      if (selectedComplaint) {
        setComplaints(complaints.map((c) =>
          c.id === selectedComplaint.id
            ? { ...c, name: chiefComplaintName.trim() }
            : c
        ));
      } else {
        setComplaints([...complaints, { id: complaints.length + 1, name: chiefComplaintName.trim() }]);
      }
      setChiefComplaintName('');
      setSelectedComplaint(null);
      setIsModalOpen(false);
    }
  };

  const handleCancel = () => {
    setChiefComplaintName('');
    setSelectedComplaint(null);
    setIsModalOpen(false);
  };

  const handleView = (complaint) => {
    setSelectedComplaint(complaint);
    setIsViewModalOpen(true);
  };

  const handleEdit = (complaint) => {
    setSelectedComplaint(complaint);
    setChiefComplaintName(complaint.name);
    setIsModalOpen(true);
  };

  const handleDelete = (complaint) => {
    if (window.confirm(`Are you sure you want to delete "${complaint.name}"?`)) {
      setComplaints(complaints.filter((c) => c.id !== complaint.id));
    }
  };

  const handleAddNew = () => {
    setSelectedComplaint(null);
    setChiefComplaintName('');
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Chief Complaints</h1>
        <Button onClick={handleAddNew} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Chief Complaint
        </Button>
      </div>

      <DataTable
        columns={[
          { key: '_srNo', label: 'Serial Number', render: (row) => row._srNo },
          { key: 'name', label: 'Chief Complaint Name' },
        ]}
        data={rows}
        total={total}
        page={currentPage}
        pageSize={pagination.limit}
        searchValue={search}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by name..."
        emptyMessage="No chief complaints found"
        actions={(complaint) => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleView(complaint)} className="h-8 w-8 p-0" title="View">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleEdit(complaint)} className="h-8 w-8 p-0" title="Edit">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(complaint)} className="h-8 w-8 p-0" title="Delete">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="min-w-[800px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedComplaint ? 'Edit Chief Complaint' : 'Add Chief Complaint'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="chiefComplaintName">Chief Complaint Name</Label>
              <Input
                id="chiefComplaintName"
                value={chiefComplaintName}
                onChange={(e) => setChiefComplaintName(e.target.value)}
                placeholder="Enter chief complaint name"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="button" onClick={handleAddComplaint} className="w-full sm:w-auto">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="min-w-[800px] max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Chief Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="viewChiefComplaintName">Chief Complaint Name</Label>
              <Input
                id="viewChiefComplaintName"
                value={selectedComplaint?.name || ''}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChiefComplaint;
