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
        });
      }
    });

    chatUsers.forEach((item) => {
      if (item?._id && !map.has(item._id)) {
        map.set(item._id, item);
      }
    });

    const allUsers = Array.from(map.values());
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

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
              <p className="text-slate-600">Direct chat between farmers, distributors, and transporters</p>
            </div>
            <Link
              to="/dashboard"
              className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Back to Dashboard
            </Link>
          </div>

          <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[340px_1fr]">
            <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users or conversations"
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {loadingSidebar ? (
                <p className="text-sm text-slate-500">Loading contacts...</p>
              ) : mergedUsers.length === 0 ? (
                <p className="text-sm text-slate-500">No chat contacts found for your role.</p>
              ) : (
                <div className="space-y-2 overflow-y-auto pr-1">
                  {mergedUsers.map((item) => {
                    const isActive = activeUser?._id === item._id;
                    return (
                      <button
                        key={item._id}
                        onClick={() => setActiveUser(item)}
                        className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                          isActive
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-900">{item.fullName}</p>
                        <p className="text-xs text-slate-500">{item.role} • {item.email}</p>
                        {item.lastMessage?.content ? (
                          <p className="mt-1 line-clamp-1 text-xs text-slate-600">{item.lastMessage.content}</p>
                        ) : (
                          <p className="mt-1 text-xs text-slate-400">No messages yet</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </aside>

            <section className="flex flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {!activeUser ? (
                <div className="flex flex-1 items-center justify-center p-8 text-slate-500">
                  Select a contact to start messaging.
                </div>
              ) : (
                <>
                  <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">{activeUser.fullName}</h2>
                    <p className="text-xs text-slate-500">{activeUser.role} • {activeUser.email}</p>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto p-5">
                    {loadingConversation ? (
                      <p className="text-sm text-slate-500">Loading conversation...</p>
                    ) : messages.length === 0 ? (
                      <p className="text-sm text-slate-500">No messages yet. Say hello.</p>
                    ) : (
                      messages.map((message) => {
                        const isOwnMessage = message.sender?._id === user?.id;
                        return (
                          <div
                            key={message._id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                isOwnMessage
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-900'
                              }`}
                            >
                              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                              <p
                                className={`mt-1 text-[11px] ${
                                  isOwnMessage ? 'text-emerald-100' : 'text-slate-500'
                                }`}
                              >
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-4">
                    <div className="flex gap-2">
                      <textarea
                        value={messageDraft}
                        onChange={(e) => setMessageDraft(e.target.value)}
                        rows={2}
                        placeholder={`Message ${activeUser.fullName}`}
                        className="w-full resize-none rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={sendingMessage}
                        className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
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
