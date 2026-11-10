import { ChartColumn, LibraryBig, Settings2, CalendarDays, Download, WifiOff } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { Logo } from './Logo'

const NAV_ITEMS = [
  { to: '/', label: 'Today', icon: CalendarDays },
  { to: '/weekly', label: 'Weekly', icon: ChartColumn },
  { to: '/library', label: 'Food Library', icon: LibraryBig },
  { to: '/settings', label: 'Settings', icon: Settings2 },
]

function NavItems({ variant }: { variant: 'desktop' | 'mobile' }) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center transition-colors',
                variant === 'desktop'
                  ? 'gap-3 rounded-xl px-3 py-2.5 text-sm font-medium'
                  : 'flex-1 flex-col justify-center gap-0.5 py-2 text-[10px] font-semibold',
                isActive
                  ? variant === 'desktop'
                    ? 'bg-accent-soft/70 text-accent'
                    : 'text-accent'
                  : variant === 'desktop'
                    ? 'text-muted hover:bg-surface-2 hover:text-ink'
                    : 'text-muted hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex items-center justify-center rounded-xl transition-all',
                    variant === 'desktop' ? 'h-8 w-8' : 'h-7 w-11',
                    isActive && variant === 'mobile' && 'bg-accent-soft/80',
                  )}
                >
                  <Icon className={cn(variant === 'desktop' ? 'h-[18px] w-[18px]' : 'h-[19px] w-[19px]')} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span className={variant === 'mobile' ? 'leading-none' : ''}>{item.label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const online = useOnlineStatus()
  const { canInstall, install } = useInstallPrompt()

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex items-center gap-3 px-5 py-6">
          <Logo />
          <div>
            <p className="text-lg font-bold leading-none tracking-tight text-ink">Platewise</p>
            <p className="mt-1 text-[11px] font-medium text-muted">calories, planned</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Main navigation">
          <NavItems variant="desktop" />
        </nav>

        <div className="space-y-3 p-4">
          {canInstall ? (
            <button
              type="button"
              onClick={() => void install()}
              className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface-2/60 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
            >
              <Download className="h-4 w-4 text-accent" />
              <span className="text-xs font-semibold text-ink">Install Platewise</span>
            </button>
          ) : null}

          <div className="rounded-xl border border-line bg-surface-2/50 p-3">
            <div className="flex items-center gap-2">
              {online ? (
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              )}
              <p className="text-[11px] font-semibold text-ink">
                {online ? 'Offline-ready' : 'Working offline'}
              </p>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-muted">
              All data stays in this browser. No account, no cloud.
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/85 backdrop-blur-md lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" />
              <span className="text-base font-bold tracking-tight text-ink">Platewise</span>
            </div>
            <div className="flex items-center gap-1.5">
              {!online ? (
                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </span>
              ) : null}
              {canInstall ? (
                <button
                  type="button"
                  onClick={() => void install()}
                  className="icon-btn"
                  aria-label="Install Platewise"
                  title="Install Platewise"
                >
                  <Download className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch px-2">
          <NavItems variant="mobile" />
        </div>
      </nav>
    </div>
  )
}
