import * as React from "react"
import { cn } from "@/lib/utils"

function Label({ className, ...props }) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-xs font-semibold uppercase tracking-wide text-foreground/75 peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
}

export { Label }



