import { useEffect, useMemo, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowUpRight, Briefcase, CalendarDays, CircleDollarSign, Sparkles } from 'lucide-react'
import { mentorSalaryService } from '../services/api'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function SalaryPage() {
  const [salary, setSalary] = useState(null)
  const [suggestion, setSuggestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    loadData()
  }, [year, month])

  async function loadData() {
    try {
      setLoading(true)
      const [salaryResponse, suggestionResponse] = await Promise.all([
        mentorSalaryService.getSalary('mentor-1', year),
        mentorSalaryService.getSuggestion('mentor-1', month),
      ])
      setSalary(salaryResponse.data)
      setSuggestion(suggestionResponse.data)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const breakdown = useMemo(() => {
    const base = salary?.baseSalary || 0
    const bonus = salary?.bonus || 0
    const total = base + bonus
    return [
      { label: 'Base Salary', value: base },
      { label: 'Bonus', value: bonus },
      { label: 'Total Salary', value: total },
    ]
  }, [salary])

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Salary</p>
          <h2 className="text-2xl font-semibold">Compensation dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={(event) => setYear(Number(event.target.value))} className="select select-sm select-bordered">
            {[2024, 2025, 2026].map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select value={month} onChange={(event) => setMonth(event.target.value)} className="select select-sm select-bordered">
            {months.map((monthName, index) => {
              const value = `${year}-${String(index + 1).padStart(2, '0')}`
              return <option key={value} value={value}>{monthName}</option>
            })}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-3xl bg-slate-800" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {breakdown.map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <CircleDollarSign size={18} className="text-sky-400" />
                </div>
                <p className="mt-3 text-3xl font-semibold">${item.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Monthly breakdown</h3>
                <CalendarDays size={18} className="text-sky-400" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {(salary?.monthlyBreakdown || []).map((entry) => (
                  <div key={entry.month} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{entry.month}</p>
                      <span className="text-sm text-emerald-400">+{entry.bonus || 0}</span>
                    </div>
                    <p className="mt-2 text-2xl font-semibold">${entry.amount?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Suggestion card</h3>
                <Sparkles size={18} className="text-amber-400" />
              </div>
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
                <p className="text-sm text-amber-200">{suggestion?.message || 'Keep delivering strong outcomes to secure your next bonus.'}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                  <Briefcase size={15} />
                  Focus on {suggestion?.focusArea || 'student retention'}.
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Salary chart</h3>
              <ArrowUpRight size={18} className="text-emerald-400" />
            </div>
            <div className="flex h-48 items-end gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              {(salary?.monthlyBreakdown || []).map((entry) => (
                <div key={entry.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-2xl bg-gradient-to-t from-sky-500 to-emerald-400" style={{ height: `${Math.max(20, entry.amount / 40)}px` }} />
                  <span className="text-xs text-slate-400">{entry.month}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
