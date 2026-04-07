// src/pages/Auth/components/TransporterPanel.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const TransporterPanel = ({ links = [], unreadMessages = 0 }) => {
  const { user } = useAuth();
  
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
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Transporter</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">Your shortcuts</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-emerald-200 hover:bg-white"
          >
            <span className="flex items-center gap-2">
              <span>{item.title}</span>
              {item.to === '/chat' && unreadMessages > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </span>
            <span className="text-slate-400">→</span>
          </Link>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-4 text-sm text-blue-800">
        🚚 Complete deliveries to receive ratings from distributors. Your ratings affect your reputation!
      </div>
      <Link
        to="/transporter-ratings"
        className="mt-4 block rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 p-4 text-center text-sm font-semibold text-blue-700 transition hover:from-blue-100 hover:to-blue-200"
      >
        ⭐ View your ratings and respond to reviews
      </Link>
    </div>
  );
};

export default TransporterPanel;