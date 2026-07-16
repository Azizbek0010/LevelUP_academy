import { useState, useRef, useEffect } from 'react';
import { Search, Send, Smile, Check, ChevronLeft, MessageSquare } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';

/* ═══════════════════════════════════════
   Mock static data
   ═══════════════════════════════════════ */

const CONTACTS = [
  { id: 1, name: 'Admin Aziz', role: 'Admin', online: true, lastMsg: 'Yangilik bormi?', time: '14:30', unread: 2 },
  { id: 2, name: 'Admin Jasur', role: 'Admin', online: true, lastMsg: 'Guruhga yangi student qo\'shildi', time: '12:15', unread: 0 },
  { id: 3, name: 'Admin Malika', role: 'Admin', online: false, lastMsg: 'To\'lov qilindi, tekshiring', time: 'Kecha', unread: 1 },
  { id: 4, name: 'Bosh Admin', role: 'Super Admin', online: true, lastMsg: 'Hisobot tayyormi?', time: '10:00', unread: 0 },
];

const MOCK_MESSAGES = {
  1: [
    { id: 1, from: 'them', text: 'Salom, bugun dars nechada?', time: '14:20' },
    { id: 2, from: 'me', text: '16:00 da, hammasi reja bo\'yicha', time: '14:22' },
    { id: 3, from: 'them', text: 'Yangi mavzu bormi?', time: '14:25' },
    { id: 4, from: 'me', text: 'Ha, present simple ni boshlaymiz', time: '14:27' },
    { id: 5, from: 'them', text: 'Yaxshi, tayyorgarlik ko\'raman', time: '14:30' },
  ],
  2: [
    { id: 1, from: 'them', text: 'Assalomu alaykum!', time: '11:50' },
    { id: 2, from: 'me', text: 'Va alaykum assalom!', time: '11:52' },
    { id: 3, from: 'them', text: 'Guruhga 3 ta yangi student qo\'shdim', time: '11:55' },
    { id: 4, from: 'me', text: 'Ajoyib, ma\'lumotlarini ko\'rib chiqaman', time: '12:00' },
    { id: 5, from: 'them', text: 'Guruhga yangi student qo\'shildi', time: '12:15' },
  ],
  3: [
    { id: 1, from: 'them', text: 'Assalomu alaykum, to\'lov keldi', time: 'Kecha 16:30' },
    { id: 2, from: 'me', text: 'Qaysi studentniki?', time: 'Kecha 16:35' },
    { id: 3, from: 'them', text: 'Valiyeva Aziza, 500 000 so\'m', time: 'Kecha 16:40' },
    { id: 4, from: 'me', text: 'Tasdiqladim, rahmat', time: 'Kecha 16:45' },
  ],
  4: [
    { id: 1, from: 'them', text: 'Tonggi hisobotni yubordingizmi?', time: '09:30' },
    { id: 2, from: 'me', text: 'Hali tayyor emas, 1 soatdan keyin', time: '09:35' },
    { id: 3, from: 'them', text: 'Iltimos, tezroq bo\'lsa', time: '09:40' },
    { id: 4, from: 'me', text: 'Mayli, hozir yuboraman', time: '09:45' },
    { id: 5, from: 'them', text: 'Hisobot tayyormi?', time: '10:00' },
  ],
};

const EMOJIS = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '👍', '👎', '👏', '🙌', '❤️', '🔥', '⭐', '✨'];

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function getInitials(name) {
  const parts = name.split(' ');
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

/* ═══════════════════════════════════════
   Mentor Chat Component
   ═══════════════════════════════════════ */

export default function MentorChat() {
  const [activeChat, setActiveChat] = useState(null);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef(null);

  const activeContact = CONTACTS.find(c => c.id === activeChat);
  const activeMsgs = activeChat ? messages[activeChat] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMsgs]);

  const filtered = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = () => {
    const text = input.trim();
    if (!text || !activeChat) return;
    setMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), { id: Date.now(), from: 'me', text, time: getCurrentTime() }],
    }));
    setInput('');
  };

  const groupedMsgs = activeMsgs.map((msg, i, arr) => {
    const prev = i > 0 ? arr[i - 1] : null;
    return { ...msg, isFirst: !prev || prev.from !== msg.from };
  });

  return (
    <div>
      <PageHeader title="Xabarlar" subtitle="Adminlar bilan suhbat" />

      <div className="card bg-base-100 overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[500px]">
          {/* ─── Contacts ─── */}
          <div className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-base-300">
            <div className="p-4 border-b border-base-200">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  placeholder="Qidirish..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input input-bordered input-sm w-full pl-9 text-sm"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[400px] lg:max-h-[unset]">
              {filtered.map(c => {
                const active = activeChat === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveChat(c.id)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                      active ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-base-200 border-l-2 border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-full grid place-items-center text-sm font-bold ${
                        active ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content'
                      }`}>
                        {getInitials(c.name)}
                      </div>
                      {c.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-medium truncate">{c.name}</span>
                        <span className="text-[11px] text-base-content/40 shrink-0">{c.time}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-xs text-base-content/50 truncate">{c.lastMsg}</span>
                        {c.unread > 0 && (
                          <span className="badge badge-primary badge-xs">{c.unread}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Chat ─── */}
          <div className="flex-1 flex flex-col min-w-0">
            {!activeChat ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-base-content/40">
                <MessageSquare size={48} className="opacity-30" />
                <p className="text-sm">Suhbat boshlash uchun kontakt tanlang</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="shrink-0 px-5 py-3 border-b border-base-200 flex items-center justify-between bg-base-100">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveChat(null)}
                      className="btn btn-ghost btn-sm btn-square lg:hidden"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-primary text-primary-content grid place-items-center text-sm font-bold">
                      {getInitials(activeContact.name)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{activeContact.name}</div>
                      <div className="text-xs text-base-content/50 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${activeContact.online ? 'bg-success' : 'bg-base-300'}`} />
                        {activeContact.online ? 'Online' : 'Offline'} · {activeContact.role}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-base-200/30">
                  {groupedMsgs.map(msg => {
                    const isMe = msg.from === 'me';
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${isMe ? 'order-1' : 'order-1'}`}>
                          <div className={`px-4 py-2.5 text-sm leading-relaxed break-words ${
                            isMe
                              ? 'bg-primary text-primary-content rounded-2xl rounded-br-sm'
                              : 'bg-white text-base-content border border-base-200 rounded-2xl rounded-bl-sm'
                          }`}>
                            <p>{msg.text}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              isMe ? 'text-primary-content/60' : 'text-base-content/40'
                            }`}>
                              <span className="text-[10px]">{msg.time}</span>
                              {isMe && <Check size={11} />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="shrink-0 px-5 py-3 border-t border-base-200 bg-base-100">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowEmoji(!showEmoji)}
                        className="btn btn-ghost btn-sm btn-square text-base-content/50"
                      >
                        <Smile size={18} />
                      </button>
                      {showEmoji && (
                        <div className="absolute bottom-full left-0 mb-2 p-3 rounded-xl border bg-white shadow-lg z-50 w-52">
                          <div className="grid grid-cols-8 gap-1">
                            {EMOJIS.map((emoji, i) => (
                              <button
                                key={i}
                                onClick={() => { setInput(p => p + emoji); setShowEmoji(false); }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-lg hover:bg-base-200 transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        placeholder="Xabar yozish..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        className="input input-bordered input-sm w-full text-sm"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="btn btn-primary btn-sm gap-1"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
