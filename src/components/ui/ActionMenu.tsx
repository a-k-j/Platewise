import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface ActionMenuItem {
  label: string
  icon?: LucideIcon
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

interface ActionMenuProps {
  items: ActionMenuItem[]
  children: (controls: { open: boolean; toggle: () => void }) => ReactNode
  align?: 'left' | 'right'
  widthClassName?: string
}

export function ActionMenu({ items, children, align = 'right', widthClassName = 'w-52' }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      {children({ open, toggle: () => setOpen((current) => !current) })}
      {open ? (
        <div
          className={cn(
            'absolute top-full z-30 mt-1.5 rounded-xl border border-line bg-surface p-1.5 shadow-xl animate-fade-in',
            widthClassName,
            align === 'right' ? 'right-0' : 'left-0',
          )}
          role="menu"
        >
          {items.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false)
                  item.onSelect()
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40',
                  item.destructive ? 'text-red-600 dark:text-red-400' : 'text-ink',
                )}
              >
                {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                {item.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
