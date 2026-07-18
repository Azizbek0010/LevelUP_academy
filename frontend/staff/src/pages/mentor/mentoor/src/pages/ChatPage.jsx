import { useState, useRef, useEffect } from "react";
import { Search, Send, Phone, Video, Smile, Check, ChevronLeft } from "lucide-react";

/* ═══════════════════════════════════════
   Mock static data
   ═══════════════════════════════════════ */

const CONTACTS = [
  {
    id: 1,
    name: "Admin Aziz",
    role: "Admin",
    avatar: "AA",
    online: true,
    lastMsg: "Yangilik bormi?",
    time: "14:30",
    unread: 2,
    color: "bg-[#c6f13c]",
  },
  {
    id: 2,
    name: "Admin Jasur",
    role: "Admin",
    avatar: "AJ",
    online: true,
    lastMsg: "Guruhga yangi student qo'shildi",
    time: "12:15",
    unread: 0,
    color: "bg-[#3b82f6]",
  },
  {
    id: 3,
    name: "Admin Malika",
    role: "Admin",
    avatar: "AM",
    online: false,
    lastMsg: "To'lov qilindi, tekshiring",
    time: "Kecha",
    unread: 1,
    color: "bg-[#f59e0b]",
  },
  {
    id: 4,
    name: "Bosh Admin",
    role: "Super Admin",
    avatar: "BA",
    online: true,
    lastMsg: "Hisobot tayyormi?",
    time: "10:00",
    unread: 0,
    color: "bg-[#2ecc71]",
  },
];

const MOCK_MESSAGES = {
  1: [
    { id: 1, from: "them", text: "Salom, bugun dars nechada?", time: "14:20" },
    { id: 2, from: "me", text: "16:00 da, hammasi reja bo'yicha", time: "14:22" },
    { id: 3, from: "them", text: "Yangi mavzu bormi?", time: "14:25" },
    { id: 4, from: "me", text: "Ha, present simple ni boshlaymiz", time: "14:27" },
    { id: 5, from: "them", text: "Yaxshi, tayyorgarlik ko'raman", time: "14:30" },
  ],
  2: [
    { id: 1, from: "them", text: "Assalomu alaykum!", time: "11:50" },
    { id: 2, from: "me", text: "Va alaykum assalom!", time: "11:52" },
    { id: 3, from: "them", text: "Guruhga 3 ta yangi student qo'shdim", time: "11:55" },
    { id: 4, from: "me", text: "Ajoyib, ma'lumotlarini ko'rib chiqaman", time: "12:00" },
    { id: 5, from: "them", text: "Guruhga yangi student qo'shildi", time: "12:15" },
  ],
  3: [
    { id: 1, from: "them", text: "Assalomu alaykum, to'lov keldi", time: "Kecha 16:30" },
    { id: 2, from: "me", text: "Qaysi studentniki?", time: "Kecha 16:35" },
    { id: 3, from: "them", text: "Valiyeva Aziza, 500 000 so'm", time: "Kecha 16:40" },
    { id: 4, from: "me", text: "Tasdiqladim, rahmat", time: "Kecha 16:45" },
  ],
  4: [
    { id: 1, from: "them", text: "Tonggi hisobotni yubordingizmi?", time: "09:30" },
    { id: 2, from: "me", text: "Hali tayyor emas, 1 soatdan keyin", time: "09:35" },
    { id: 3, from: "them", text: "Iltimos, tezroq bo'lsa", time: "09:40" },
    { id: 4, from: "me", text: "Mayli, hozir yuboraman", time: "09:45" },
    { id: 5, from: "them", text: "Hisobot tayyormi?", time: "10:00" },
  ],
};

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊",
  "🙂", "😉", "😌", "😍", "🥰", "😘", "🤗", "🤔",
  "👍", "👎", "👊", "✊", "👏", "🙌", "🤝", "🙏",
  "❤️", "💛", "💚", "💙", "💜", "🔥", "⭐", "✨",
];

