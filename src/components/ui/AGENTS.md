# UI Component Patterns

This document defines the patterns every component in `src/components/ui` must follow.
It exists so that both humans and AI agents produce consistent, predictable components.

---

## Stack

| Tool | Role |
|---|---|
| `tailwind-variants` (`tv`) | Variant definition and class merging |
| `tailwind-merge` | **Not used inside components.** `tv` handles merging when `className` is passed as a slot. |
| Tailwind CSS v4 | Styling |

---

## Rules

### 1. Named exports only — never default exports

```tsx
// correct
export function Button({ ... }: ButtonProps) {}

// wrong
export default function Button({ ... }: ButtonProps) {}
```

### 2. Extend native HTML element props via `ComponentProps`

Always spread the native element's props so consumers have access to all HTML attributes
(`onClick`, `disabled`, `aria-*`, `data-*`, etc.).

```tsx
import type { ComponentProps } from 'react'

type ButtonProps = ComponentProps<'button'> & VariantProps<typeof button>
```

### 3. Define variants with `tv()` from `tailwind-variants`

- Use `base` for classes shared across all variants (array form for readability).
- Use `variants` for each axis of variation (`variant`, `size`, etc.).
- Always declare `defaultVariants`.

```tsx
const button = tv({
  base: [
    'inline-flex items-center justify-center',
    'transition-colors duration-150',
    'disabled:opacity-50 disabled:pointer-events-none'
  ],
  variants: {
    variant: {
      primary: 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400',
      secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
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
```

### 4. Pass `className` directly into `tv()` — do not use `twMerge`

`tailwind-variants` accepts `className` as a slot and merges it correctly on its own.
Wrapping with `twMerge` is redundant and must be avoided.

```tsx
// correct
<button className={button({ variant, size, className })} {...props} />

// wrong
<button className={twMerge(button({ variant, size }), className)} {...props} />
```

### 5. Type the props using `VariantProps`

Extract the variant types directly from the `tv()` definition so they stay in sync automatically.

```tsx
import { tv, type VariantProps } from 'tailwind-variants'

type ButtonProps = ComponentProps<'button'> & VariantProps<typeof button>
```

### 6. Destructure variant props explicitly, spread the rest

Variant props (`variant`, `size`, `className`) are pulled out manually.
Everything else is forwarded to the underlying element via `...props`.

```tsx
export function Button({ variant, size, className, children, ...props }: ButtonProps) {
  return (
    <button className={button({ variant, size, className })} {...props}>
      {children}
    </button>
  )
}
```

### 7. One component per file

Each file in `src/components/ui` exports exactly one component.
The filename is the kebab-case name of the component (`button.tsx`, `input.tsx`, `badge.tsx`).

### 8. No business logic inside UI components

UI components are purely presentational. They must not import from feature modules,
call API functions, or manage application state. Keep them generic and reusable.

---

## Full reference example — `button.tsx`

```tsx
import type { ComponentProps } from 'react'
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
    <button className={button({ variant, size, className })} {...props}>
      {children}
    </button>
  )
}
```
