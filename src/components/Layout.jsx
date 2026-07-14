import { NavLink, Outlet } from 'react-router-dom'
import { BookOpenCheck, Briefcase, MessageSquareText, Moon, Sun, Users } from 'lucide-react'
import { useDarkMode } from '../hooks/useDarkMode'

const navItems = [
  { label: 'Tests', to: '/mentor/tests', icon: BookOpenCheck },
  { label: 'Salary', to: '/mentor/salary', icon: Briefcase },
  { label: 'Chat', to: '/mentor/chat', icon: MessageSquareText },
]

export default function Layout() {
  const { isDark, setIsDark } = useDarkMode()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between rounded-3xl border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Mentor Panel</p>
            <h1 className="text-2xl font-semibold">Manage learning, pay, and communication</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="btn btn-ghost btn-sm rounded-full"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm">
              <Users size={16} className="text-emerald-400" />
              <span>Mentor HQ</span>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 lg:flex-row">
          <aside className="w-full rounded-3xl border border-white/10 bg-slate-900/80 p-3 lg:w-64">
            <nav className="space-y-2">
              {navItems.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <main className="flex-1 rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
