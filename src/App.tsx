import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AppShell } from './components/layout/AppShell'
import { ToastProvider } from './components/ui/ToastProvider'
import { useSettings } from './hooks/useSettings'
import { useTheme } from './hooks/useTheme'
import { TodayPage } from './pages/TodayPage'
import { LibraryPage } from './pages/LibraryPage'
import { SettingsPage } from './pages/SettingsPage'

// Weekly is split into its own chunk so Recharts is not part of the first paint.
const WeeklyPage = lazy(() =>
  import('./pages/WeeklyPage').then((module) => ({ default: module.WeeklyPage })),
)

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted" role="status" aria-label="Loading page">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )
}

function ThemedApp() {
  const { settings } = useSettings()
  useTheme(settings)

  return (
    <AppShell>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/weekly" element={<WeeklyPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<TodayPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <ThemedApp />
      </ToastProvider>
    </HashRouter>
  )
}
