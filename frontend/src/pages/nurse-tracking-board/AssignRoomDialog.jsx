import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { roomApi } from '@/services/api';

export function AssignRoomDialog({ open, onOpenChange, appointment, onAssign, isLoading }) {
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingRooms(true);
    roomApi
      .getActive()
      .then((res) => {
        if (!cancelled) setRooms(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setRooms([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRooms(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const patientLabel = appointment?.patient?.displayName || 'Patient';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign / change room</DialogTitle>
          <DialogDescription>
            Select a room for {patientLabel}
            {appointment?.room ? ` (current: ${appointment.room})` : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 space-y-2 overflow-y-auto py-2">
          {loadingRooms && <p className="text-sm text-muted-foreground">Loading rooms…</p>}
          {!loadingRooms && rooms.length === 0 && (
            <p className="text-sm text-muted-foreground">No active rooms available.</p>
          )}
          {rooms.map((room) => {
            const label = room.displayName || room.roomNumber;
            const isCurrent = appointment?.roomId === room.id;
            return (
              <div
                key={room.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              >
                <div>
                  <p className="font-medium">{label}</p>
                  {(room.floor || room.unit) && (
                    <p className="text-xs text-muted-foreground">
                      {[room.floor && `Floor ${room.floor}`, room.unit].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={isCurrent ? 'secondary' : 'default'}
                  disabled={isLoading || isCurrent}
                  onClick={() => onAssign?.(room.id)}
                >
                  Assign room - {room.roomNumber}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
