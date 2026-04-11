import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import ProfileNav from '../../components/ProfileNav';
import { useAuth } from '../../context/AuthContext';
import {
  fetchChatUsers,
  fetchConversation,
  fetchConversationList,
  sendChatMessage,
} from '../../api/messages';

const CHAT_ROLES = ['Farmer', 'Distributor', 'Transporter'];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const formatTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const getRoleBadge = (role) => {
  if (role === 'Farmer')      return { bg: '#f0fdf4', color: '#15803d', border: '#86efac', dot: '#22c55e' };
  if (role === 'Distributor') return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', dot: '#fb923c' };
  if (role === 'Transporter') return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#60a5fa' };
  return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', dot: '#94a3b8' };
};

const getDisplayName = (u) =>
  u?.businessName || u?.companyName || u?.fullName || u?.email || 'Unknown';

const getInitial = (u) => getDisplayName(u)[0]?.toUpperCase() || 'U';

/* ── Avatar ── */
const Avatar = ({ user, size = 44, fontSize = 16 }) => {
  const b = getRoleBadge(user?.role);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(145deg, ${b.color}18 0%, ${b.color}30 100%)`,
      border: `2px solid ${b.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize, color: b.color,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      flexShrink: 0, userSelect: 'none',
    }}>
      {getInitial(user)}
    </div>
  );
};

/* ── Role Pill ── */
const RolePill = ({ role }) => {
  const b = getRoleBadge(role);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: b.bg, color: b.color, border: `1px solid ${b.border}`,
      borderRadius: 100, padding: '2px 9px', fontSize: 10, fontWeight: 700,
      fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: b.dot, display: 'inline-block', flexShrink: 0 }} />
      {role}
    </span>
  );
};

