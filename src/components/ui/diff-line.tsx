import type { ComponentProps } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

const diffLine = tv({
  slots: {
    root: 'flex items-baseline gap-2 px-4 py-2 font-mono text-xs',
    prefix: 'shrink-0 w-3',
    code: ''
  },
  variants: {
    variant: {
      added: {
        root: 'bg-emerald-950',
        prefix: 'text-emerald-500',
        code: 'text-zinc-100'
      },
      removed: {
        root: 'bg-red-950',
        prefix: 'text-red-500',
        code: 'text-zinc-500'
      },
      context: {
        root: 'bg-transparent',
        prefix: 'text-zinc-600',
        code: 'text-zinc-500'
      }
    }
  },
  defaultVariants: {
    variant: 'context'
  }
})

type DiffLineProps = Omit<ComponentProps<'div'>, 'children'> &
  VariantProps<typeof diffLine> & {
    code: string
  }

export function DiffLine({ variant, code, className }: DiffLineProps) {
  const { root, prefix, code: codeClass } = diffLine({ variant })

  const prefixChar = variant === 'added' ? '+' : variant === 'removed' ? '-' : ' '

  return (
    <div className={root({ className })}>
      <span className={prefix()}>{prefixChar}</span>
      <span className={codeClass()}>{code}</span>
    </div>
  )
}
