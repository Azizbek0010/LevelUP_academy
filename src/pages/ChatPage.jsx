import { useEffect, useMemo, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { MessageCircleMore, PhoneCall, Search, Send, Wifi, WifiOff } from 'lucide-react'
import { io } from 'socket.io-client'
import { chatService } from '../services/api'

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  autoConnect: false,
})

export default function ChatPage() {
  const [room, setRoom] = useState('staff-hq')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [online, setOnline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadMessages()
    socket.connect()
    socket.on('connect', () => setOnline(true))
    socket.on('disconnect', () => setOnline(false))
    socket.onAny((event, payload) => {
      if (/^chat:(global|parent):/.test(event) && payload) {
        handleIncomingMessage(payload)
      }
    })
    socket.emit('join-room', room)

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.offAny()
      socket.disconnect()
    }
  }, [room])

  async function loadMessages() {
    try {
      setLoading(true)
      const { data } = await chatService.getMessages(room)
      setMessages(Array.isArray(data) ? data : data?.messages || [])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  function handleIncomingMessage(message) {
    setMessages((current) => [...current, message])
  }

  function sendMessage() {
    if (!draft.trim()) return
    const payload = {
      room,
      text: draft,
      sender: 'mentor',
      createdAt: new Date().toISOString(),
    }
    const eventName = room === 'staff-hq' ? 'chat:global:message' : 'chat:parent:message'
    socket.emit(eventName, payload)
    setMessages((current) => [...current, payload])
    setDraft('')
  }

  const visibleMessages = useMemo(() => {
    return messages.filter((message) => message.text?.toLowerCase().includes(search.toLowerCase()))
  }, [messages, search])

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Chat</p>
          <h2 className="text-2xl font-semibold">Realtime communication</h2>
        </div>
        <div className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${online ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
          {online ? <Wifi size={16} /> : <WifiOff size={16} />}
          {online ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Conversations</h3>
            <button type="button" className="btn btn-outline btn-sm">
              <PhoneCall size={15} /> Call
            </button>
          </div>
          <div className="space-y-2">
            {['staff-hq', 'parents-1'].map((item) => (
              <button key={item} onClick={() => setRoom(item)} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${room === item ? 'border-sky-500 bg-sky-500/10' : 'border-white/10 bg-slate-900/70'}`}>
                <div>
                  <p className="font-medium">{item === 'staff-hq' ? 'Staff chat' : 'Parent direct chat'}</p>
                  <p className="text-sm text-slate-400">{item === 'staff-hq' ? 'Team coordination' : 'Direct parent updates'}</p>
                </div>
                <MessageCircleMore size={16} className="text-sky-400" />
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{room === 'staff-hq' ? 'Staff chat' : 'Parent direct chat'}</h3>
            <label className="input input-sm input-bordered flex items-center gap-2">
              <Search size={15} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" className="bg-transparent" />
            </label>
          </div>

          <div className="mb-4 flex h-80 flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/70 p-3">
            {loading ? (
              <div className="h-20 animate-pulse rounded-2xl bg-slate-800" />
            ) : visibleMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">No messages found for this room.</div>
            ) : (
              visibleMessages.map((message, index) => (
                <div key={`${message.createdAt || index}-${index}`} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${message.sender === 'mentor' ? 'ml-auto bg-sky-500 text-white' : 'bg-slate-800 text-slate-200'}`}>
                  <p>{message.text}</p>
                  <p className="mt-1 text-[11px] opacity-70">{message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'now'}</p>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input value={draft} onChange={(event) => setDraft(event.target.value)} className="input input-bordered flex-1" placeholder="Write a message" onKeyDown={(event) => event.key === 'Enter' && sendMessage()} />
            <button type="button" onClick={sendMessage} className="btn btn-primary">
              <Send size={16} />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
