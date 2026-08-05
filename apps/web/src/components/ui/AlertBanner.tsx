import { cn } from '@/lib/utils'
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react'

const variants = {
  info: {
    wrap: 'border-info-border bg-info-tint text-info',
    Icon: Info,
  },
  success: {
    wrap: 'border-success-border bg-success-tint text-success',
    Icon: CheckCircle2,
  },
  warning: {
    wrap: 'border-warning-border bg-warning-tint text-warning',
    Icon: AlertTriangle,
  },
  error: {
    wrap: 'border-danger-border bg-danger-tint text-danger',
    Icon: AlertCircle,
  },
} as const

type AlertBannerProps = {
  variant?: keyof typeof variants
  title?: string
  children: React.ReactNode
  className?: string
  role?: 'status' | 'alert'
}

export function AlertBanner({
  variant = 'info',
  title,
  children,
  className,
  role,
}: AlertBannerProps) {
  const { wrap, Icon } = variants[variant]
  return (
    <div
      className={cn('flex gap-3 rounded-md border p-4 text-sm', wrap, className)}
      role={role || (variant === 'error' ? 'alert' : 'status')}
      data-testid="alert-banner"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={cn(title && 'mt-1')}>{children}</div>
      </div>
    </div>
  )
}
