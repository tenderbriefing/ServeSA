import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors duration-fast ease-civic focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** Green = primary citizen action */
        default: "bg-green-600 text-white hover:bg-green-700",
        /** Blue = trust / navigation emphasis */
        brand: "bg-primary-600 text-white hover:bg-primary-700",
        destructive:
          "bg-danger text-white hover:bg-danger/90",
        outline:
          "border border-input bg-surface hover:bg-surface-muted hover:text-ink",
        secondary:
          "bg-green-50 text-green-800 hover:bg-green-100 border border-green-200",
        ghost: "hover:bg-surface-muted hover:text-ink",
        link: "text-primary-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-touch h-11 px-4 py-2",
        sm: "min-h-touch h-11 rounded-md px-3",
        lg: "min-h-touch h-12 rounded-md px-8 text-base",
        icon: "h-11 w-11 min-h-touch min-w-touch",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
