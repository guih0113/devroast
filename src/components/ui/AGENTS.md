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

## Styling Standards

### Scrollbar Styling

Always use Tailwind's built-in scrollbar utilities. **Never** create custom CSS in `globals.css` for scrollbars.

**Pattern for hidden scrollbars that appear on interaction:**

```tsx
const textareaVariants = tv({
  base: [
    'overflow-auto',
    'scrollbar-thin',
    'scrollbar-track-transparent',
    'scrollbar-thumb-transparent',
    'hover:scrollbar-thumb-zinc-600',
    'focus:scrollbar-thumb-zinc-600'
  ],
  // ...
})
```

**Available Tailwind scrollbar utilities:**
- `scrollbar-thin` — thin scrollbar
- `scrollbar-track-{color}` — scrollbar track color
- `scrollbar-thumb-{color}` — scrollbar thumb color
- `hover:scrollbar-thumb-{color}` — scrollbar on hover
- `focus:scrollbar-thumb-{color}` — scrollbar on focus

---

## Component-Specific Standards

### Code Editor

The code editor component (`code-editor.tsx`) has specific requirements:

1. **Character Limit**
   - Default maximum: `5000` characters
   - Display counter in bottom-right corner of editor
   - Counter shows: `{current}/{max}`
   - Counter color: `text-zinc-600` (normal) → `text-red-400` (over limit)
   - Position: `absolute right-4 bottom-4`
   - Must use `pointer-events-none` to not interfere with editing

2. **Scrollbar Behavior**
   - Hidden by default (transparent)
   - Visible on hover and focus
   - Applied to both `Textarea` and `Highlight` components
   - Uses Tailwind scrollbar utilities only

**Example implementation:**

```tsx
// Character limit constant
const MAX_CODE_LENGTH = 5000

// In component
const isOverLimit = code.length > MAX_CODE_LENGTH

// Counter display
<div className="pointer-events-none absolute right-4 bottom-4">
  <span className={`font-mono text-xs ${isOverLimit ? 'text-red-400' : 'text-zinc-600'}`}>
    {code.length}/{MAX_CODE_LENGTH}
  </span>
</div>

// Button disabled state
<Button disabled={loading || isOverLimit}>
  Submit
</Button>
```

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
