import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import {
  HiOutlineMagnifyingGlass,
  HiOutlinePaperAirplane,
  HiOutlinePhone,
  HiOutlineVideoCamera,
  HiOutlineChevronLeft,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineFaceSmile,
  HiOutlineArrowUturnLeft,
} from 'react-icons/hi2';
import Button from '../components/Button.jsx';
import api from '../services/api.js';

// ──────────────────────────────────────────────
// Data
// ──────────────────────────────────────────────

const initialContacts = [
  { id: 1, name: 'Aziz Karimov', role: 'Mentor', avatar: 'AK', online: true, lastMsg: 'Salom, bugun dars bormi?', time: '14:30', unread: 2 },
  { id: 2, name: 'Malika Rahimova', role: 'Student', avatar: 'MR', online: false, lastMsg: 'Rahmat, tushundim', time: '12:15', unread: 0 },
  { id: 3, name: 'Jasur Tursunov', role: 'Mentor', avatar: 'JT', online: true, lastMsg: 'Yangi guruh ochdik', time: '11:45', unread: 1 },
  { id: 4, name: 'Sevara Azizova', role: 'Student', avatar: 'SA', online: false, lastMsg: 'Qachon navbatdagi dars?', time: 'Kecha', unread: 0 },
  { id: 5, name: 'Rustam Yuldashev', role: 'Mentor', avatar: 'RY', online: true, lastMsg: "To'lov qilindi", time: '10:20', unread: 3 },
  { id: 6, name: 'Gulnora Sobirova', role: 'Student', avatar: 'GS', online: false, lastMsg: 'Rahmat', time: '9:00', unread: 0 },
];

