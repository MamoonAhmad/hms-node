import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Eye, Search } from 'lucide-react';
import { patientApi } from '@/services/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/PageHeader';

export function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const res = await patientApi.getAll({ limit: 500, search: search || undefined });
      setPatients(res?.data ?? []);
    } catch {
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPatients();
  };

  const handleAddNewPatient = () => {
    navigate('/patients/new');
  };

  const handleEditPatient = (patient) => {
    navigate(`/patients/edit/${patient.id}`);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString();
  };

  return (
    <div className="ehr-page">
      <PageHeader
        title="Patient Management"
        description="Search, register, and maintain demographic and contact records for your patient population."
        breadcrumbs="Patient Management"
        actions={
          <Button onClick={handleAddNewPatient}>
            <Plus className="h-4 w-4" />
            Add patient
          </Button>
        }
      />

      <form
        onSubmit={handleSearch}
        className="content-panel ehr-table-toolbar flex flex-wrap items-center gap-2 rounded-lg"
      >
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, MRN, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      <div className="content-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>MRN</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No patients found
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-mono text-sm">{patient.mrn ?? '—'}</TableCell>
                  <TableCell>{patient.firstName ?? '—'}</TableCell>
                  <TableCell>{patient.lastName ?? '—'}</TableCell>
                  <TableCell>{formatDate(patient.dateOfBirth)}</TableCell>
                  <TableCell>{patient.gender ?? '—'}</TableCell>
                  <TableCell>{patient.contactNumber ?? '—'}</TableCell>
                  <TableCell>{patient.email ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => navigate(`/patient-dashboard/${patient.id}`)}
                        title="View"
                      >
                        <Eye className="h-4 w-4 icon-action-view" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEditPatient(patient)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4 icon-action-edit" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
