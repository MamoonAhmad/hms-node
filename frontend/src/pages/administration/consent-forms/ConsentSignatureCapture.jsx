import { useRef, useState } from 'react';
import { Eraser, PenLine, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const FULL_NAME_LABELS = {
  patient: 'Patient full legal name',
  witness: 'Witness full legal name',
  provider: 'Provider full legal name',
};

const FULL_NAME_PLACEHOLDERS = {
  patient: 'e.g. Jane Marie Doe',
  witness: 'e.g. John Smith',
  provider: 'e.g. Dr. Sarah Chen, MD',
};

export function getSignatureFullNameLabel(role) {
  return FULL_NAME_LABELS[role] || 'Full legal name';
}

function SignatureCanvas({ className, onInkChange }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const [hasInk, setHasInk] = useState(false);

  const getContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.lineWidth = 2.25;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a5f';
    return ctx;
  };

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: ((e.clientX ?? 0) - rect.left) * scaleX,
      y: ((e.clientY ?? 0) - rect.top) * scaleY,
    };
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onInkChange?.(false);
  };

  const onPointerDown = (e) => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    drawingRef.current = true;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const p = getPoint(e);
    lastPointRef.current = p;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const onPointerMove = (e) => {
    if (!drawingRef.current) return;
    const ctx = getContext();
    if (!ctx) return;
    const p = getPoint(e);
    const last = lastPointRef.current;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
    if (!hasInk && (Math.abs(p.x - last.x) > 0.5 || Math.abs(p.y - last.y) > 0.5)) {
      setHasInk(true);
      onInkChange?.(true);
    }
  };

  const onPointerUp = () => {
    drawingRef.current = false;
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-slate-600">Draw signature</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-slate-500"
          onClick={clear}
          disabled={!hasInk}
        >
          <Eraser className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>
      <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-slate-200 bg-white shadow-inner">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="select-none text-sm font-medium text-slate-200">Sign here</span>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className="relative z-10 h-[120px] w-full touch-none cursor-crosshair rounded-md bg-white sm:h-[140px]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>
      <p className="text-[10px] text-slate-400">Use mouse, touch, or stylus to sign in the box above.</p>
    </div>
  );
}

export function ConsentSignatureCapture({ block, className, variant = 'default' }) {
  const [fullName, setFullName] = useState('');
  const isSimple = variant === 'simple';

  return (
    <div
      className={cn(
        isSimple
          ? 'rounded-md border border-border bg-background p-3'
          : 'overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5',
        className,
      )}
    >
      {!isSimple && (
        <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PenLine className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">{block.label}</p>
            <p className="text-[11px] text-slate-500">Signature required</p>
          </div>
        </div>
      )}

      <div className={cn('space-y-3', !isSimple && 'space-y-4 p-4')}>
        {isSimple && (
          <p className="text-sm font-medium text-foreground">{block.label}</p>
        )}
        <SignatureCanvas className={isSimple ? '[&_label]:text-muted-foreground' : undefined} />

        <div className="space-y-2">
          <Label
            htmlFor={`fullname-${block.role}`}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium',
              isSimple ? 'text-muted-foreground' : 'text-slate-600',
            )}
          >
            {!isSimple && <User className="h-3.5 w-3.5 text-slate-400" />}
            {getSignatureFullNameLabel(block.role)}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`fullname-${block.role}`}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={FULL_NAME_PLACEHOLDERS[block.role] || 'Enter full legal name'}
            className={isSimple ? 'h-9' : 'h-10 border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400'}
          />
        </div>

        {!isSimple && (
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
            <div className="space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Date signed</p>
              <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50/80 px-2 text-sm text-slate-400">
                {new Date().toLocaleDateString()}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Time</p>
              <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50/80 px-2 text-sm text-slate-400">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
