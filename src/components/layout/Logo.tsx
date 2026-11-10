import { UtensilsCrossed } from 'lucide-react'
import { cn } from '../../lib/cn'

export function Logo({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'h-8 w-8 rounded-xl',
    md: 'h-10 w-10 rounded-2xl',
    lg: 'h-12 w-12 rounded-2xl',
  }
  const iconClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center bg-accent text-accent-ink shadow-sm ring-1 ring-inset ring-white/15',
        sizeClasses[size],
        className,
      )}
      aria-hidden="true"
    >
      <UtensilsCrossed className={iconClasses[size]} strokeWidth={2.2} />
    </div>
  )
}
