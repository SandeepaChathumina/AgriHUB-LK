// src/pages/Auth/components/TransporterPanel.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'

const TransporterPanel = ({ links = [], unreadMessages = 0 }) => {
  const { user } = useAuth()
  
  const defaultLinks = [
    {
      title: '👤 Profile',
      to: '/profile',
      subtitle: 'Manage account details',
      icon: '👤',
    },
    {
      title: '🚛 My Vehicles',
      to: '/vehicles',
      subtitle: 'Manage your fleet',
      icon: '🚛',
    },
    {
      title: '📋 My Trips',
      to: '/trips',
      subtitle: 'Track active deliveries',
      icon: '📋',
    },
    {
      title: '📦 Available Orders',
      to: '/available-orders',
      subtitle: 'Find new delivery requests',
      icon: '📦',
    },
    {
      title: '⭐ My Ratings',
      to: '/transporter-ratings',
      subtitle: 'View your performance',
      icon: '⭐',
    },
    {
      title: '💬 Messages',
      to: '/chat',
      subtitle: 'Connect with partners',
      icon: '💬',
    },
  ]

  const items = links.length ? links : defaultLinks

  const stats = [
    { label: 'Active Trips', value: '0' },
    { label: 'Completed Orders', value: '0' },
    { label: 'Messages', value: String(unreadMessages) },
  ]

  const workflow = [
    {
      step: '01',
      title: 'Browse Orders',
      description: 'Check available delivery requests from distributors.',
    },
    {
      step: '02',
      title: 'Request Delivery',
      description: 'Submit delivery request with vehicle and pricing details.',
    },
    {
      step: '03',
      title: 'Await Approval',
      description: 'Distributor reviews and accepts your delivery request.',
    },
    {
      step: '04',
      title: 'Complete Delivery',
      description: 'Start trip, transport goods, and mark delivery as completed.',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top card */}
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-500">
          Transporter Dashboard
        </p>

        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black leading-tight text-slate-900 md:text-4xl">
              Manage your delivery operations
              <span className="block text-blue-500">more efficiently</span>
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              Access your trips, vehicles, orders, and communication tools from one clean
              and modern dashboard.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2"
                >
                  <span className="text-xs text-slate-500">{stat.label}</span>
                  <span className="ml-2 text-sm font-bold text-slate-900">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/available-orders"
            className="rounded-2xl bg-blue-500 px-6 py-3 text-sm font-bold text-white transition duration-300 hover:-translate-y-1 hover:bg-blue-600"
          >
            Find Orders
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Quick Actions
          </p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            Your main shortcuts
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.title}
              to={item.to}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                    {item.icon}
                  </div>

                  <h4 className="mt-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                    <span>{item.title}</span>
                    {item.to === '/chat' && unreadMessages > 0 && (
                      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
                        {unreadMessages > 99 ? '99+' : unreadMessages}
                      </span>
                    )}
                  </h4>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.subtitle}
                  </p>
                </div>

                <span className="text-slate-400 transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Workflow */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Workflow
          </p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            Delivery process
          </h3>

          <div className="mt-6 space-y-4">
            {workflow.map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
                  {item.step}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-500">
            Insights
          </p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            Transporter performance
          </h3>

          <p className="mt-3 text-sm text-slate-600">
            Overview of your operational performance and system activity.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-600">Trip Completion</span>
                <span className="font-bold text-blue-600">85%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-full w-[85%] rounded-full bg-blue-500 transition-all duration-700" />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-600">On-Time Delivery</span>
                <span className="font-bold text-blue-600">92%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-full w-[92%] rounded-full bg-blue-500 transition-all duration-700" />
              </div>
            </div>

            <Link
              to="/transporter-ratings"
              className="mt-4 block rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-4 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              ⭐ View your ratings and customer reviews
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransporterPanel