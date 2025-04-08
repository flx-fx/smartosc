import { createContext, ReactNode, useContext, useEffect } from 'react'
import { Theme } from '../../../shared/types.ts'
import { useConfig } from '@/lib/useConfig.ts'
import { socket } from '@/socket.ts'

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
  const config = useConfig()
  const theme = config?.app.theme || defaultTheme

  useEffect(() => {
    if (!config) return

    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme, config])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      if (['light', 'dark', 'system'].includes(theme)) {
        socket.emit('app-theme', theme)
      }
    },
  }

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
