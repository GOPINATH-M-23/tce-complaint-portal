import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(
    () => localStorage.getItem('tce-theme') === 'dark',
  )

  useEffect(() => {
    const root = document.documentElement
    if (dark) { root.classList.add('dark');    localStorage.setItem('tce-theme', 'dark') }
    else       { root.classList.remove('dark'); localStorage.setItem('tce-theme', 'light') }
  }, [dark])

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
