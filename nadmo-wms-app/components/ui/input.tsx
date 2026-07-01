import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Carbon field: surface fill, no radius, 2px bottom-rule that turns
        // accent on focus (kept 2px always to avoid layout shift).
        "h-10 w-full min-w-0 rounded-none border-0 border-b-2 border-b-control-border bg-control px-4 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-ink-faint focus-visible:border-b-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-b-destructive md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
