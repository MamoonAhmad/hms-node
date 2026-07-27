import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function PatientResumeAction({ tooltip, onClick, disabled = false }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary"
          aria-label={tooltip}
          title={tooltip}
          disabled={disabled}
          onClick={onClick}
        >
          <Play className="h-4 w-4 fill-current" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
