import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'
import { tv, type VariantProps } from 'tailwind-variants'

const button = tv({
  base: [
    'inline-flex items-center justify-center gap-2',
    'font-mono font-medium cursor-pointer',
    'transition-colors duration-150',
    'disabled:opacity-50 disabled:pointer-events-none'
  ],
  variants: {
    variant: {
      primary: 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400',
      secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
      ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-800',
      danger: 'bg-red-600 text-zinc-50 hover:bg-red-500'
    },
    size: {
      sm: 'px-4 py-1.5 text-xs',
      md: 'px-6 py-2.5 text-sm',
      lg: 'px-8 py-3.5 text-base'
    }
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md'
  }
})

type ButtonProps = ComponentProps<'button'> & VariantProps<typeof button>

export function Button({ variant, size, className, children, ...props }: ButtonProps) {
  return (
    <button className={twMerge(button({ variant, size }), className)} {...props}>
      {children}
    </button>
  )
}
