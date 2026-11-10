import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Platewise crashed while rendering.', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
        <div className="card w-full max-w-md p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-lg font-bold tracking-tight text-ink">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Platewise hit an unexpected error. Your data is still stored in this browser. Reload to try again — if the
            problem continues, export a backup from Settings as soon as the app opens.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary mt-5 w-full"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Platewise
          </button>
          <p className="mt-4 break-words text-[10px] text-muted">{this.state.error.message}</p>
        </div>
      </div>
    )
  }
}
