import { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import toast, { Toaster } from 'react-hot-toast'
import { BookOpenCheck, CheckCircle2, Clock3, Plus, Search, Trash2, Trophy } from 'lucide-react'
import { mentorTestsService } from '../services/api'

const defaultValues = {
  title: '',
  durationMin: 30,
  startsAt: '',
  endsAt: '',
  coinReward: 50,
  questions: [
    {
      q: '',
      options: ['', ''],
      correct: 0,
    },
  ],
}

const statusStyles = {
  draft: 'badge-outline text-slate-300',
  scheduled: 'badge-info',
  live: 'badge-success',
  finished: 'badge-warning',
}

export default function TestsPage() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [resultsTest, setResultsTest] = useState(null)
  const [results, setResults] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { register, control, handleSubmit, reset, watch, setValue } = useForm({ defaultValues })
  const { fields, append, remove } = useFieldArray({ control, name: 'questions' })

  const questions = watch('questions') || []

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const matchesSearch = test.title?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || test.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [tests, search, statusFilter])

  useEffect(() => {
    loadTests()
  }, [])

  async function loadTests() {
    try {
      setLoading(true)
      const { data } = await mentorTestsService.listTests('group-1')
      setTests(Array.isArray(data) ? data : data?.tests || [])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(values) {
    try {
      const payload = {
        ...values,
        questions: values.questions.map((question) => ({
          q: question.q,
          options: question.options.filter(Boolean),
          correct: Number(question.correct),
        })),
      }
      await mentorTestsService.createTest('group-1', payload)
      toast.success('Test created successfully')
      reset(defaultValues)
      loadTests()
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function openResults(test) {
    try {
      setResultsTest(test)
      const { data } = await mentorTestsService.getResults(test.id)
      setResults(Array.isArray(data) ? data : data?.results || [])
    } catch (error) {
      toast.error(error.message)
    }
  }

  function addQuestion() {
    append({ q: '', options: ['', ''], correct: 0 })
  }

  function addOption(questionIndex) {
    const current = questions[questionIndex]?.options || []
    setValue(`questions.${questionIndex}.options`, [...current, ''])
  }

  function removeOption(questionIndex, optionIndex) {
    const current = questions[questionIndex]?.options || []
    if (current.length <= 1) return
    const updated = current.filter((_, index) => index !== optionIndex)
    setValue(`questions.${questionIndex}.options`, updated)
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Tests</p>
          <h2 className="text-2xl font-semibold">Test management</h2>
        </div>
        <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          <span className="font-medium">{tests.length}</span> tests available
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Create a test</h3>
            <div className="flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-sm text-sky-300">
              <BookOpenCheck size={16} />
              Builder
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span>Title</span>
                <input {...register('title', { required: true })} className="input input-bordered w-full" placeholder="Midterm quiz" />
              </label>
              <label className="space-y-2 text-sm">
                <span>Duration (min)</span>
                <input type="number" {...register('durationMin', { required: true, valueAsNumber: true })} className="input input-bordered w-full" />
              </label>
              <label className="space-y-2 text-sm">
                <span>Start time</span>
                <input type="datetime-local" {...register('startsAt', { required: true })} className="input input-bordered w-full" />
              </label>
              <label className="space-y-2 text-sm">
                <span>End time</span>
                <input type="datetime-local" {...register('endsAt', { required: true })} className="input input-bordered w-full" />
              </label>
              <label className="space-y-2 text-sm md:col-span-2">
                <span>Coin reward</span>
                <input type="number" {...register('coinReward', { required: true, valueAsNumber: true })} className="input input-bordered w-full" />
              </label>
            </div>

            <div className="space-y-4">
              {fields.map((field, questionIndex) => (
                <div key={field.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-medium">Question {questionIndex + 1}</h4>
                    <button type="button" onClick={() => remove(questionIndex)} className="btn btn-ghost btn-sm text-rose-300">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <label className="mb-3 block space-y-2 text-sm">
                    <span>Question text</span>
                    <input {...register(`questions.${questionIndex}.q`, { required: true })} className="input input-bordered w-full" placeholder="What is 2 + 2?" />
                  </label>

                  <div className="space-y-2">
                    {questions[questionIndex]?.options?.map((option, optionIndex) => (
                      <div key={`${field.id}-${optionIndex}`} className="flex items-center gap-2">
                        <input
                          {...register(`questions.${questionIndex}.options.${optionIndex}`)}
                          className="input input-bordered flex-1"
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                        <input
                          type="radio"
                          name={`correct-${questionIndex}`}
                          className="radio radio-primary"
                          checked={Number(questions[questionIndex]?.correct) === optionIndex}
                          onChange={() => setValue(`questions.${questionIndex}.correct`, optionIndex)}
                        />
                        <button type="button" onClick={() => removeOption(questionIndex, optionIndex)} className="btn btn-ghost btn-sm">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <button type="button" onClick={() => addOption(questionIndex)} className="btn btn-outline btn-sm">
                      <Plus size={15} /> Add option
                    </button>
                    <p className="text-xs text-slate-400">Select the correct option with the radio button.</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={addQuestion} className="btn btn-outline">
                <Plus size={16} /> Add question
              </button>
              <button type="submit" className="btn btn-primary">
                Create test
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Existing tests</h3>
            <div className="flex items-center gap-2">
              <label className="input input-sm input-bordered flex items-center gap-2">
                <Search size={15} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" className="bg-transparent" />
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="select select-sm select-bordered">
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="finished">Finished</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-800" />
              ))}
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">No tests match your current filters.</div>
          ) : (
            <div className="space-y-3">
              {filteredTests.map((test) => (
                <article key={test.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{test.title}</h4>
                        <span className={`badge ${statusStyles[test.status] || 'badge-outline'}`}>{test.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{test.description || 'Structured assessment for your students.'}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1"><Clock3 size={15} /> {test.durationMin || 30} min</span>
                        <span className="flex items-center gap-1"><Trophy size={15} /> {test.coinReward || 50} coins</span>
                        <span className="flex items-center gap-1"><CheckCircle2 size={15} /> {test.questions?.length || 0} questions</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => openResults(test)} className="btn btn-sm btn-outline">
                      Results
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {resultsTest && (
        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Results</p>
              <h3 className="text-lg font-semibold">{resultsTest.title}</h3>
            </div>
            <button type="button" onClick={() => { setResultsTest(null); setResults([]) }} className="btn btn-ghost btn-sm">Close</button>
          </div>
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">No student results available yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Score</th>
                    <th>Completed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id || result.studentId}>
                      <td>{result.studentName || result.studentId}</td>
                      <td>{result.score ?? '—'}</td>
                      <td>{result.completedAt || 'Pending'}</td>
                      <td>{result.status || 'pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
