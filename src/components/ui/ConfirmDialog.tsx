import { useState, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Sheet } from './Sheet'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={cn('flex-1', destructive ? 'btn-danger' : 'btn-primary')}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="flex gap-3.5">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            destructive
              ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
              : 'bg-accent-soft text-accent',
          )}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <div className="mt-1 text-sm leading-relaxed text-muted">{description}</div>
        </div>
      </div>
    </Sheet>
  )
}
