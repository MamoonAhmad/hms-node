import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary/15 selection:text-foreground border-gray-300 h-8 w-full min-w-0 rounded-md border bg-white px-2.5 py-1 text-[13px] leading-tight text-black transition-[border-color,box-shadow] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-[13px] file:font-medium disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-60",
        "hover:border-primary/40 focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props} />
  );
}

export { Input }