/* ═══════════════════════════════════════
   Helpers
   ═══════════════════════════════════════ */

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/* ═══════════════════════════════════════
   ChatPage
   ═══════════════════════════════════════ */

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState(null);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const activeContact = CONTACTS.find((c) => c.id === activeChat);
  const activeMessages = activeChat ? messages[activeChat] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const filteredContacts = CONTACTS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = () => {
    const text = input.trim();
    if (!text || !activeChat) return;

    const newMsg = {
      id: Date.now(),
      from: "me",
      text,
      time: getCurrentTime(),
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMsg],
    }));
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectChat = (id) => {
    setActiveChat(id);
    setShowMobileList(false);
    setShowEmoji(false);
  };

  const messagesWithGrouping = activeMessages.map((msg, i, arr) => {
    const prev = i > 0 ? arr[i - 1] : null;
    const next = i < arr.length - 1 ? arr[i + 1] : null;
    return {
      ...msg,
      isFirst: !prev || prev.from !== msg.from,
      isLast: !next || next.from !== msg.from,
    };
  });

  /* ═══════════════════════════════ Render ═══════════════════════════════ */
  return (
    <div className="flex h-full min-h-0 gap-0">
      {/* ─── Left: Contacts ─── */}
      <div
        className={`w-[280px] shrink-0 flex flex-col border-r border-line bg-surface-card rounded-l-xl ${
          showMobileList ? "flex" : "hidden"
        } lg:flex`}
      >
        {/* Header */}
        <div className="p-4 pb-3 border-b border-line">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <h2 className="font-display text-[14px] font-semibold text-ink">Xabarlar</h2>
            </div>
            <span className="text-[10px] font-semibold text-ink-faint bg-accent/10 px-2 py-0.5 rounded-full">
              {CONTACTS.length} ta
            </span>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 rounded-lg border border-line bg-surface pl-9 pr-3 text-[12px] text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto py-1.5">
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-ink-faint text-[12px]">
              Kontakt topilmadi
            </div>
          ) : (
            <div className="space-y-0.5 px-2">
              {filteredContacts.map((contact) => {
                const isActive = activeChat === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => selectChat(contact.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                      isActive ? "bg-accent/10" : "hover:bg-surface"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative shrink-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold text-accent-ink ${contact.color}`}
                        >
                          {contact.avatar}
                        </div>
                        {contact.online && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-surface-card" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[13px] font-medium text-ink truncate">
                            {contact.name}
                          </span>
                          <span className="text-[10px] text-ink-faint shrink-0">{contact.time}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <span className="text-[11px] text-ink-soft truncate">
                            {contact.lastMsg}
                          </span>
                          {contact.unread > 0 && (
                            <span className="min-w-[18px] h-[16px] rounded-full bg-accent text-accent-ink text-[9px] font-bold flex items-center justify-center px-1 shrink-0">
                              {contact.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Right: Chat ─── */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${!showMobileList ? "flex" : "hidden"} lg:flex`}
      >
        {!activeChat ? (
          /* ── No chat selected ── */
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Send size={28} className="text-accent -rotate-45" />
            </div>
            <p className="text-[15px] font-semibold text-ink">Xabarlar</p>
            <p className="text-[13px] text-ink-faint">Suhbat boshlash uchun kontakt tanlang</p>
          </div>
        ) : (
          <>
            {/* ── Chat Header ── */}
            <div className="shrink-0 px-5 py-3 border-b border-line flex items-center justify-between bg-surface-card">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => {
                    setShowMobileList(true);
                    setActiveChat(null);
                  }}
                  className="lg:hidden w-8 h-8 rounded-lg border border-line flex items-center justify-center text-ink-soft hover:text-ink transition-colors shrink-0"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold text-accent-ink ${activeContact.color}`}
                  >
                    {activeContact.avatar}
                  </div>
                  {activeContact.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-surface-card" />
                  )}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-ink">{activeContact.name}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-ink-faint">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        activeContact.online ? "bg-success" : "bg-ink-faint"
                      }`}
                    />
                    <span>{activeContact.online ? "Online" : "Offline"}</span>
                    <span>· {activeContact.role}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-ink-faint hover:text-ink hover:border-ink-faint transition-colors">
                  <Phone size={14} />
                </button>
                <button className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-ink-faint hover:text-ink hover:border-ink-faint transition-colors">
                  <Video size={14} />
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {activeMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-ink-faint text-[13px]">
                  Hali xabarlar yo'q
                </div>
              ) : (
                messagesWithGrouping.map((msg) => {
                  const isMe = msg.from === "me";
                  const isLast = msg.isLast;
                  const isFirst = msg.isFirst;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} ${
                        isLast && !isMe ? "mb-3" : isLast && isMe ? "mb-3" : "mb-0.5"
                      }`}
                    >
                      {/* Avatar for them */}
                      {!isMe && (
                        <div className="w-8 shrink-0 mr-2 self-end">
                          {isLast && (
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-accent-ink ${activeContact.color}`}
                            >
                              {activeContact.avatar}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`max-w-[70%] ${isMe ? "mr-0" : "ml-0"}`}>
                        <div
                          className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${
                            isMe
                              ? "bg-accent text-accent-ink"
                              : "bg-surface-card text-ink border border-line"
                          } ${
                            isFirst && isLast
                              ? isMe
                                ? "rounded-[16px] rounded-br-[4px]"
                                : "rounded-[16px] rounded-bl-[4px]"
                              : isFirst
                              ? isMe
                                ? "rounded-[16px] rounded-br-[4px] rounded-bl-[16px]"
                                : "rounded-[16px] rounded-bl-[4px] rounded-br-[16px]"
                              : isLast
                              ? isMe
                                ? "rounded-tl-[16px] rounded-tr-[16px] rounded-br-[4px] rounded-bl-[16px]"
                                : "rounded-tl-[16px] rounded-tr-[16px] rounded-bl-[4px] rounded-br-[16px]"
                              : isMe
                              ? "rounded-[16px] rounded-br-[4px] rounded-bl-[16px] rounded-tr-[16px]"
                              : "rounded-[16px] rounded-bl-[4px] rounded-br-[16px] rounded-tr-[16px]"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          {isLast && (
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span
                                className={`text-[9px] ${
                                  isMe ? "text-accent-ink/55" : "text-ink-faint"
                                }`}
                              >
                                {msg.time}
                              </span>
                              {isMe && <Check size={12} className="text-accent-ink/50" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            <div className="shrink-0 px-5 py-3 border-t border-line bg-surface-card/80">
              <div className="flex items-center gap-2">
                {/* Emoji */}
                <div className="relative">
                  <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      showEmoji
                        ? "bg-accent/10 text-accent"
                        : "text-ink-faint hover:text-ink"
                    }`}
                  >
                    <Smile size={18} />
                  </button>

                  {showEmoji && (
                    <div className="absolute bottom-full left-0 mb-2 w-60 p-3 rounded-xl border border-line bg-surface-card shadow-lg z-50">
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJIS.map((emoji, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setInput((prev) => prev + emoji);
                              setShowEmoji(false);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[16px] hover:bg-surface transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-line bg-surface focus-within:border-accent transition-colors">
                  <textarea
                    ref={textareaRef}
                    placeholder="Xabar yozish..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none text-[13px] text-ink placeholder:text-ink-faint resize-none max-h-[120px]"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-accent-ink hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
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
  );
}
