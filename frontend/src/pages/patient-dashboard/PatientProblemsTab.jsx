import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Pencil, Plus, Power, Stethoscope, Trash2 } from 'lucide-react';
import { patientApi } from '@/services/api/patient.api';
import { usePatientChart } from './PatientChartContext';
import { ProblemFormDialog } from './ProblemFormDialog';
import { EncounterProblemsPanel } from './EncounterProblemsPanel';
import { PROBLEM_LIST_FILTERS } from './patientProblemConstants';
import { ChartTabShell, EmptyState, RowActionMenu, StatusBadge } from './components/chart-ui';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatAudit(value, userName) {
  if (!value) return '—';
  return (
    <div className="text-sm">
      <div>{formatDateTime(value)}</div>
      {userName && <div className="text-muted-foreground">{userName}</div>}
    </div>
  );
}

function notesPreview(notes) {
  if (!notes) return '—';
  const text = String(notes).trim();
  if (text.length <= 60) return text;
  return `${text.slice(0, 60)}…`;
}

function ProblemActionMenu({ problem, onAction, disabled }) {
  const items = [
    {
      id: 'toggle-status',
      label: problem.status === 'Active' ? 'Mark Inactive' : 'Mark Active',
      icon: Power,
      hidden: problem.status === 'Resolved',
    },
    {
      id: 'resolve',
      label: 'Mark Resolved',
      icon: CheckCircle2,
      hidden: problem.status === 'Resolved',
    },
    { id: 'edit', label: 'Edit', icon: Pencil },
    { id: 'remove', label: 'Remove', icon: Trash2, destructive: true },
  ];
  return (
    <RowActionMenu
      items={items}
      disabled={disabled}
      label="Problem actions"
      onSelect={(actionId) => onAction?.(actionId, problem)}
    />
  );
}

