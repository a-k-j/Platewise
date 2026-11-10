import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initializeDatabase } from './db/initialize'
import './index.css'

function renderFatal(error: unknown): void {
  const root = document.getElementById('root')
  if (!root) return
  const message = error instanceof Error ? error.message : 'Unknown database error.'
  root.innerHTML = `
    <div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f7f6f3;color:#1c1917;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif">
      <div style="max-width:420px;border:1px solid #e7e5e0;border-radius:20px;background:#fff;padding:28px;text-align:center;box-shadow:0 8px 24px -12px rgb(28 25 23 / .12)">
        <h1 style="margin:0;font-size:18px">Platewise could not start</h1>
        <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:#78716c">
          The local database could not be opened. This can happen in private browsing or when browser storage is full.
          Your existing data has not been deleted.
        </p>
        <p style="margin:10px 0 0;font-size:11px;word-break:break-word;color:#a8a29e">${message}</p>
        <button onclick="location.reload()" style="margin-top:18px;height:42px;width:100%;border:0;border-radius:12px;background:#0f766e;color:#fff;font-size:14px;font-weight:600;cursor:pointer">
          Try again
        </button>
      </div>
    </div>
  `
}

async function start(): Promise<void> {
  try {
    await initializeDatabase()
  } catch (error) {
    console.error('Could not initialize the Platewise database.', error)
    renderFatal(error)
    return
  }

  const container = document.getElementById('root')
  if (!container) return

  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )

  try {
    registerSW({ immediate: true })
  } catch (error) {
    // Service workers are unavailable on insecure origins; the app still works normally.
    console.warn('Service worker registration skipped.', error)
  }
}

void start()
