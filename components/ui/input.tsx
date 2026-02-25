import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, label, error, helperText, ...props }: React.ComponentProps<"input"> & { label?: string, error?: string, helperText?: string }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        data-slot="input"
        className={cn(
          "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          error ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50" : "",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-2 text-xs text-destructive font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  )
}

export { Input }
