import React from 'react'
import { Link } from 'react-router-dom'

const TransporterPanel = ({ links = [] }) => {
  const defaultLinks = [
    { title: 'Profile', to: '/profile' },
    { title: 'Trips', to: '/trips' },
    { title: 'Vehicles', to: '/vehicles' },
    { title: 'Messages', to: '/chat' },
  ]

  const items = links.length ? links : defaultLinks

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
            <span>{item.title}</span>
            <span className="text-slate-400">→</span>
          </Link>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4 text-sm text-emerald-800">
        Add transporter-specific widgets (trips, vehicles, routes) here.
      </div>
    </div>
  )
}

export default TransporterPanel
