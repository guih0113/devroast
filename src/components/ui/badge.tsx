import type { ComponentProps } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

const badge = tv({
  slots: {
    root: 'inline-flex items-center gap-2',
    dot: 'size-2 rounded-full shrink-0',
    label: 'font-mono text-xs'
  },
  variants: {
    variant: {
      critical: {
        dot: 'bg-red-500',
        label: 'text-red-500'
      },
      warning: {
        dot: 'bg-amber-500',
        label: 'text-amber-500'
      },
      good: {
        dot: 'bg-emerald-500',
        label: 'text-emerald-500'
      }
    }
  },
  defaultVariants: {
    variant: 'good'
  }
})

type BadgeProps = ComponentProps<'span'> &
  VariantProps<typeof badge> & {
    label: string
  }

export function Badge({ variant, label, className }: BadgeProps) {
  const { root, dot, label: labelClass } = badge({ variant })
  return (
    <span className={root({ className })}>
      <span className={dot()} />
      <span className={labelClass()}>{label}</span>
    </span>
  )
}
