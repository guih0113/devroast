'use client'

import { Switch, type SwitchRoot } from '@base-ui-components/react/switch'
import type { ComponentProps } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'

const switchVariants = tv({
  slots: {
    root: 'group inline-flex cursor-pointer select-none items-center gap-3',
    track: [
      'relative flex h-[22px] w-10 items-center rounded-full p-[3px]',
      'transition-colors duration-150',
      'group-data-[checked]:bg-emerald-500 group-data-[checked]:justify-end',
      'group-data-[unchecked]:bg-[#2A2A2A] group-data-[unchecked]:justify-start'
    ],
    thumb: [
      'block size-4 rounded-full',
      'transition-all duration-150',
      'data-[checked]:bg-[#0A0A0A]',
      'data-[unchecked]:bg-zinc-500'
    ],
    label: [
      'font-mono text-xs transition-colors duration-150',
      'group-data-[checked]:text-emerald-500',
      'group-data-[unchecked]:text-zinc-500'
    ]
  }
})

type ToggleProps = Omit<ComponentProps<'span'>, 'children'> &
  VariantProps<typeof switchVariants> & {
    checked?: boolean
    defaultChecked?: boolean
    label?: string
    onCheckedChange?: (checked: boolean, eventDetails: SwitchRoot.ChangeEventDetails) => void
  }

export function Toggle({
  checked,
  defaultChecked,
  label,
  onCheckedChange,
  className,
  ...props
}: ToggleProps) {
  const { root, track, thumb, label: labelClass } = switchVariants()

  return (
    <Switch.Root
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      className={root({ className })}
      {...props}
    >
      <div className={track()}>
        <Switch.Thumb className={thumb()} />
      </div>
      {label && <span className={labelClass()}>{label}</span>}
    </Switch.Root>
  )
}
