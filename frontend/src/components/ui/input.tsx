import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors duration-120 outline-none placeholder:text-ink-muted focus-visible:border-[#1B4B8C] focus-visible:ring-1 focus-visible:ring-[#1B4B8C] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