/* ── Typing dots indicator ── */
const TypingDots = () => (
  <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
    {[0, 1, 2].map(i => (
      <span key={i} className="ag-dot" style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
  </div>
);

const MessagesPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [chatUsers, setChatUsers]               = useState([]);
  const [conversationList, setConversationList] = useState([]);
  const [activeUser, setActiveUser]             = useState(null);
  const [messages, setMessages]                 = useState([]);
  const [messageDraft, setMessageDraft]         = useState('');
  const [search, setSearch]                     = useState('');
  const [loadingSidebar, setLoadingSidebar]     = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sendingMessage, setSendingMessage]     = useState(false);
  const [mobileSidebar, setMobileSidebar]       = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  /* ── font injection ── */
  useEffect(() => {
    const id = 'ag-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=Playfair+Display:wght@700;900&display=swap';
    document.head.appendChild(link);
  }, []);

  /* ── KEY FIX: scroll to bottom inside messages container ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── focus textarea when switching chats ── */
  useEffect(() => {
    if (activeUser) {
      setTimeout(() => textareaRef.current?.focus(), 100);
      setMobileSidebar(false);
    }
  }, [activeUser?._id]);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    if (!CHAT_ROLES.includes(user?.role)) {
      toast.error('Messaging is only available for Farmer, Distributor, and Transporter accounts');
      navigate('/dashboard'); return;
    }
    void loadSidebarData();
  }, [token, user?.role]);

  useEffect(() => {
    if (!token || !user?.id || !CHAT_ROLES.includes(user?.role)) return;
    const socket = io(API_BASE_URL, { transports: ['websocket'], withCredentials: true });
    socket.emit('join', user.id);
    const onReceive = (message) => {
      const senderId   = message?.sender?._id;
      const receiverId = message?.receiver?._id;
      const activeId   = activeUser?._id;
      if (activeId && (senderId === activeId || receiverId === activeId)) {
        setMessages((prev) => {
          const exists = prev.some((item) => item._id === message._id);
          return exists ? prev : [...prev, message];
        });
      }
      void loadSidebarData({ silent: true });
    };
    socket.on('receive_message', onReceive);
    return () => { socket.off('receive_message', onReceive); socket.disconnect(); };
  }, [token, user?.id, user?.role, activeUser?._id]);

  useEffect(() => {
    if (!token || !activeUser?._id) return;
    void loadConversation(activeUser);
  }, [activeUser?._id, token]);

  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      void loadSidebarData({ silent: true });
      if (activeUser?._id) void loadConversation(activeUser, { silent: true });
    }, 8000);
    return () => clearInterval(id);
  }, [token, activeUser?._id]);

  const loadSidebarData = async ({ silent = false } = {}) => {
    if (!silent) setLoadingSidebar(true);
    try {
      const [usersRes, listRes] = await Promise.all([fetchChatUsers(token), fetchConversationList(token)]);
      const users         = usersRes?.data || [];
      const conversations = listRes?.data  || [];
      setChatUsers(users);
      setConversationList(conversations);
      if (!activeUser && conversations.length > 0) setActiveUser(conversations[0].user);
    } catch (error) {
      if (!silent) toast.error(error.message || 'Failed to load messaging data');
    } finally {
      if (!silent) setLoadingSidebar(false);
    }
  };

  const loadConversation = async (targetUser, { silent = false } = {}) => {
    if (!targetUser?._id) return;
    if (!silent) setLoadingConversation(true);
    try {
      const res = await fetchConversation(token, targetUser._id);
      setMessages(res?.data || []);
      if (!silent) void loadSidebarData({ silent: true });
    } catch (error) {
      if (!silent) toast.error(error.message || 'Failed to load conversation');
    } finally {
      if (!silent) setLoadingConversation(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = messageDraft.trim();
    if (!activeUser?._id) { toast.error('Select a user to chat with'); return; }
    if (!content)          { toast.error('Message cannot be empty'); return; }
    setSendingMessage(true);
    try {
      const res = await sendChatMessage(token, { receiverId: activeUser._id, content });
      const newMsg = res?.data;
      if (newMsg) setMessages((prev) => [...prev, newMsg]);
      setMessageDraft('');
      textareaRef.current?.focus();
      await loadSidebarData({ silent: true });
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSendMessage(e);
  };

  const mergedUsers = useMemo(() => {
    const map = new Map();
    conversationList.forEach((item) => {
      if (item?.user?._id) map.set(item.user._id, { ...item.user, lastMessage: item.lastMessage, unreadCount: item.unreadCount || 0 });
    });
    chatUsers.forEach((item) => {
      if (item?._id && !map.has(item._id)) map.set(item._id, { ...item, unreadCount: 0 });
    });
    const all = Array.from(map.values()).sort((a, b) => {
      const ud = (b.unreadCount || 0) - (a.unreadCount || 0);
      if (ud !== 0) return ud;
      return new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0);
    });
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter((item) =>
      [getDisplayName(item), item.role, item.email, item.companyName, item.businessName]
        .some((s) => s?.toLowerCase().includes(term))
    );
  }, [conversationList, chatUsers, search]);

  const totalUnread = mergedUsers.reduce((s, u) => s + (u.unreadCount || 0), 0);

  const noRoleAccess = token && user?.role && !CHAT_ROLES.includes(user.role);
  if (noRoleAccess) return null;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Keyframes ── */
        @keyframes ag-rise {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes ag-fade {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes ag-slide-left {
          from { opacity:0; transform:translateX(-16px); }
          to   { opacity:1; transform:translateX(0);     }
        }
        @keyframes ag-msg-right {
          from { opacity:0; transform:translateX(20px) scale(0.94); }
          to   { opacity:1; transform:translateX(0) scale(1);       }
        }
        @keyframes ag-msg-left {
          from { opacity:0; transform:translateX(-20px) scale(0.94); }
          to   { opacity:1; transform:translateX(0) scale(1);        }
        }
        @keyframes ag-pulse-ring {
          0%   { transform:scale(1); opacity:.6; }
          100% { transform:scale(2.2); opacity:0; }
        }
        @keyframes ag-typing {
          0%,80%,100% { transform:translateY(0);   opacity:.35; }
          40%          { transform:translateY(-5px); opacity:1;   }
        }
        @keyframes ag-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes ag-skeleton {
          0%,100% { opacity:.5; }
          50%     { opacity:1;  }
        }
        @keyframes ag-spin {
          to { transform: rotate(360deg); }
        }

        /* ── Utility ── */
        .ag-rise { animation: ag-rise 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .ag-d1   { animation-delay: 80ms;  }
        .ag-d2   { animation-delay: 160ms; }
        .ag-fade { animation: ag-fade 0.35s ease both; }

        /* ── Custom scrollbar ── */
        .ag-scroll::-webkit-scrollbar          { width: 4px; }
        .ag-scroll::-webkit-scrollbar-track   { background: transparent; }
        .ag-scroll::-webkit-scrollbar-thumb   { background: #d1fae5; border-radius: 10px; }
        .ag-scroll::-webkit-scrollbar-thumb:hover { background: #6ee7b7; }

        /* ── Sidebar contact row ── */
        .ag-contact {
          width:100%; text-align:left; border:none; cursor:pointer;
          padding:10px 12px; border-radius:16px; background:transparent;
          border: 1.5px solid transparent;
          transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .ag-contact:hover {
          background: #f0fdf4;
          border-color: #a7f3d0;
          transform: translateX(3px);
        }
        .ag-contact.active {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border-color: #6ee7b7;
          box-shadow: 0 4px 18px rgba(16,185,129,0.13);
        }
        .ag-contact.has-unread {
          background: #fefce8;
          border-color: #fde68a;
        }

        /* ── Search input ── */
        .ag-search {
          display:flex; align-items:center; gap:10px;
          background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:14px;
          padding:9px 14px; transition: all 0.22s ease;
        }
        .ag-search:focus-within {
          border-color: #6ee7b7;
          background: #f0fdf4;
          box-shadow: 0 0 0 3px rgba(110,231,183,0.18);
        }
        .ag-search input {
          flex:1; background:none; border:none; outline:none;
          font-size:13px; color:#0f172a;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .ag-search input::placeholder { color:#94a3b8; }

        /* ── Message bubbles ── */
        .ag-bubble-own {
          background: linear-gradient(140deg, #15803d 0%, #22c55e 100%);
          color: #fff;
          border-radius: 20px 20px 5px 20px;
          padding: 11px 16px; max-width: 72%;
          box-shadow: 0 4px 18px rgba(21,128,61,0.22);
          animation: ag-msg-right 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .ag-bubble-other {
          background: #ffffff;
          color: #0f172a;
          border: 1.5px solid #e8f5e9;
          border-radius: 20px 20px 20px 5px;
          padding: 11px 16px; max-width: 72%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          animation: ag-msg-left 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
        }

        /* ── Composer area ── */
        .ag-composer {
          padding: 12px 16px 14px;
          background: #fff;
          border-top: 1.5px solid #e8f5e9;
          flex-shrink: 0;
        }
        .ag-textarea-wrap {
          flex:1; background:#f8fafc; border:1.5px solid #e2e8f0;
          border-radius:16px; padding:10px 14px;
          transition: all 0.22s ease;
        }
        .ag-textarea-wrap:focus-within {
          border-color: #6ee7b7;
          background: #f0fdf4;
          box-shadow: 0 0 0 3px rgba(110,231,183,0.15);
        }
        .ag-textarea-wrap textarea {
          width:100%; background:none; border:none; outline:none;
          resize:none; font-size:14px; color:#0f172a;
          font-family: 'DM Sans', system-ui, sans-serif; line-height:1.6;
        }
        .ag-textarea-wrap textarea::placeholder { color:#94a3b8; }

        /* ── Send button ── */
        .ag-send-btn {
          display:flex; align-items:center; justify-content:center; gap:7px;
          background: linear-gradient(140deg, #15803d 0%, #22c55e 100%);
          color:#fff; border:none; cursor:pointer; border-radius:16px;
          padding: 0 20px; height: 46px;
          font-size:14px; font-weight:700; font-family:'DM Sans',system-ui,sans-serif;
          transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 4px 16px rgba(21,128,61,0.28);
          white-space:nowrap; flex-shrink:0;
        }
        .ag-send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(21,128,61,0.38);
        }
        .ag-send-btn:active:not(:disabled) { transform: scale(0.96); }
        .ag-send-btn:disabled { opacity:0.55; cursor:not-allowed; }
        .ag-send-btn svg { transition: transform 0.2s; }
        .ag-send-btn:hover:not(:disabled) svg { transform: translateX(3px) rotate(-5deg); }

        /* ── Online dot ── */
        .ag-online-dot {
          width:9px; height:9px; border-radius:50%;
          background:#22c55e; position:relative; flex-shrink:0;
          box-shadow: 0 0 0 2px #fff;
        }
        .ag-online-dot::after {
          content:''; position:absolute; inset:-3px; border-radius:50%;
          background:rgba(34,197,94,0.4);
          animation: ag-pulse-ring 1.8s ease-out infinite;
        }

        /* ── Typing dot ── */
        .ag-dot {
          width:6px; height:6px; border-radius:50%;
          background:#86efac; display:inline-block;
          animation: ag-typing 1.1s ease-in-out infinite;
        }

        /* ── Unread badge ── */
        .ag-badge {
          display:inline-flex; align-items:center; justify-content:center;
          min-width:18px; height:18px; padding:0 5px;
          border-radius:100px; background:#f59e0b; color:#fff;
          font-size:10px; font-weight:800; line-height:1;
          font-family:'DM Sans',system-ui,sans-serif;
        }

        /* ── Skeleton ── */
        .ag-skeleton {
          background:linear-gradient(90deg,#f0fdf4 25%,#dcfce7 50%,#f0fdf4 75%);
          background-size:200% 100%;
          animation:ag-skeleton 1.3s ease-in-out infinite;
          border-radius:14px;
        }

        /* ── Shimmer text ── */
        .ag-shimmer {
          background:linear-gradient(90deg,#15803d,#22c55e,#4ade80,#22c55e,#15803d);
          background-size:200% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          animation:ag-shimmer 3.5s linear infinite;
        }

        /* ── Mobile menu btn ── */
        .ag-menu-btn {
          display:none; align-items:center; justify-content:center;
          width:36px; height:36px; border-radius:10px; border:none; cursor:pointer;
          background:#f0fdf4; color:#15803d;
          transition: background 0.2s;
        }
        .ag-menu-btn:hover { background:#dcfce7; }

        /* ── Mobile overlay ── */
        .ag-overlay {
          display:none; position:fixed; inset:0;
          background:rgba(15,23,42,0.4); z-index:50;
          animation:ag-fade 0.2s ease;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .ag-menu-btn { display:flex !important; }
          .ag-sidebar {
            position:fixed !important; top:0 !important; left:-100% !important;
            bottom:0 !important; width:85% !important; max-width:320px !important;
            z-index:60 !important; border-radius:0 20px 20px 0 !important;
            transition: left 0.3s cubic-bezier(0.22,1,0.36,1) !important;
          }
          .ag-sidebar.open { left:0 !important; }
          .ag-overlay.open { display:block; }
          .ag-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      <ProfileNav
        active="messages"
        links={[
          { key: 'messages', label: 'Messages',     to: '/chat'     },
          { key: 'orders',   label: 'My Orders',    to: '/orders'   },
          { key: 'products', label: 'All Products', to: '/products' },
        ]}
      />

      {/* ── Mobile sidebar overlay ── */}
      <div
        className={`ag-overlay${mobileSidebar ? ' open' : ''}`}
        onClick={() => setMobileSidebar(false)}
      />

      <div
        style={{
          fontFamily:"'DM Sans', system-ui, sans-serif",
          background:'linear-gradient(155deg,#f0fdf4 0%,#ffffff 45%,#f8fafc 100%)',
          /* KEY FIX: use viewport height so the whole layout is contained */
          height:'calc(100vh - 64px)', /* adjust 64px to match your ProfileNav height */
          display:'flex', flexDirection:'column',
          padding:'20px 16px',
          overflow:'hidden',
        }}
      >
        <div style={{ maxWidth:1320, margin:'0 auto', width:'100%', display:'flex', flexDirection:'column', flex:1, minHeight:0, gap:16 }}>

          {/* ── Page header ── */}
          <div
            className="ag-rise"
            style={{
              background:'#fff', border:'1.5px solid #e8f5e9', borderRadius:22,
              padding:'18px 24px', flexShrink:0,
              boxShadow:'0 2px 16px rgba(21,128,61,0.06)',
              position:'relative', overflow:'hidden',
            }}
          >
            {/* decorative blobs */}
            <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(187,247,208,0.3)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:-30, left:60, width:120, height:120, borderRadius:'50%', background:'rgba(220,252,231,0.25)', pointerEvents:'none' }} />

            <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                {/* Mobile hamburger */}
                <button className="ag-menu-btn" onClick={() => setMobileSidebar(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                </button>

                <div>
                  <p style={{ margin:0, fontSize:10, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'#16a34a', display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#16a34a"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                    AgriHub · Messaging
                  </p>
                  <h1
                    className="ag-shimmer"
                    style={{ fontFamily:"'Playfair Display', Georgia, serif", fontSize:'clamp(22px,3.5vw,32px)', fontWeight:900, lineHeight:1.1, margin:0 }}
                  >
                    Messages
                  </h1>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[
                  { icon:'👥', label:'Contacts', value: mergedUsers.length, color:'#15803d' },
                  { icon:'📬', label:'Unread',   value: totalUnread,        color: totalUnread > 0 ? '#d97706' : '#94a3b8' },
                ].map(s => (
                  <div key={s.label} style={{
                    background:'#f8fafc', border:'1.5px solid #e8f5e9', borderRadius:100,
                    padding:'5px 14px', display:'flex', alignItems:'center', gap:7,
                  }}>
                    <span style={{ fontSize:13 }}>{s.icon}</span>
                    <span style={{ fontSize:12, color:'#64748b', fontWeight:500 }}>{s.label}</span>
                    <span style={{ fontSize:13, color:s.color, fontWeight:800 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Main grid: sidebar + chat ── */}
          {/* KEY FIX: flex:1 + minHeight:0 lets children fill remaining space without overflow */}
          <div
            className="ag-grid ag-rise ag-d1"
            style={{
              display:'grid',
              gridTemplateColumns:'clamp(260px,28%,340px) 1fr',
              gap:14,
              flex:1, minHeight:0,  /* ← critical */
            }}
          >

            {/* ════════ SIDEBAR ════════ */}
            <aside
              className={`ag-sidebar${mobileSidebar ? ' open' : ''}`}
              style={{
                background:'#fff', border:'1.5px solid #e8f5e9', borderRadius:22,
                padding:14, display:'flex', flexDirection:'column', gap:12,
                boxShadow:'0 2px 16px rgba(21,128,61,0.06)',
                /* KEY: sidebar itself scrolls its contact list, not the page */
                minHeight:0, overflow:'hidden',
              }}
            >
              {/* Search */}
              <div className="ag-search" style={{ flexShrink:0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text" value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search contacts…"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:0, color:'#94a3b8', lineHeight:1, fontSize:14 }}
                  >✕</button>
                )}
              </div>

              {/* Label row */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                <p style={{ margin:0, fontSize:10, fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'#94a3b8' }}>
                  Conversations
                </p>
                <span style={{ fontSize:11, fontWeight:700, color:'#15803d', background:'#f0fdf4', border:'1px solid #a7f3d0', borderRadius:100, padding:'2px 9px' }}>
                  {mergedUsers.length}
                </span>
              </div>

              {/* Contact list — scrollable */}
              <div className="ag-scroll" style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:3 }}>
                {loadingSidebar ? (
                  [1,2,3,4].map(i => (
                    <div key={i} className="ag-skeleton" style={{ height:72, marginBottom:4, animationDelay:`${i*0.1}s` }} />
                  ))
                ) : mergedUsers.length === 0 ? (
                  <div style={{ padding:'24px 12px', textAlign:'center' }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>🌱</div>
                    <p style={{ margin:0, fontSize:13, color:'#94a3b8', fontWeight:500 }}>No contacts found</p>
                  </div>
                ) : (
                  mergedUsers.map((item, idx) => {
                    const isActive  = activeUser?._id === item._id;
                    const hasUnread = (item.unreadCount || 0) > 0;
                    return (
                      <button
                        key={item._id}
                        onClick={() => setActiveUser(item)}
                        className={`ag-contact ag-fade${isActive ? ' active' : hasUnread ? ' has-unread' : ''}`}
                        style={{ animationDelay:`${idx * 35}ms` }}
                      >
                        <div style={{ display:'flex', alignItems:'flex-start', gap:11 }}>
                          {/* Avatar + unread indicator */}
                          <div style={{ position:'relative', flexShrink:0 }}>
                            <Avatar user={item} size={42} />
                            {hasUnread && (
                              <span style={{
                                position:'absolute', top:-2, right:-2,
                                width:9, height:9, borderRadius:'50%',
                                background:'#f59e0b', border:'2px solid #fff',
                              }}/>
                            )}
                          </div>

                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
                              <p style={{
                                margin:0, fontSize:13, fontWeight: hasUnread ? 800 : 600,
                                color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                              }}>
                                {getDisplayName(item)}
                              </p>
                              {hasUnread && <span className="ag-badge">{item.unreadCount > 99 ? '99+' : item.unreadCount}</span>}
                            </div>

                            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                              <RolePill role={item.role} />
                            </div>

                            <p style={{
                              margin:'4px 0 0', fontSize:12, lineHeight:1.4,
                              color: hasUnread ? '#475569' : '#94a3b8',
                              fontWeight: hasUnread ? 600 : 400,
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                            }}>
                              {item.lastMessage?.content || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* ════════ CHAT PANEL ════════ */}
            {/* KEY FIX: display:flex + flexDirection:column + minHeight:0 + overflow:hidden */}
            <section style={{
              background:'#fff', border:'1.5px solid #e8f5e9', borderRadius:22,
              display:'flex', flexDirection:'column',
              overflow:'hidden',   /* ← prevents section from growing beyond grid cell */
              boxShadow:'0 2px 16px rgba(21,128,61,0.06)',
              minHeight:0,         /* ← allows shrinking */
            }}>

              {!activeUser ? (
                /* ── Empty state ── */
                <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, textAlign:'center' }}>
                  <div style={{
                    width:76, height:76, borderRadius:24, marginBottom:20,
                    background:'linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:'0 8px 28px rgba(16,185,129,0.18)',
                  }}>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                  </div>
                  <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:24, fontWeight:900, color:'#0f172a', margin:0 }}>
                    Start a conversation
                  </h2>
                  <p style={{ marginTop:8, fontSize:14, color:'#64748b', maxWidth:320, lineHeight:1.7 }}>
                    Choose a contact from the sidebar to connect with farmers, distributors, or transporters.
                  </p>
                  <div style={{ marginTop:20, display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
                    {['Farmer','Distributor','Transporter'].map(r => <RolePill key={r} role={r} />)}
                  </div>
                </div>

              ) : (
                <>
                  {/* ── Chat header (fixed at top of section) ── */}
                  <div style={{
                    padding:'14px 20px', flexShrink:0,
                    borderBottom:'1.5px solid #e8f5e9',
                    background:'linear-gradient(135deg,#f0fdf4 0%,#ffffff 100%)',
                    display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:13 }}>
                      {/* mobile back button */}
                      <button
                        className="ag-menu-btn"
                        onClick={() => setMobileSidebar(true)}
                        style={{ display:'none' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                      </button>

                      <div style={{ position:'relative' }}>
                        <Avatar user={activeUser} size={46} />
                        <span className="ag-online-dot" style={{ position:'absolute', bottom:1, right:1 }} />
                      </div>
                      <div>
                        <h2 style={{ margin:0, fontSize:15, fontWeight:800, color:'#0f172a' }}>
                          {getDisplayName(activeUser)}
                        </h2>
                        <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:3 }}>
                          <RolePill role={activeUser.role} />
                          <span style={{ fontSize:11, color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180 }}>
                            {activeUser.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background:'#f0fdf4', border:'1px solid #a7f3d0',
                      borderRadius:100, padding:'4px 13px',
                      fontSize:12, fontWeight:700, color:'#15803d', flexShrink:0,
                    }}>
                      {messages.length} msg{messages.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* ── Messages area (THIS scrolls, not the page) ── */}
                  <div
                    className="ag-scroll"
                    style={{
                      flex:1,
                      overflowY:'auto',   /* ← only this div scrolls */
                      padding:'18px 20px 10px',
                      display:'flex', flexDirection:'column', gap:10,
                      background:'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(236,253,245,0.6) 0%, #fff 70%)',
                    }}
                  >
                    {loadingConversation ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {[1,2,3].map(i => (
                          <div key={i} style={{ display:'flex', justifyContent: i%2===0 ? 'flex-end':'flex-start' }}>
                            <div className="ag-skeleton" style={{ height:50, width:`${38+i*14}%`, borderRadius:18, animationDelay:`${i*0.1}s` }} />
                          </div>
                        ))}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:10, color:'#94a3b8', fontSize:13 }}>
                          <TypingDots /> Loading messages…
                        </div>
                      </div>

                    ) : messages.length === 0 ? (
                      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, padding:30, textAlign:'center' }}>
                        <span style={{ fontSize:38 }}>👋</span>
                        <p style={{ margin:0, fontSize:14, color:'#94a3b8', fontWeight:500 }}>
                          No messages yet — say hello!
                        </p>
                      </div>

                    ) : (
                      messages.map((message, idx) => {
                        const isOwn = message.sender?._id === user?.id;
                        return (
                          <div
                            key={message._id}
                            style={{ display:'flex', flexDirection:'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}
                          >
                            <div
                              className={isOwn ? 'ag-bubble-own' : 'ag-bubble-other'}
                              style={{ animationDelay:`${Math.min(idx,10)*25}ms` }}
                            >
                              <p style={{ margin:0, fontSize:14, lineHeight:1.65, whiteSpace:'pre-wrap' }}>
                                {message.content}
                              </p>
                              <p style={{ margin:'5px 0 0', fontSize:11, opacity: isOwn ? 0.75 : 1, color: isOwn ? '#fff' : '#94a3b8' }}>
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {/* Scroll anchor — always at the bottom of this scrollable div */}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* ── Composer (pinned at bottom of section) ── */}
                  <div className="ag-composer">
                    <form onSubmit={handleSendMessage} style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
                      <div className="ag-textarea-wrap">
                        <textarea
                          ref={textareaRef}
                          value={messageDraft}
                          onChange={(e) => setMessageDraft(e.target.value)}
                          onKeyDown={handleKeyDown}
                          rows={2}
                          placeholder={`Message ${getDisplayName(activeUser)}…`}
                        />
                        <p style={{ margin:'3px 0 0', fontSize:11, color:'#cbd5e1', textAlign:'right' }}>
                          ⌘↵ to send
                        </p>
                      </div>

                      <button type="submit" disabled={sendingMessage} className="ag-send-btn">
                        {sendingMessage ? (
                          <TypingDots />
                        ) : (
                          <>
                            Send
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 2 11 13M22 2 15 22 11 13 2 9l20-7z"/>
                            </svg>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </section>

          </div>
        </div>
      </div>
    </>
  );
};

export default MessagesPage;