import type { ComponentProps } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

const spinner = tv({
  base: [
    'inline-block animate-spin rounded-full border-2 border-solid border-current',
    'border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]'
  ],
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12'
    }
  },
  defaultVariants: {
    size: 'md'
  }
})

type SpinnerProps = ComponentProps<'output'> & VariantProps<typeof spinner>

export function Spinner({ size, className, ...props }: SpinnerProps) {
  return <output aria-label="Loading" className={spinner({ size, className })} {...props} />
}
