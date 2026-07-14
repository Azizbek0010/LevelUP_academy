import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('mentor-theme') === 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    window.localStorage.setItem('mentor-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return { isDark, setIsDark }
}
