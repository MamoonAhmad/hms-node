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
        "border-gray-300 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/20 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-white px-2.5 py-1.5 text-[13px] leading-snug text-black shadow-sm transition-[border-color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-60",
        className
      )}
      {...props} />
  );
}

export { Textarea }
