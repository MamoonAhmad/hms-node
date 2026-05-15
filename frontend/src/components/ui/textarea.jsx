import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/25 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-20 w-full rounded-lg border bg-card px-3 py-2 text-[0.9375rem] shadow-none transition-[border-color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        className
      )}
      {...props} />
  );
}

export { Textarea }
