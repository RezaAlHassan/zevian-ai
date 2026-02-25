import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  label,
  id,
  onChange,
  checked,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & { label?: string, onChange?: (c: boolean) => void }) {

  // Backward compatibility for old onChange signature
  const handleCheckedChange = (c: boolean | 'indeterminate') => {
    if (onChange && typeof c === 'boolean') {
      onChange(c);
    }
    if (props.onCheckedChange) {
      props.onCheckedChange(c);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <CheckboxPrimitive.Root
        data-slot="checkbox"
        id={id}
        checked={checked}
        onCheckedChange={handleCheckedChange}
        className={cn(
          "peer border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          ""
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          data-slot="checkbox-indicator"
          className="flex items-center justify-center text-current"
        >
          <Check className="size-3.5" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && (
        <label
          htmlFor={id}
          className={`text-sm font-medium text-foreground cursor-pointer select-none ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {label}
        </label>
      )}
    </div>
  )
}

Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