export function PatientProblemsTab() {
  const {
    patient,
    patientId,
    appointmentId,
    isSampleChart,
    refreshKey,
    refreshChart,
  } = usePatientChart();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolveDate, setResolveDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [resolving, setResolving] = useState(false);
  const [visitRefreshKey, setVisitRefreshKey] = useState(0);

  const canFetch = Boolean(patientId && patientId !== 'sample' && !isSampleChart);

  const loadProblems = useCallback(async () => {
    if (!canFetch) {
      setProblems([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const res = await patientApi.getProblems(patientId, params);
      setProblems(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load problems');
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }, [canFetch, patientId, statusFilter]);

  useEffect(() => {
    loadProblems();
  }, [loadProblems, refreshKey]);

  const bumpVisit = () => setVisitRefreshKey((k) => k + 1);

  const openAddForm = () => {
    setEditingProblem(null);
    setFormOpen(true);
  };

  const openEditForm = (problem) => {
    setEditingProblem(problem);
    setFormOpen(true);
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editingProblem?.id) {
        await patientApi.updateProblem(patientId, editingProblem.id, payload);
      } else {
        await patientApi.createProblem(patientId, payload);
      }
      setFormOpen(false);
      setEditingProblem(null);
      await loadProblems();
      bumpVisit();
      refreshChart();
    } catch (err) {
      setError(err.message || 'Failed to save problem');
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (actionId, problem) => {
    if (actionId === 'edit') {
      openEditForm(problem);
      return;
    }
    if (actionId === 'remove') {
      setDeleteTarget(problem);
      return;
    }
    if (actionId === 'resolve') {
      setResolveTarget(problem);
      setResolveDate(new Date().toISOString().slice(0, 10));
      return;
    }
    if (actionId === 'toggle-status') {
      const nextStatus = problem.status === 'Active' ? 'Inactive' : 'Active';
      try {
        await patientApi.updateProblemStatus(patientId, problem.id, nextStatus);
        await loadProblems();
        bumpVisit();
        refreshChart();
      } catch (err) {
        setError(err.message || 'Failed to update status');
      }
    }
  };

  const confirmResolve = async () => {
    if (!resolveTarget) return;
    if (!resolveDate) {
      setError('Resolved date is required');
      return;
    }
    setResolving(true);
    try {
      await patientApi.updateProblemStatus(patientId, resolveTarget.id, 'Resolved', {
        resolvedDate: resolveDate,
      });
      setResolveTarget(null);
      await loadProblems();
      bumpVisit();
      refreshChart();
    } catch (err) {
      setError(err.message || 'Failed to resolve problem');
    } finally {
      setResolving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await patientApi.deleteProblem(patientId, deleteTarget.id);
      setDeleteTarget(null);
      await loadProblems();
      bumpVisit();
      refreshChart();
    } catch (err) {
      setError(err.message || 'Failed to remove problem');
    } finally {
      setDeleting(false);
    }
  };

  if (isSampleChart || patientId === 'sample') {
    return (
      <ChartTabShell
        title="Problems"
        description="Manage ICD-10 diagnoses and problem list for this patient."
      >
        <EmptyState
          icon={Stethoscope}
          title="Demo chart"
          description="Open a registered patient chart to manage the problem list."
        />
      </ChartTabShell>
    );
  }

  return (
    <ChartTabShell
      title="Problems"
      description="Visit-aware problem list: address diagnoses today, then maintain the lifetime ICD list."
      actions={
        <Button onClick={openAddForm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Problem
        </Button>
      }
      error={error}
    >
      <EncounterProblemsPanel
        patientId={patientId}
        appointmentId={appointmentId}
        refreshKey={visitRefreshKey + refreshKey}
        onChanged={() => {
          bumpVisit();
          refreshChart();
        }}
      />

      <div className="flex flex-wrap gap-2">
        {PROBLEM_LIST_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            data-active={statusFilter === filter.id}
            className="chart-filter-chip"
            onClick={() => setStatusFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Stethoscope className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h3 className="text-base font-semibold text-foreground">Problem list</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Loading problems…</span>
          </div>
        ) : problems.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No problems recorded"
            action={openAddForm}
            actionLabel="Add problem"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problem / Diagnosis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Clinical status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Onset</TableHead>
                  <TableHead>Resolved</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Recorded</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-12">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problems.map((problem) => (
                  <TableRow key={problem.id}>
                    <TableCell>
                      <div className="font-medium">{problem.diagnosisDescription}</div>
                      {problem.icd10Code && (
                        <div className="font-mono text-xs text-muted-foreground">
                          {problem.icd10Code}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={problem.status} />
                    </TableCell>
                    <TableCell>
                      {problem.problemType ? (
                        <Badge variant="outline">{problem.problemType}</Badge>
                      ) : (
                        '—'
                      )}
                      {problem.acuity && (
                        <div className="mt-0.5 text-xs text-muted-foreground">{problem.acuity}</div>
                      )}
                    </TableCell>
                    <TableCell>{problem.clinicalStatus || '—'}</TableCell>
                    <TableCell>{problem.verificationStatus || '—'}</TableCell>
                    <TableCell>{formatDate(problem.onsetDate)}</TableCell>
                    <TableCell>{formatDate(problem.resolvedDate)}</TableCell>
                    <TableCell className="max-w-[10rem] text-sm text-muted-foreground">
                      {notesPreview(problem.notes)}
                    </TableCell>
                    <TableCell>
                      {formatAudit(problem.createdAt, problem.createdByName)}
                    </TableCell>
                    <TableCell>
                      {formatAudit(problem.updatedAt, problem.updatedByName)}
                    </TableCell>
                    <TableCell>
                      <ProblemActionMenu
                        problem={problem}
                        onAction={handleAction}
                        disabled={saving || deleting || resolving}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <ProblemFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingProblem(null);
        }}
        record={editingProblem}
        patientDateOfBirth={patient?.dateOfBirth}
        onSubmit={handleSave}
        isLoading={saving}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove problem</DialogTitle>
            <DialogDescription>
              Remove &ldquo;{deleteTarget?.diagnosisDescription}&rdquo; from this patient&apos;s
              problem list? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resolveTarget} onOpenChange={(open) => !open && setResolveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark resolved</DialogTitle>
            <DialogDescription>
              Resolve &ldquo;{resolveTarget?.diagnosisDescription}&rdquo; and set the resolved date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="resolve-date">Resolved date</Label>
            <Input
              id="resolve-date"
              type="date"
              value={resolveDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setResolveDate(e.target.value)}
              disabled={resolving}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setResolveTarget(null)} disabled={resolving}>
              Cancel
            </Button>
            <Button onClick={confirmResolve} disabled={resolving || !resolveDate}>
              {resolving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ChartTabShell>
  );
}
