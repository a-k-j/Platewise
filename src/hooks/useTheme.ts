import { useEffect } from 'react'
import type { AppSettings } from '../types'

export function useTheme(settings: AppSettings): void {
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const isDark = settings.theme === 'dark' || (settings.theme === 'system' && media.matches)
      root.classList.toggle('dark', isDark)
      try {
        localStorage.setItem('platewise-theme', settings.theme)
      } catch {
        // localStorage can be unavailable in private modes; theming still works for this session.
      }
      const themeMeta = document.querySelector('meta[name="theme-color"]')
      themeMeta?.setAttribute('content', isDark ? '#0c0a09' : '#0f766e')
    }

    apply()
    if (settings.theme === 'system') {
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }
  }, [settings.theme])
}