const initialMessages = {
  1: [
    { id: 1, from: 'them', text: 'Salom, bugun dars bormi?', time: '14:25' },
    { id: 2, from: 'me', text: 'Ha, soat 16:00 da. Tayyormisiz?', time: '14:26' },
    { id: 3, from: 'them', text: 'Ha, tayyorman. Qaysi xonada?', time: '14:27' },
    { id: 4, from: 'me', text: "3-xona. Yangi mavzuni boshlaymiz", time: '14:28' },
    { id: 5, from: 'them', text: 'Yaxshi, kutib qolaman', time: '14:30' },
  ],
  2: [
    { id: 1, from: 'them', text: "Assalomu alaykum, uyga vazifani tushunmadim", time: '11:50' },
    { id: 2, from: 'me', text: "Qaysi topshiriqni tushunmadingiz?", time: '11:52' },
    { id: 3, from: 'them', text: "2-mavzudagi masalani", time: '11:55' },
    { id: 4, from: 'me', text: "Tushuntirib beraman, darsda ko'ramiz", time: '12:00' },
    { id: 5, from: 'them', text: 'Rahmat, tushundim', time: '12:15' },
  ],
  3: [
    { id: 1, from: 'them', text: "Assalomu alaykum, yangi guruh ochdik", time: '11:40' },
    { id: 2, from: 'me', text: "Qaysi fan bo'yicha?", time: '11:41' },
    { id: 3, from: 'them', text: 'Frontend development. 12 talaba bor', time: '11:42' },
    { id: 4, from: 'me', text: "Ajoyib, menga ham qo'shilsangiz", time: '11:45' },
  ],
  4: [
    { id: 1, from: 'them', text: 'Assalomu alaykum', time: 'Kecha' },
    { id: 2, from: 'me', text: 'Va alaykum assalom', time: 'Kecha' },
    { id: 3, from: 'them', text: 'Qachon navbatdagi dars?', time: 'Kecha' },
    { id: 4, from: 'me', text: 'Juma kuni soat 14:00', time: 'Kecha' },
  ],
  5: [
    { id: 1, from: 'them', text: "Assalomu alaykum, to'lov qilindi", time: '10:15' },
    { id: 2, from: 'me', text: "Va alaykum assalom. Qabul qilindi!", time: '10:16' },
    { id: 3, from: 'them', text: "Yana 2 ta talabani qo'shmoqchiman", time: '10:17' },
    { id: 4, from: 'me', text: "Ma'lumotlarini yuboring, qo'shaman", time: '10:18' },
    { id: 5, from: 'them', text: 'Yubordim, tekshiring', time: '10:20' },
  ],
  6: [
    { id: 1, from: 'them', text: "Assalomu alaykum, dars jadvalini o'zgartirsa bo'ladimi?", time: '8:45' },
    { id: 2, from: 'me', text: "Ha, albatta. Qaysi kunga?", time: '8:50' },
    { id: 3, from: 'them', text: 'Seshanbadan payshanbaga', time: '8:55' },
    { id: 4, from: 'me', text: "Mayli, o'zgartiraman", time: '9:00' },
  ],
};

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
  '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗',
  '😋', '😛', '😜', '😝', '🤑', '🤗', '🤭', '🫢',
  '🤔', '🤐', '😐', '😑', '😶', '😏', '😒', '🙄',
  '😬', '😮', '😯', '😲', '😳', '🥺', '😢', '😭',
  '😤', '😡', '🤬', '😈', '👿', '💀', '☠️', '💩',
  '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌',
  '🤲', '🤝', '🙏', '✌️', '🤟', '🤘', '👌', '❤️',
  '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔',
  '🔥', '⭐', '✨', '💯', '🎉', '🎊', '🎈', '🎁',
];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function getInitialsColor(name) {
  const colors = [
    'bg-[#C6FF34]', 'bg-[#2ECC71]', 'bg-[#3B82F6]', 'bg-[#F59E0B]',
    'bg-[#E8543E]', 'bg-[#8FA283]',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getDateLabel(time) {
  if (time === 'Kecha') return 'Yesterday';
  return 'Today';
}

function groupMessagesByDate(messages) {
  const groups = [];
  let currentGroup = null;
  for (const msg of messages) {
    const label = getDateLabel(msg.time);
    if (!currentGroup || currentGroup.label !== label) {
      currentGroup = { label, messages: [] };
      groups.push(currentGroup);
    }
    currentGroup.messages.push(msg);
  }
  return groups;
}

function highlightText(text, query) {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-[var(--green)]/40 text-[var(--text)] rounded-[2px] px-0.5">{part}</mark>
      : part,
  );
}

// ─── Telegram-styled reply quote block ───
function ReplyQuote({ replyTo, isMe, contactName, onQuoteClick }) {
  const isReplyToMe = replyTo.from === 'me';
  const colorBar = isMe
    ? (isReplyToMe ? 'border-l-[#141B10]/40' : 'border-l-[var(--green)]')
    : (isReplyToMe ? 'border-l-[var(--green)]' : 'border-l-[var(--text-muted)]');

  return (
    <div
      onClick={onQuoteClick}
      className={`mb-1.5 pl-2.5 pr-2 py-1 rounded-[6px] border-l-[3px] cursor-pointer transition-colors
        ${isMe
          ? 'bg-[#141B10]/8 hover:bg-[#141B10]/12'
          : 'bg-[var(--border)]/40 hover:bg-[var(--border)]/60'
        }
        ${colorBar}`}
    >
      <div className={`text-[10px] font-bold mb-0.5 ${isMe ? 'text-[#141B10]/70' : 'text-[var(--green)]'}`}>
        {isReplyToMe ? 'Siz' : contactName}
      </div>
      <div className={`text-[11px] leading-snug truncate ${isMe ? 'text-[#141B10]/60' : 'text-[var(--text-secondary)]'}`}>
        {replyTo.text}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Sub-Components
// ──────────────────────────────────────────────

function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
      <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.08em] shrink-0 bg-[var(--glass-bg-strong)] px-3 py-0.5 rounded-full border border-[var(--border)]">
        {label === 'Yesterday' ? 'Kecha' : 'Bugun'}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Chat Component
// ──────────────────────────────────────────────

export default function Chat() {
  const [contacts, setContacts] = useState(initialContacts);
  const [activeChat, setActiveChat] = useState(null);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [showMobileList, setShowMobileList] = useState(true);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [searchSenderFilter, setSearchSenderFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const [deleteChatConfirm, setDeleteChatConfirm] = useState(false);
  const [deleteChatCountdown, setDeleteChatCountdown] = useState(5);
  const [deleteChatDone, setDeleteChatDone] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const messagesEndRef = useRef(null);
  const chatSearchRef = useRef(null);
  const contactSearchRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimerRef = useRef(null);
  const deleteChatTimerRef = useRef(null);
  const deleteChatTimeoutRef = useRef(null);
  const activeMatchRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeContact = contacts.find((c) => c.id === activeChat);
  const allActiveMessages = activeChat ? messages[activeChat] || [] : [];

  useEffect(() => {
    if (activeChat) {
      scrollToBottom();
      setReplyTo(null);
      setShowEmojiPicker(false);
    }
  }, [activeChat, messages]);

  // Fetch messages from API when a chat is selected
  useEffect(() => {
    if (!activeChat) return;

    const contact = contacts.find((c) => c.id === activeChat);
    if (!contact) return;

    const isParent = contact.role === 'Student' || contact.role === 'Parent';
    const roomKey = isParent ? `parent:${activeChat}` : 'global';

    setChatLoading(true);
    setChatError(null);

    api
      .get(`/chat/${roomKey}/messages`, { params: { limit: 50 } })
      .then((res) => {
        const apiMessages = res.data?.data?.messages;
        if (apiMessages && apiMessages.length > 0) {
          setMessages((prev) => ({
            ...prev,
            [activeChat]: apiMessages.map((m, i) => ({
              id: m.id || Date.now() + i,
              from: m.sender_id === 'me' || m.sender_role === 'admin' ? 'me' : 'them',
              text: m.body || '',
              time: m.created_at
                ? new Date(m.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                : getCurrentTime(),
            })),
          }));
        }
      })
      .catch((err) => {
        console.warn('Chat API unavailable, using mock data:', err.message);
        setChatError(null);
      })
      .finally(() => setChatLoading(false));
  }, [activeChat, contacts]);

  useEffect(() => {
    if (showChatSearch) chatSearchRef.current?.focus();
  }, [showChatSearch]);

  useEffect(() => {
    if (showContactSearch) {
      contactSearchRef.current?.focus();
    } else {
      setSearchQuery('');
    }
  }, [showContactSearch]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClick = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showEmojiPicker]);

  useEffect(() => {
    if (!deleteChatConfirm) return;
    deleteChatTimerRef.current = setInterval(() => {
      setDeleteChatCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(deleteChatTimerRef.current);
          setDeleteChatDone(true);
          setDeleteChatCountdown(5);
          deleteChatTimeoutRef.current = setTimeout(() => {
            setDeleteChatDone(false);
            setDeleteChatConfirm(false);
            setMessages((m) => {
              const next = { ...m };
              delete next[activeChat];
              return next;
            });
            setContacts((c) => c.filter((ct) => ct.id !== activeChat));
            setActiveChat(null);
            setShowMobileList(true);
          }, 600);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(deleteChatTimerRef.current);
  }, [deleteChatConfirm, activeChat]);

  useEffect(() => {
    if (!activeChat || !activeContact?.online) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (input.trim()) {
      setIsTyping(true);
      typingTimerRef.current = setTimeout(() => setIsTyping(false), 2000);
    } else {
      setIsTyping(false);
    }
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [input, activeChat, activeContact?.online]);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeMessages = useMemo(() => {
    let filtered = allActiveMessages;
    if (searchSenderFilter !== 'all') {
      filtered = filtered.filter((m) => m.from === searchSenderFilter);
    }
    if (chatSearchQuery.trim()) {
      const q = chatSearchQuery.toLowerCase();
      filtered = filtered.filter((m) => m.text.toLowerCase().includes(q));
    }
    return filtered;
  }, [allActiveMessages, chatSearchQuery, searchSenderFilter]);

  const matchedMessageIds = useMemo(() => {
    if (!chatSearchQuery.trim()) return [];
    const q = chatSearchQuery.toLowerCase();
    return activeMessages
      .map((m) => ({ id: m.id, text: m.text.toLowerCase() }))
      .filter((m) => m.text.includes(q))
      .map((m) => m.id);
  }, [activeMessages, chatSearchQuery]);

  const totalMatches = matchedMessageIds.length;
  const messageGroups = useMemo(() => groupMessagesByDate(activeMessages), [activeMessages]);

  const scrollToMatch = useCallback((index) => {
    const id = matchedMessageIds[index];
    if (!id) return;
    const el = document.querySelector(`[data-message-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [matchedMessageIds]);

  useEffect(() => {
    setSearchMatchIndex(0);
    if (totalMatches > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToMatch(0);
        });
      });
    }
  }, [chatSearchQuery, totalMatches, scrollToMatch, searchSenderFilter]);

  const goToNextMatch = useCallback(() => {
    if (totalMatches === 0) return;
    const next = (searchMatchIndex + 1) % totalMatches;
    setSearchMatchIndex(next);
    scrollToMatch(next);
  }, [searchMatchIndex, totalMatches, scrollToMatch]);

  const goToPrevMatch = useCallback(() => {
    if (totalMatches === 0) return;
    const prev = (searchMatchIndex - 1 + totalMatches) % totalMatches;
    setSearchMatchIndex(prev);
    scrollToMatch(prev);
  }, [searchMatchIndex, totalMatches, scrollToMatch]);

  // ─── Scroll to original message when clicking a reply quote ───
  const scrollToMessage = useCallback((messageId) => {
    const el = document.querySelector(`[data-message-id="${messageId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Flash highlight effect
      el.classList.add('ring-2', 'ring-[var(--green)]', 'ring-offset-2', 'ring-offset-[var(--surface)]');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[var(--green)]', 'ring-offset-2', 'ring-offset-[var(--surface)]');
      }, 1500);
    }
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !activeChat) return;

    const newMessage = {
      id: Date.now(),
      from: 'me',
      text,
      time: getCurrentTime(),
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, from: replyTo.from } : undefined,
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMessage],
    }));

    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeChat
          ? { ...c, lastMsg: text, time: getCurrentTime() }
          : c,
      ),
    );

    setInput('');
    setReplyTo(null);
    setShowEmojiPicker(false);

    const contact = contacts.find((c) => c.id === activeChat);
    if (contact) {
      const isParent = contact.role === 'Student' || contact.role === 'Parent';
      const roomKey = isParent ? `parent:${activeChat}` : 'global';
      api
        .get(`/chat/${roomKey}/messages`, { params: { limit: 1 } })
        .catch(() => {});
    }
  }, [input, activeChat, replyTo]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [handleSend]);

  useLayoutEffect(() => {
    autoResize();
  }, [input, autoResize]);

  const selectChat = (id) => {
    cancelDeleteChat();
    setActiveChat(id);
    setShowMobileList(false);
    setShowChatSearch(false);
    setChatSearchQuery('');
    setSearchSenderFilter('all');
    setReplyTo(null);
    setShowEmojiPicker(false);
    setContacts((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, unread: 0 }
          : c,
      ),
    );
  };

  const goBackToList = () => {
    cancelDeleteChat();
    setShowMobileList(true);
    setActiveChat(null);
    setShowChatSearch(false);
    setChatSearchQuery('');
    setReplyTo(null);
  };

  const deleteMessage = useCallback((chatId, messageId) => {
    setMessages((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || []).filter((m) => m.id !== messageId),
    }));
    setDeleteConfirm(null);
    setReplyTo((prev) => (prev?.id === messageId ? null : prev));
  }, []);

  const handleEmojiSelect = (emoji) => {
    setInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleReply = (msg) => {
    setReplyTo({ id: msg.id, text: msg.text, from: msg.from });
    textareaRef.current?.focus();
  };

  const startDeleteChat = () => {
    setDeleteChatCountdown(5);
    setDeleteChatConfirm(true);
  };

  const cancelDeleteChat = () => {
    clearInterval(deleteChatTimerRef.current);
    clearTimeout(deleteChatTimeoutRef.current);
    setDeleteChatDone(false);
    setDeleteChatConfirm(false);
    setDeleteChatCountdown(5);
  };

  // ─── Group consecutive messages from same sender ───
  // Returns array of groups: { messages: [...], isFirst: bool, isLast: bool, from: string }
  const groupedMessages = useMemo(() => {
    const result = [];
    for (let i = 0; i < activeMessages.length; i++) {
      const msg = activeMessages[i];
      const prevMsg = i > 0 ? activeMessages[i - 1] : null;
      const nextMsg = i < activeMessages.length - 1 ? activeMessages[i + 1] : null;

      const sameAsPrev = prevMsg && prevMsg.from === msg.from;
      const sameAsNext = nextMsg && nextMsg.from === msg.from;

      result.push({
        ...msg,
        isFirst: !sameAsPrev,
        isLast: !sameAsNext,
      });
    }
    return result;
  }, [activeMessages]);

  return (
    <div className="glass-strong rounded-[20px] overflow-hidden flex h-[calc(100vh-240px)] min-h-[500px]">
      {/* ───── Left Panel — Contacts ───── */}
      <div
        className={`w-[280px] shrink-0 border-r border-[var(--border)] flex flex-col bg-[var(--surface)]/30
          ${showMobileList ? 'flex' : 'hidden'} lg:flex`}
      >
        {/* Search header */}
        <div className="p-4 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-extrabold text-[var(--text)] tracking-[-0.02em]">Messages</h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowContactSearch(!showContactSearch)}
                className={`w-7 h-7 rounded-[8px] flex items-center justify-center transition-all duration-200
                  ${showContactSearch
                    ? 'bg-[var(--green-bg)] text-[var(--green)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--green)] hover:bg-[var(--surface)]'
                  }`}
                title="Search contacts"
              >
                <HiOutlineMagnifyingGlass className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--green-bg)] px-2 py-0.5 rounded-full">
                {contacts.length} chats
              </span>
            </div>
          </div>

          {showContactSearch && (
            <div className="relative mt-3 animate-slide-up">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
              <input
                ref={contactSearchRef}
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-9 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[12px] text-[var(--text)] outline-none focus:border-[var(--green)] transition-all duration-200 placeholder:text-[var(--text-muted)]"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowContactSearch(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  <HiOutlineXMark className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto py-1">
          {filteredContacts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[12px] text-[var(--text-secondary)] p-4">
              No contacts found
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isActiveChat = activeChat === contact.id;
              return (
                <button
                  key={contact.id}
                  onClick={() => selectChat(contact.id)}
                  className={`w-full text-left px-4 py-2.5 transition-all duration-200 relative
                    ${isActiveChat
                      ? 'bg-[var(--green-bg)]'
                      : 'hover:bg-[var(--surface-hover)]'
                    }`}
                >
                  {isActiveChat && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-[var(--green)] rounded-r-full" />
                  )}

                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div
                        className={`w-11 h-11 rounded-[12px] flex items-center justify-center
                          text-[#141B10] font-extrabold text-[14px] ${getInitialsColor(contact.name)}
                          ring-2 ring-offset-2 ${isActiveChat ? 'ring-[var(--green)]' : 'ring-transparent'} ring-offset-[var(--surface)]
                          transition-all duration-200`}
                      >
                        {contact.avatar}
                      </div>
                      {contact.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--success)] rounded-full border-[2.5px] border-[var(--surface)]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[13px] truncate ${contact.unread > 0 ? 'font-bold text-[var(--text)]' : 'font-semibold text-[var(--text)]'}`}>
                          {contact.name}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0">{contact.time}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-[11px] text-[var(--text-secondary)] truncate">
                          {contact.lastMsg}
                        </span>
                        {contact.unread > 0 && (
                          <span className="min-w-[20px] h-[18px] rounded-full bg-[var(--green)] text-[#141B10] text-[9px] font-bold flex items-center justify-center shrink-0 px-1.5">
                            {contact.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ───── Right Panel — Chat ───── */}
      <div
        className={`flex-1 flex flex-col ${!showMobileList ? 'flex' : 'hidden'} lg:flex`}
      >
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-[24px] bg-[var(--green-bg)] flex items-center justify-center animate-float">
              <HiOutlinePaperAirplane className="w-8 h-8 text-[var(--green)] -rotate-45" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-bold text-[var(--text)] mb-1">Your messages</p>
              <p className="text-[12px] text-[var(--text-secondary)]">Select a conversation to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Chat Header ── */}
            <div className="shrink-0 px-4 lg:px-5 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]/50">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={goBackToList}
                  className="lg:hidden w-8 h-8 rounded-[10px] bg-[var(--surface)] border border-[var(--border)]
                    flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text)] transition-all shrink-0"
                >
                  <HiOutlineChevronLeft className="w-4 h-4" />
                </button>
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-[12px] flex items-center justify-center
                      text-[#141B10] font-extrabold text-[13px] ${getInitialsColor(activeContact.name)}`}
                  >
                    {activeContact.avatar}
                  </div>
                  {activeContact.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--success)] rounded-full border-[2.5px] border-[var(--surface)]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-[var(--text)] truncate">
                    {activeContact.name}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          activeContact.online ? 'bg-[var(--success)]' : 'bg-[var(--text-muted)]'
                        }`}
                      />
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        {activeContact.online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)]">· {activeContact.role}</span>
                    {chatSearchQuery && (
                      <span className="text-[10px] text-[var(--green)] font-semibold">· {activeMessages.length} found</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {[
                  { icon: HiOutlineMagnifyingGlass, title: 'Search', active: showChatSearch, onClick: () => { setShowChatSearch(!showChatSearch); setChatSearchQuery(''); } },
                  { icon: HiOutlinePhone, title: 'Call' },
                  { icon: HiOutlineVideoCamera, title: 'Video call' },
                  { icon: HiOutlineTrash, title: 'Delete chat', active: deleteChatConfirm, onClick: startDeleteChat },
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.onClick}
                    className={`w-9 h-9 rounded-[10px] border flex items-center justify-center transition-all duration-200
                      ${btn.active
                        ? 'bg-[var(--danger)]/20 border-[var(--danger)] text-[var(--danger)]'
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--danger)] hover:text-[var(--danger)] hover:shadow-[0_0_12px_var(--danger)/30]'
                      }`}
                    title={btn.title}
                  >
                    <btn.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* ── Chat Search ── */}
            {showChatSearch && (
              <div className="shrink-0 px-4 lg:px-5 py-2.5 border-b border-[var(--border)] bg-[var(--surface-hover)] animate-slide-up">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
                    <input
                      ref={chatSearchRef}
                      placeholder="Search messages..."
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.shiftKey) {
                          e.preventDefault();
                          goToPrevMatch();
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          goToNextMatch();
                        }
                      }}
                      className="w-full h-8 pl-9 pr-9 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[12px] text-[var(--text)] outline-none focus:border-[var(--green)] transition-all duration-200"
                    />
                    {chatSearchQuery && (
                      <button
                        onClick={() => setChatSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                      >
                        <HiOutlineXMark className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {chatSearchQuery && totalMatches > 0 && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-semibold text-[var(--text-muted)] min-w-[36px] text-center tabular-nums">
                        {searchMatchIndex + 1}/{totalMatches}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={goToPrevMatch}
                          className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--green)] hover:bg-[var(--green-bg)] transition-all"
                          title="Previous match (Shift+Enter)"
                        >
                          <HiOutlineChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={goToNextMatch}
                          className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--green)] hover:bg-[var(--green-bg)] transition-all"
                          title="Next match (Enter)"
                        >
                          <HiOutlineChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-2">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'me', label: 'Me' },
                    { key: 'them', label: activeContact?.name?.split(' ')[0] || 'Them' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSearchSenderFilter(key)}
                      className={`px-2.5 py-1 rounded-[8px] text-[10px] font-semibold transition-all duration-150
                        ${searchSenderFilter === key
                          ? 'bg-[var(--green)] text-[#141B10]'
                          : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] hover:border-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                  {searchSenderFilter !== 'all' && (
                    <span className="text-[9px] text-[var(--text-muted)] ml-1">
                      {activeMessages.length} msg
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 lg:px-5 py-4 space-y-0.5 scroll-smooth">
              {activeMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-[14px] bg-[var(--green-bg)] flex items-center justify-center mx-auto mb-3">
                      <HiOutlinePaperAirplane className="w-5 h-5 text-[var(--green)] -rotate-45" />
                    </div>
                    <p className="text-[12px] text-[var(--text-secondary)]">
                      {chatSearchQuery ? 'No messages match your search' : 'No messages yet. Say hello!'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {chatSearchQuery && (
                    <div className="text-[10px] text-[var(--text-muted)] text-center mb-3 animate-fade-in">
                      {totalMatches > 0
                        ? `${totalMatches} match${totalMatches !== 1 ? 'es' : ''} found`
                        : 'No matches found'
                      }
                    </div>
                  )}

                  {messageGroups.map((group, gi) => (
                    <div key={gi}>
                      <DateSeparator label={group.label} />
                      <div className="space-y-0.5">
                        {groupedMessages.map((msg, mi) => {
                          const isMe = msg.from === 'me';
                          const matchIndex = matchedMessageIds.indexOf(msg.id);
                          const isActiveMatch = matchIndex === searchMatchIndex && totalMatches > 0;
                          const isFirst = msg.isFirst;
                          const isLast = msg.isLast;

                          // Telegram-style: show avatar only on last message of a group from them
                          const showAvatar = !isMe && isLast;

                          return (
                            <div
                              key={msg.id}
                              data-message-id={msg.id}
                              ref={isActiveMatch ? activeMatchRef : null}
                              className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in group items-end gap-0.5
                                ${!isLast && !isMe ? 'mb-0.5' : ''}
                                ${!isLast && isMe ? 'mb-0.5' : 'mb-1.5'}
                              `}
                            >
                              {/* Telegram-style: placeholder for avatar spacing */}
                              {!isMe && (
                                <div className="w-8 h-0 shrink-0">
                                  {showAvatar && (
                                    <div
                                      className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-[9px] font-bold text-[#141B10] mb-0.5
                                        transition-all duration-200 animate-fade-in ${getInitialsColor(activeContact.name)}`}
                                    >
                                      {activeContact.avatar}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className={`relative max-w-[75%] ${isMe ? '' : 'mr-auto'}`}>
                                {/* Message actions bar - appears on hover, Telegram style */}
                                <div
                                  className={`absolute -top-5 ${isMe ? 'right-0' : 'left-0'} flex items-center gap-0.5
                                    opacity-0 group-hover:opacity-100 transition-all duration-150 z-10`}
                                >
                                  <button
                                    onClick={() => handleReply(msg)}
                                    className="w-6 h-6 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]
                                      flex items-center justify-center hover:text-[var(--green)] hover:border-[var(--green)] transition-all shadow-sm"
                                    title="Reply"
                                  >
                                    <HiOutlineArrowUturnLeft className="w-3 h-3" />
                                  </button>
                                  {isMe && (
                                    <button
                                      onClick={() => setDeleteConfirm(msg.id)}
                                      className="w-6 h-6 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]
                                        flex items-center justify-center hover:text-[var(--danger)] hover:border-[var(--danger)] transition-all shadow-sm"
                                      title="Delete"
                                    >
                                      <HiOutlineTrash className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>

                                {/* Telegram-style bubble with proper grouping */}
                                <div
                                  className={`relative px-3.5 py-2 leading-snug shadow-sm transition-all duration-300
                                    ${isMe
                                      ? 'bg-[var(--green)] text-[#141B10]'
                                      : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]'
                                    }
                                    ${isFirst && isLast
                                      ? isMe ? 'rounded-[18px] rounded-br-[6px]' : 'rounded-[18px] rounded-bl-[6px]'
                                      : isFirst && !isLast
                                        ? isMe ? 'rounded-[18px] rounded-br-[6px] rounded-bl-[18px]' : 'rounded-[18px] rounded-bl-[6px] rounded-br-[18px]'
                                        : !isFirst && isLast
                                          ? isMe ? 'rounded-tl-[18px] rounded-tr-[18px] rounded-br-[6px] rounded-bl-[18px]' : 'rounded-tl-[18px] rounded-tr-[18px] rounded-bl-[6px] rounded-br-[18px]'
                                          : isMe ? 'rounded-[18px] rounded-br-[6px] rounded-bl-[18px] rounded-tr-[18px]' : 'rounded-[18px] rounded-bl-[6px] rounded-br-[18px] rounded-tr-[18px]'
                                    }
                                    ${isActiveMatch
                                      ? 'ring-2 ring-[var(--green)] ring-offset-2 ring-offset-[var(--surface)] scale-[1.02]'
                                      : ''
                                    }`}
                                >
                                  {/* Telegram-style reply quote block */}
                                  {msg.replyTo && (
                                    <ReplyQuote
                                      replyTo={msg.replyTo}
                                      isMe={isMe}
                                      contactName={activeContact?.name}
                                      onQuoteClick={() => scrollToMessage(msg.replyTo.id)}
                                    />
                                  )}

                                  <p className="text-[13px] whitespace-pre-wrap break-words leading-relaxed">
                                    {chatSearchQuery ? highlightText(msg.text, chatSearchQuery) : msg.text}
                                  </p>

                                  {/* Timestamp - only show on last message of a group (Telegram style) */}
                                  {isLast && (
                                    <div className="flex items-center gap-1 mt-1 justify-end">
                                      <span
                                        className={`text-[9px] ${
                                          isMe ? 'text-[#141B10]/55' : 'text-[var(--text-muted)]'
                                        }`}
                                      >
                                        {msg.time}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}

              {/* Typing indicator */}
              {isTyping && activeContact?.online && (
                <div className="flex items-end gap-2 mt-2 animate-fade-in">
                  <div
                    className={`w-7 h-7 rounded-[8px] flex items-center justify-center text-[8px] font-bold text-[#141B10] ${getInitialsColor(activeContact.name)}`}
                  >
                    {activeContact.avatar}
                  </div>
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[14px] rounded-bl-[6px] px-3.5 py-2 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[var(--text-muted)] font-medium">{activeContact.name} typing</span>
                      <TypingDots />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Delete Chat Confirmation ── */}
            {(deleteChatConfirm || deleteChatDone) && (
              <div className="shrink-0 px-4 lg:px-5 py-3 border-b border-[var(--border)] bg-[var(--danger)]/10 animate-slide-up">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold flex items-center gap-2"
                    style={{ color: deleteChatDone ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {deleteChatDone ? (
                      <>
                        <span className="w-4 h-4 flex items-center justify-center">✓</span>
                        Chat o‘chirildi
                      </>
                    ) : (
                      <>
                        <HiOutlineTrash className="w-4 h-4" />
                        <span>
                          Chat o‘chirilmoqda...{' '}
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--danger)]/20 text-[var(--danger)] text-[11px] font-extrabold tabular-nums">
                            {deleteChatCountdown}
                          </span>
                        </span>
                      </>
                    )}
                  </span>
                  {!deleteChatDone && (
                    <Button variant="ghost" size="sm" onClick={cancelDeleteChat}>
                      Cancel
                    </Button>
                  )}
                </div>
                {!deleteChatDone && (
                  <div className="mt-2 h-1 rounded-full bg-[var(--danger)]/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--danger)] transition-all duration-1000 ease-linear"
                      style={{ width: `${(deleteChatCountdown / 5) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── Delete Message Confirmation ── */}
            {deleteConfirm && (
              <div className="shrink-0 px-4 lg:px-5 py-2.5 bg-[var(--danger)]/8 border-t border-[var(--danger)]/15 animate-slide-up">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--danger)] font-semibold flex items-center gap-1.5">
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                    Delete this message?
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>
                      Cancel
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => deleteMessage(activeChat, deleteConfirm)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Telegram-style Reply Preview ── */}
            {replyTo && (
              <div className="shrink-0 px-4 lg:px-5 py-2 bg-[var(--surface-hover)] border-t border-[var(--border)] animate-slide-up">
                <div className="flex items-center gap-2.5">
                  {/* Telegram-style colored left bar */}
                  <div className="w-0.5 h-8 rounded-full bg-[var(--green)] shrink-0" />
                  <div className="flex items-center justify-between min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold text-[var(--green)] uppercase tracking-[0.04em]">
                        {replyTo.from === 'me' ? 'Siz' : activeContact?.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] truncate">{replyTo.text}</div>
                    </div>
                    <button
                      onClick={() => setReplyTo(null)}
                      className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-all shrink-0 ml-2"
                    >
                      <HiOutlineXMark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Input Area ── */}
            <div className="shrink-0 px-4 lg:px-5 py-3 border-t border-[var(--border)] bg-[var(--surface)]/50">
              <div className="flex items-center gap-2">
                {/* Emoji */}
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all duration-200 shrink-0 border border-transparent
                      ${showEmojiPicker
                        ? 'bg-[var(--green-bg)] text-[var(--green)] border-[var(--green)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--green)] hover:bg-[var(--surface)] hover:border-[var(--border)]'
                      }`}
                    title="Emoji"
                  >
                    <HiOutlineFaceSmile className="w-5 h-5" />
                  </button>

                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute bottom-full left-0 mb-2 w-[296px] p-3 rounded-[16px] glass-strong animate-scale-in z-50 shadow-[0_8px_32px_var(--shadow-lg)]"
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.06em]">Emoji</span>
                        <button
                          onClick={() => setShowEmojiPicker(false)}
                          className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                        >
                          <HiOutlineXMark className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJIS.map((emoji, i) => (
                          <button
                            key={i}
                            onClick={() => handleEmojiSelect(emoji)}
                            className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[18px]
                              hover:bg-[var(--surface-hover)] hover:scale-125 transition-all duration-150 cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input + Send */}
                <div
                  className="flex-1 flex items-center gap-2 px-4 py-2 rounded-[14px]
                    border border-[var(--border)] bg-[var(--surface)]
                    focus-within:border-[var(--green)] focus-within:shadow-[0_0_0_3px_var(--green-glow)]
                    transition-all duration-200"
                >
                  <textarea
                    ref={textareaRef}
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] resize-none overflow-y-auto max-h-[150px] leading-relaxed"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="w-8 h-8 rounded-[10px] bg-[var(--green)] flex items-center justify-center
                      text-[#141B10] hover:brightness-110 hover:shadow-[0_4px_12px_var(--green-glow)]
                      transition-all duration-200 shrink-0
                      disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                  >
                    <HiOutlinePaperAirplane className="w-4 h-4" />
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
