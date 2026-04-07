import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getRoleBadge = (role) => {
  if (role === 'Farmer') {
    return 'bg-green-100 text-green-700';
  }
  if (role === 'Distributor') {
    return 'bg-amber-100 text-amber-700';
  }
  if (role === 'Transporter') {
    return 'bg-sky-100 text-sky-700';
  }
  return 'bg-slate-100 text-slate-700';
};

const MessagesPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [chatUsers, setChatUsers] = useState([]);
  const [conversationList, setConversationList] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);

  const [messageDraft, setMessageDraft] = useState('');
  const [search, setSearch] = useState('');

  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (!CHAT_ROLES.includes(user?.role)) {
      toast.error('Messaging is only available for Farmer, Distributor, and Transporter accounts');
      navigate('/dashboard');
      return;
    }

    void loadSidebarData();
  }, [token, user?.role]);

  useEffect(() => {
    if (!token || !user?.id || !CHAT_ROLES.includes(user?.role)) return;

    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socket.emit('join', user.id);

    const onReceive = (message) => {
      const senderId = message?.sender?._id;
      const receiverId = message?.receiver?._id;
      const activeId = activeUser?._id;

      if (activeId && (senderId === activeId || receiverId === activeId)) {
        setMessages((prev) => {
          const exists = prev.some((item) => item._id === message._id);
          return exists ? prev : [...prev, message];
        });
      }

      void loadSidebarData({ silent: true });
    };

    socket.on('receive_message', onReceive);

    return () => {
      socket.off('receive_message', onReceive);
      socket.disconnect();
    };
  }, [token, user?.id, user?.role, activeUser?._id]);

  useEffect(() => {
    if (!token || !activeUser?._id) return;
    void loadConversation(activeUser);
  }, [activeUser?._id, token]);

  useEffect(() => {
    if (!token) return;

    const intervalId = setInterval(() => {
      void loadSidebarData({ silent: true });
      if (activeUser?._id) {
        void loadConversation(activeUser, { silent: true });
      }
    }, 8000);

    return () => clearInterval(intervalId);
  }, [token, activeUser?._id]);

  const loadSidebarData = async ({ silent = false } = {}) => {
    if (!silent) setLoadingSidebar(true);
    try {
      const [usersRes, listRes] = await Promise.all([
        fetchChatUsers(token),
        fetchConversationList(token),
      ]);

      const users = usersRes?.data || [];
      const conversations = listRes?.data || [];

      setChatUsers(users);
      setConversationList(conversations);

      if (!activeUser && conversations.length > 0) {
        setActiveUser(conversations[0].user);
      }
    } catch (error) {
      if (!silent) {
        toast.error(error.message || 'Failed to load messaging data');
      }
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

      if (!silent) {
        void loadSidebarData({ silent: true });
      }
    } catch (error) {
      if (!silent) {
        toast.error(error.message || 'Failed to load conversation');
      }
    } finally {
      if (!silent) setLoadingConversation(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const content = messageDraft.trim();
    if (!activeUser?._id) {
      toast.error('Select a user to chat with');
      return;
    }

    if (!content) {
      toast.error('Message cannot be empty');
      return;
    }

    setSendingMessage(true);
    try {
      const res = await sendChatMessage(token, {
        receiverId: activeUser._id,
        content,
      });

      const newMessage = res?.data;
      if (newMessage) {
        setMessages((prev) => [...prev, newMessage]);
      }

      setMessageDraft('');
      await loadSidebarData({ silent: true });
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const mergedUsers = useMemo(() => {
    const map = new Map();

    conversationList.forEach((item) => {
      if (item?.user?._id) {
        map.set(item.user._id, {
          ...item.user,
          lastMessage: item.lastMessage,
          unreadCount: item.unreadCount || 0,
        });
      }
    });

    chatUsers.forEach((item) => {
      if (item?._id && !map.has(item._id)) {
        map.set(item._id, {
          ...item,
          unreadCount: 0,
        });
      }
    });

    const allUsers = Array.from(map.values()).sort((a, b) => {
      const unreadDiff = (b.unreadCount || 0) - (a.unreadCount || 0);
      if (unreadDiff !== 0) return unreadDiff;

      const aTime = new Date(a.lastMessage?.createdAt || 0).getTime();
      const bTime = new Date(b.lastMessage?.createdAt || 0).getTime();
      return bTime - aTime;
    });

    const term = search.trim().toLowerCase();

    if (!term) return allUsers;

    return allUsers.filter((item) => {
      const name = item.fullName?.toLowerCase() || '';
      const role = item.role?.toLowerCase() || '';
      const email = item.email?.toLowerCase() || '';
      return name.includes(term) || role.includes(term) || email.includes(term);
    });
  }, [conversationList, chatUsers, search]);

  const noRoleAccess = token && user?.role && !CHAT_ROLES.includes(user.role);
  if (noRoleAccess) return null;

  return (
    <>
      <ProfileNav
        active="messages"
        links={[
          { key: 'messages', label: 'Messages', to: '/chat' },
          { key: 'orders', label: 'My Orders', to: '/orders' },
          { key: 'products', label: 'All Products', to: '/products' },
        ]}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Top header */}
          <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                Messaging Hub
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                Messages
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Direct communication between farmers, distributors, and transporters.
              </p>
            </div>

            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              Back to Dashboard
            </Link>
          </div>

          {/* Main chat layout */}
          <div className="grid min-h-[72vh] gap-5 lg:grid-cols-[360px_1fr]">
            {/* Sidebar */}
            <aside className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users, roles, or email"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                    Conversations
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {mergedUsers.length} contact{mergedUsers.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              {loadingSidebar ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  Loading contacts...
                </div>
              ) : mergedUsers.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No chat contacts found for your role.
                </div>
              ) : (
                <div className="max-h-[68vh] space-y-3 overflow-y-auto pr-1">
                  {mergedUsers.map((item) => {
                    const isActive = activeUser?._id === item._id;
                    const hasUnread = (item.unreadCount || 0) > 0;

                    return (
                      <button
                        key={item._id}
                        onClick={() => setActiveUser(item)}
                        className={`w-full rounded-2xl border p-4 text-left transition-all duration-300 ${
                          isActive
                            ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                            : hasUnread
                              ? 'border-amber-200 bg-amber-50/60 hover:-translate-y-0.5 hover:shadow-sm'
                              : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                            {(item.fullName?.[0] || 'U').toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`truncate text-sm ${
                                  hasUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-900'
                                }`}
                              >
                                {item.fullName}
                              </p>

                              {hasUnread && (
                                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
                                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getRoleBadge(item.role)}`}>
                                {item.role}
                              </span>
                              <span className="truncate text-[11px] text-slate-500">
                                {item.email}
                              </span>
                            </div>

                            {item.lastMessage?.content ? (
                              <p
                                className={`mt-2 line-clamp-1 text-xs ${
                                  hasUnread ? 'font-semibold text-slate-800' : 'text-slate-500'
                                }`}
                              >
                                {item.lastMessage.content}
                              </p>
                            ) : (
                              <p className="mt-2 text-xs text-slate-400">
                                No messages yet
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </aside>

            {/* Chat section */}
            <section className="flex min-h-[72vh] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              {!activeUser ? (
                <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl">
                    💬
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-slate-900">
                    Select a conversation
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Choose a contact from the left sidebar to start chatting with farmers,
                    distributors, or transporters.
                  </p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                        {(activeUser.fullName?.[0] || 'U').toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-slate-900">
                          {activeUser.fullName}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getRoleBadge(activeUser.role)}`}>
                            {activeUser.role}
                          </span>
                          <span className="truncate text-xs text-slate-500">
                            {activeUser.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/60 to-white p-5">
                    {loadingConversation ? (
                      <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                        Loading conversation...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
                        No messages yet. Say hello.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isOwnMessage = message.sender?._id === user?.id;

                          return (
                            <div
                              key={message._id}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[78%] rounded-[22px] px-4 py-3 shadow-sm transition-all duration-300 ${
                                  isOwnMessage
                                    ? 'bg-emerald-600 text-white'
                                    : 'border border-slate-200 bg-white text-slate-900'
                                }`}
                              >
                                <p className="whitespace-pre-wrap text-sm leading-6">
                                  {message.content}
                                </p>
                                <p
                                  className={`mt-2 text-[11px] ${
                                    isOwnMessage ? 'text-emerald-100' : 'text-slate-500'
                                  }`}
                                >
                                  {formatTime(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Composer */}
                  <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-emerald-400">
                        <textarea
                          value={messageDraft}
                          onChange={(e) => setMessageDraft(e.target.value)}
                          rows={2}
                          placeholder={`Message ${activeUser.fullName}`}
                          className="w-full resize-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={sendingMessage}
                        className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {sendingMessage ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </form>
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