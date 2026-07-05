import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { patientProblemApi } from '@/services/api';
import { usePatientChart } from './PatientChartContext';
import { AddProblemDialog } from './problems/AddProblemDialog';
import {
  PROBLEM_STATUS_TABS,
  formatAuditDateTime,
  formatProblemDate,
} from './problems/problemConstants';

function AuditCell({ isoDateTime, userName }) {
  const dateTime = formatAuditDateTime(isoDateTime);
  if (!dateTime) return '—';
  return (
    <div className="min-w-[8.5rem] whitespace-normal leading-snug">
      <div className="text-sm text-foreground">{dateTime}</div>
      <div className="text-xs text-muted-foreground">{userName || 'Unknown'}</div>
    </div>
  );
}

function statusBadgeVariant(status) {
  if (status === 'Active') return 'default';
  if (status === 'Resolved') return 'secondary';
  return 'outline';
}

const ACTION_MENU_WIDTH = 176;

function openActionMenuFromEvent(row, event, setMenuState) {
  const rect = event.currentTarget.getBoundingClientRect();
  const margin = 8;
  let left = rect.right - ACTION_MENU_WIDTH;
  left = Math.max(margin, Math.min(left, window.innerWidth - ACTION_MENU_WIDTH - margin));

  let top = rect.bottom + 4;
  const estimatedHeight = 132;
  if (top + estimatedHeight > window.innerHeight - margin) {
    top = Math.max(margin, rect.top - estimatedHeight - 4);
  }

  setMenuState({ row, top, left });
}

export function PatientProblemsTab() {
  const { patientId, patient, isSampleChart, refreshChart } = usePatientChart();
  const [statusFilter, setStatusFilter] = useState('All');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [editingProblem, setEditingProblem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionMenu, setActionMenu] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const patientDob = patient?.dateOfBirth?.slice?.(0, 10) || patient?.dateOfBirth || null;

  const loadProblems = useCallback(async () => {
    if (!patientId || isSampleChart) return;
    setLoading(true);
    try {
      const res = await patientProblemApi.getAll(patientId, { status: statusFilter });
      setProblems(res.data || []);
    } catch {
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, isSampleChart, statusFilter]);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  const openCreate = () => {
    setDialogMode('create');
    setEditingProblem(null);
    setDialogOpen(true);
  };

  const openEdit = (problem) => {
    setDialogMode('edit');
    setEditingProblem(problem);
    setDialogOpen(true);
    setActionMenu(null);
  };

  const handleSubmit = async (form) => {
    if (isSampleChart) return;
    setSaving(true);
    try {
      if (dialogMode === 'edit' && editingProblem) {
        await patientProblemApi.update(patientId, editingProblem.id, form);
      } else {
        await patientProblemApi.create(patientId, form);
      }
      setDialogOpen(false);
      await loadProblems();
      await refreshChart?.();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (problem) => {
    if (isSampleChart) return;
    setActionLoading(true);
    setActionMenu(null);
    try {
      const nextStatus = problem.status === 'Active' ? 'Inactive' : 'Active';
      await patientProblemApi.update(patientId, problem.id, { status: nextStatus });
      await loadProblems();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget || isSampleChart) return;
    setActionLoading(true);
    try {
      await patientProblemApi.remove(patientId, removeTarget.id);
      setRemoveTarget(null);
      await loadProblems();
      await refreshChart?.();
    } finally {
      setActionLoading(false);
    }
  };

  if (isSampleChart) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Problems</h1>
        <p className="text-sm text-muted-foreground">
          Open a live patient chart to manage the problem list.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Problems</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage ICD-10 diagnoses and problem list status for this patient.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add problem
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PROBLEM_STATUS_TABS.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            size="sm"
            variant={statusFilter === tab.id ? 'default' : 'outline'}
            onClick={() => setStatusFilter(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Problem / diagnosis</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Onset</TableHead>
              <TableHead>Recorded</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-12 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Loading problems…
                </TableCell>
              </TableRow>
            ) : problems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No problems found for this filter.
                </TableCell>
              </TableRow>
            ) : (
              problems.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium">
                      {row.icd10Code ? `${row.icd10Code} — ` : ''}
                      {row.diagnosisDescription}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(row.status)}>{row.status}</Badge>
                  </TableCell>
                  <TableCell>{row.verificationStatus || 'None'}</TableCell>
                  <TableCell>{formatProblemDate(row.onsetDate)}</TableCell>
                  <TableCell>
                    <AuditCell isoDateTime={row.createdAt} userName={row.createdByName} />
                  </TableCell>
                  <TableCell>
                    <AuditCell isoDateTime={row.updatedAt} userName={row.updatedByName} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={actionLoading}
                      onClick={(event) => {
                        if (actionMenu?.row?.id === row.id) {
                          setActionMenu(null);
                        } else {
                          openActionMenuFromEvent(row, event, setActionMenu);
                        }
                      }}
                      aria-label="Actions"
                      aria-expanded={actionMenu?.row?.id === row.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {actionMenu &&
        createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[100]"
              aria-hidden
              onClick={() => setActionMenu(null)}
            />
            <div
              className="fixed z-[101] w-44 rounded-md border bg-popover p-1 shadow-lg"
              style={{ top: actionMenu.top, left: actionMenu.left }}
            >
              {(actionMenu.row.status === 'Active' || actionMenu.row.status === 'Inactive') && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleToggleActive(actionMenu.row)}
                >
                  {actionMenu.row.status === 'Active' ? 'Mark as inactive' : 'Mark as active'}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start"
                onClick={() => openEdit(actionMenu.row)}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                className={cn('w-full justify-start text-destructive hover:text-destructive')}
                onClick={() => {
                  setRemoveTarget(actionMenu.row);
                  setActionMenu(null);
                }}
              >
                Remove
              </Button>
            </div>
          </>,
          document.body,
        )}

      <AddProblemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialProblem={editingProblem}
        patientDob={patientDob}
        onSubmit={handleSubmit}
        saving={saving}
      />

      <Dialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove problem</DialogTitle>
            <DialogDescription>
              Remove{' '}
              <span className="font-medium text-foreground">
                {removeTarget?.diagnosisDescription}
              </span>{' '}
              from this patient&apos;s problem list?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleRemove} disabled={actionLoading}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
