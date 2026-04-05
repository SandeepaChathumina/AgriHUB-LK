// src/pages/Auth/components/DistributorPanel.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const DistributorPanel = ({ links = [] }) => {
  const { user } = useAuth();
  
  const defaultLinks = [
    { title: '👤 Profile', to: '/profile' },
    { title: '🛒 Browse Products', to: '/products' },
    { title: '📦 My Orders', to: '/orders' },
    { title: '⭐ Pending Reviews', to: '/pending-reviews', highlight: true },
    { title: '📊 My Ratings', to: `/reviews/Distributor/${user?.id}` },
    { title: '💬 Messages', to: '/chat' },
  ];

  const items = links.length ? links : defaultLinks;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Distributor</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">Your shortcuts</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition ${
              item.highlight 
                ? 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100' 
                : 'border-slate-100 bg-slate-50 text-slate-800 hover:border-emerald-200 hover:bg-white'
            }`}
          >
            <span>{item.title}</span>
            <span className="text-slate-400">→</span>
          </Link>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-gradient-to-r from-amber-50 to-emerald-50 p-4 text-sm text-amber-800 border border-amber-100">
        <p className="font-semibold mb-2">⭐ How to Rate:</p>
        <ol className="text-xs space-y-1 list-decimal list-inside">
          <li>Place an order and complete payment</li>
          <li>Wait for delivery to be completed (status: Delivered)</li>
          <li>Go to <strong>"Pending Reviews"</strong> to rate Farmers and Transporters</li>
          <li>Your feedback helps build trust in the community!</li>
        </ol>
      </div>
    </div>
  );
};

export default DistributorPanel;