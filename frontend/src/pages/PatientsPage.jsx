import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { PatientFormDialog } from '@/components/patients/PatientFormDialog';
import { DeleteConfirmDialog } from '@/components/patients/DeleteConfirmDialog';
import { patientApi } from '@/services/api';

export function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search) params.search = search;
      if (genderFilter) params.gender = genderFilter;

      const response = await patientApi.getAll(params);
      setPatients(response.data);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, genderFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleGenderChange = (value) => {
    setGenderFilter(value === 'all' ? '' : value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = useCallback((newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handlePageSizeChange = useCallback((limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const handleCreate = () => {
    setSelectedPatient(null);
    setIsFormOpen(true);
  };

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setIsFormOpen(true);
  };

  const handleDelete = (patient) => {
    setSelectedPatient(patient);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (selectedPatient) {
        await patientApi.update(selectedPatient.id, data);
      } else {
        await patientApi.create(data);
      }
      setIsFormOpen(false);
      fetchPatients();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      await patientApi.delete(selectedPatient.id);
      setIsDeleteOpen(false);
      fetchPatients();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '-';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatPatientName = (patient) => {
    const parts = [];
    if (patient.firstName) parts.push(patient.firstName);
    if (patient.middleName) parts.push(patient.middleName);
    if (patient.lastName) parts.push(patient.lastName);
    if (patient.suffix) parts.push(patient.suffix);
    return parts.join(' ') || '-';
  };

  const formatCityState = (patient) => {
    const parts = [];
    if (patient.city) parts.push(patient.city);
    if (patient.state) parts.push(patient.state);
    return parts.join(', ') || '-';
  };

  const formatPhoneNumber = (patient) => {
    return patient.cellPhone || patient.homePhone || patient.workPhone || patient.contactNumber || '-';
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const patientColumns = [
    { key: 'name', label: 'Patient Name', cellClassName: 'font-medium whitespace-nowrap', render: (row) => formatPatientName(row) },
    { key: 'mrn', label: 'MRN / Patient ID', cellClassName: 'font-mono text-xs whitespace-nowrap', render: (row) => row.mrn || '-' },
    { key: 'age', label: 'Age', cellClassName: 'whitespace-nowrap', render: (row) => calculateAge(row.dateOfBirth) },
    { key: 'gender', label: 'Gender', cellClassName: 'capitalize whitespace-nowrap', render: (row) => row.gender || '-' },
    { key: 'dateOfBirth', label: 'Date of Birth', cellClassName: 'whitespace-nowrap', render: (row) => formatDate(row.dateOfBirth) },
    { key: 'phone', label: 'Phone Number', cellClassName: 'whitespace-nowrap', render: (row) => formatPhoneNumber(row) },
    { key: 'cityState', label: 'City / State', cellClassName: 'whitespace-nowrap', render: (row) => formatCityState(row) },
    { key: 'status', label: 'Patient Status', cellClassName: 'whitespace-nowrap', render: (row) => <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">{row.status || 'Active'}</span> },
    { key: 'lastVisitDate', label: 'Last Visit Date', cellClassName: 'whitespace-nowrap', render: (row) => formatDate(row.lastVisitDate) },
    { key: 'primaryProvider', label: 'Primary Provider', cellClassName: 'whitespace-nowrap', render: (row) => row.primaryProvider || row.primaryCarePhysician || '-' },
    { key: 'insurance', label: 'Primary Insurance', cellClassName: 'whitespace-nowrap', render: (row) => row.insuranceProvider?.name || row.insuranceCompany || '-' },
    { key: 'accountBalance', label: 'Account Balance', cellClassName: 'whitespace-nowrap', render: (row) => formatCurrency(row.accountBalance) },
    { key: 'createdAt', label: 'Created Date', cellClassName: 'whitespace-nowrap', render: (row) => formatDateTime(row.createdAt) },
    { key: 'updatedAt', label: 'Last Updated', cellClassName: 'whitespace-nowrap', render: (row) => formatDateTime(row.updatedAt) },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="text-muted-foreground">Manage patient records</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Patient
        </Button>
      </div>

      <div className="flex gap-4">
        <Select value={genderFilter || 'all'} onValueChange={handleGenderChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Genders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <DataTable
        columns={patientColumns}
        data={patients}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        searchValue={search}
        isLoading={isLoading}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder="Search by name, MRN, phone, or city..."
        emptyMessage="No patients found"
        actions={(patient) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(patient)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(patient)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      {/* Dialogs */}
      <PatientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        patient={selectedPatient}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        patient={selectedPatient}
        onConfirm={handleDeleteConfirm}
        isLoading={isSubmitting}
      />
    </div>
  );
}



