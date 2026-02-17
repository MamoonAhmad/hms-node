import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export function MultiSelect({ options = [], value = [], onChange, placeholder = 'Select...', className }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const toggleOption = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label)
    .join(', ');

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(!open)}
        className="w-full justify-between"
      >
        <span className={value.length === 0 ? 'text-muted-foreground' : ''}>
          {value.length === 0 ? placeholder : `${value.length} selected${selectedLabels ? `: ${selectedLabels.substring(0, 30)}${selectedLabels.length > 30 ? '...' : ''}` : ''}`}
        </span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </Button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-auto">
          <div className="p-2 space-y-2">
            {options.length === 0 ? (
              <div className="text-sm text-muted-foreground p-2">No options available</div>
            ) : (
              options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer"
                  onClick={() => toggleOption(option.value)}
                >
                  <Checkbox
                    checked={value.includes(option.value)}
                    onCheckedChange={() => toggleOption(option.value)}
                  />
                  <label className="text-sm cursor-pointer flex-1">
                    {option.label}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


