// src/pages/Auth/components/TransporterPanel.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const TransporterPanel = ({ links = [], unreadMessages = 0 }) => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    averageRating: 4.8,
    totalReviews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [token]);

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/trips/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const defaultLinks = [
    { title: '👤 Profile', to: '/profile', icon: '👤' },
    { title: '🚛 My Vehicles', to: '/vehicles', icon: '🚛' },
    { title: '📋 My Trips', to: '/trips', icon: '📋' },
    { title: '📦 Available Orders', to: '/available-orders', icon: '📦' },
    { title: '⭐ My Ratings', to: `/transporter-ratings`, icon: '⭐' },
    { title: '💬 Messages', to: '/chat', icon: '💬' },
  ];

  const items = links.length ? links : defaultLinks;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105">
          <p className="text-xs font-semibold uppercase opacity-90">Total Trips</p>
          <p className="mt-2 text-3xl font-bold">{stats.totalTrips}</p>
          <p className="mt-1 text-xs opacity-75">All time deliveries</p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-4 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105">
          <p className="text-xs font-semibold uppercase opacity-90">Completed</p>
          <p className="mt-2 text-3xl font-bold">{stats.completedTrips}</p>
          <p className="mt-1 text-xs opacity-75">Success rate</p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105">
          <p className="text-xs font-semibold uppercase opacity-90">Rating</p>
          <p className="mt-2 text-3xl font-bold">{stats.averageRating?.toFixed(1) || '4.8'} ⭐</p>
          <p className="mt-1 text-xs opacity-75">{stats.totalReviews} reviews</p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-white shadow-lg hover:shadow-xl transition transform hover:scale-105">
          <p className="text-xs font-semibold uppercase opacity-90">Messages</p>
          <p className="mt-2 text-3xl font-bold">{unreadMessages}</p>
          <p className="mt-1 text-xs opacity-75">Unread chats</p>
        </div>
      </div>

      {/* Main Panel */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transporter Hub</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">Quick Access</p>
          </div>
          <span className="text-4xl">🚚</span>
        </div>

        {/* Quick Links Grid */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.title}
              to={item.to}
              className="group flex items-center justify-between rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-emerald-300 hover:from-emerald-50 hover:to-emerald-50 hover:shadow-md"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span>{item.title.split(' ').slice(1).join(' ')}</span>
                {item.to === '/chat' && unreadMessages > 0 && (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white ml-auto">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </span>
              <span className="text-slate-300 group-hover:text-emerald-500 transition">→</span>
            </Link>
          ))}
        </div>

        {/* Info Box */}
        <div className="mb-4 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">💡 Pro Tip</p>
          <p className="mt-1 text-xs text-emerald-700">
            Complete more deliveries on time to boost your rating. Higher ratings mean more orders and better earning potential!
          </p>
        </div>

        {/* Rating & Review CTA */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to="/transporter-ratings"
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-100 to-amber-50 py-3 text-sm font-semibold text-amber-700 border border-amber-200 hover:from-amber-50 hover:to-amber-100 transition"
          >
            ⭐ View Ratings & Reviews
          </Link>
          <Link
            to="/available-orders"
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-semibold text-white hover:from-emerald-600 hover:to-emerald-700 transition shadow-md"
          >
            📦 Find New Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TransporterPanel;