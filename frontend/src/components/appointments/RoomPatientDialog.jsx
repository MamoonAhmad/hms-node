import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { roomApi } from '@/services/api';

export function RoomPatientDialog({ open, onOpenChange, appointment, onSubmit, isLoading }) {
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [error, setError] = useState(null);

  const departmentId = appointment?.departmentId || appointment?.departmentRef?.id || null;
  const departmentName =
    appointment?.departmentRef?.departmentName || appointment?.department || null;

  useEffect(() => {
    if (!open) {
      setRoomId('');
      setError(null);
      setRooms([]);
      return;
    }

    let cancelled = false;
    setLoadingRooms(true);
    roomApi
      .getActive(departmentId ? { departmentId } : {})
      .then((res) => {
        if (cancelled) return;
        setRooms(Array.isArray(res.data) ? res.data : []);
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
  }, [open, departmentId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomId) {
      setError('Please select a room');
      return;
    }
    setError(null);
    onSubmit?.(roomId);
  };

  const patientLabel = appointment?.patient
    ? `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim()
    : 'Patient';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Room Patient</DialogTitle>
          <DialogDescription>
            Assign {patientLabel} to an available room
            {departmentName ? ` in ${departmentName}` : ''}. Event status will update to Roomed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-select">Room</Label>
            <Select value={roomId} onValueChange={setRoomId} disabled={loadingRooms || isLoading}>
              <SelectTrigger id="room-select">
                <SelectValue placeholder={loadingRooms ? 'Loading rooms…' : 'Select a room'} />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.displayName || room.roomNumber}
                    {room.floor ? ` · Floor ${room.floor}` : ''}
                    {room.unit ? ` · ${room.unit}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loadingRooms && rooms.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {departmentId
                  ? 'No active rooms available for this appointment department.'
                  : 'No active rooms available.'}
              </p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !roomId}>
              {isLoading ? 'Assigning…' : 'Assign Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
