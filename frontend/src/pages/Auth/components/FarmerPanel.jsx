// src/pages/Auth/components/FarmerPanel.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const FarmerPanel = ({ links = [] }) => {
  const { user } = useAuth();
  
  const defaultLinks = [
    { title: '👤 Profile', to: '/profile' },
    { title: '🌾 My Products', to: '/my-products' },
    { title: '➕ Add Product', to: '/products/add' },
    { title: '📦 Orders', to: '/orders' },
    { title: '⭐ My Ratings', to: `/reviews/Farmer/${user?.id}` },
    { title: '💬 Messages', to: '/chat' },
    { title: '📊 Market Prices', to: '/prices' },
  ];

  const items = links.length ? links : defaultLinks;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Farmer</p>
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
            <span>{item.title}</span>
            <span className="text-slate-400">→</span>
          </Link>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4 text-sm text-emerald-800">
        🌾 Click on the map when adding products to set your pickup location accurately!
      </div>
    </div>
  );
};

export default FarmerPanel;