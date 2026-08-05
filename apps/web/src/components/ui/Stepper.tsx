import { cn } from '@/lib/utils'

type StepperProps = {
  steps: string[]
  current: number
  className?: string
}

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <div
      className={cn('w-full', className)}
      aria-label={`Step ${current} of ${steps.length}`}
      data-testid="stepper"
    >
      <ol className="flex items-center justify-between gap-2">
        {steps.map((label, index) => {
          const stepNumber = index + 1
          const complete = current > stepNumber
          const active = current === stepNumber
          return (
            <li key={label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full items-center">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    complete || active
                      ? 'bg-primary-700 text-white'
                      : 'bg-surface-muted text-ink-subtle'
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  {stepNumber}
                </span>
                {index < steps.length - 1 ? (
                  <span
                    className={cn(
                      'mx-2 h-1 flex-1 rounded-full',
                      complete ? 'bg-primary-700' : 'bg-border'
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>
              <span
                className={cn(
                  'text-center text-xs sm:text-sm',
                  active ? 'font-semibold text-ink' : 'text-ink-muted'
                )}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
