import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(function Input({
  className,
  type,
  ...props
}, ref) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/80 selection:bg-primary/15 selection:text-foreground dark:bg-input/30 border-input h-8 w-full min-w-0 rounded-md border bg-card px-2.5 py-1 text-sm shadow-none transition-[border-color,box-shadow,background-color] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60",
        "hover:border-primary/35 focus-visible:border-primary focus-visible:bg-card focus-visible:ring-primary/15 focus-visible:ring-1",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props} />
  );
});

export { Input }
