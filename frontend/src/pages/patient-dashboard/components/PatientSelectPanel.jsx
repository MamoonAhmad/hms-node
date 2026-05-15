import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { patientApi } from '@/services/api';
import { formatPatientName } from '../patientChartUtils';

export function PatientSelectPanel() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPatients = async (q) => {
    setLoading(true);
    try {
      const res = await patientApi.getAll({ limit: 50, search: q || undefined });
      setPatients(res?.data ?? []);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients('');
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPatients(search);
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Select a patient
        </CardTitle>
        <CardDescription>
          Choose a patient to open the clinical chart. Clinical actions are disabled until a patient is selected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9"
              placeholder="Search by name, MRN, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            Search
          </Button>
        </form>
        <ul className="divide-y rounded-lg border max-h-80 overflow-y-auto">
          {loading && (
            <li className="px-4 py-3 text-sm text-muted-foreground">Loading patients…</li>
          )}
          {!loading && patients.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">No patients found.</li>
          )}
          {patients.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-muted/60 transition-colors"
                onClick={() => navigate(`/patient-dashboard/${p.id}`)}
              >
                <span className="font-medium">{formatPatientName(p)}</span>
                <span className="font-mono text-xs text-muted-foreground">{p.mrn}</span>
              </button>
            </li>
          ))}
        </ul>
        <Button variant="outline" onClick={() => navigate('/patients')}>
          Open patient registry
        </Button>
      </CardContent>
    </Card>
  );
}
