import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-[#0a3258] hover:shadow-md",
        outline:
          "border-border bg-card text-foreground shadow-sm hover:bg-surface hover:border-border",
        secondary:
          "bg-surface text-foreground hover:bg-muted",
        ghost:
          "text-ink-muted hover:bg-surface hover:text-foreground",
        destructive:
          "border-destructive/30 bg-card text-destructive hover:bg-destructive/5",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 rounded-lg px-4",
        sm: "h-8 gap-1.5 rounded-md px-3 text-xs",
        lg: "h-11 gap-2 rounded-lg px-6 text-[15px]",
        icon: "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}


export { Button, buttonVariants }
