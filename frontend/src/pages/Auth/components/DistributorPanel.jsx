// src/pages/Auth/components/DistributorPanel.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'

const DistributorPanel = ({ links = [], unreadMessages = 0 }) => {
  const { user } = useAuth()
  
  const defaultLinks = [
    {
      title: '👤 Profile',
      to: '/profile',
      subtitle: 'Manage business details',
      icon: '👤',
    },
    {
      title: '📦 My Orders',
      to: '/orders',
      subtitle: 'Track and manage orders',
      icon: '🧾',
    },
    {
      title: '⭐ Pending Reviews',
      to: '/pending-reviews',
      subtitle: 'Rate farmers and transporters',
      icon: '⭐',
    },
    {
      title: '⭐ My Ratings',
      to: `/reviews/Distributor/${user?.id}`,
      subtitle: 'See your ratings from partners',
      icon: '📊',
    },
    {
      title: '🛒 All Products',
      to: '/products',
      subtitle: 'Browse and order products',
      icon: '🌾',
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
    { label: 'Active Orders', value: '0' },
    { label: 'Pending Reviews', value: '0' },
    { label: 'Messages', value: String(unreadMessages) },
  ]

  const workflow = [
    {
      step: '01',
      title: 'Browse Products',
      description: 'Find fresh agricultural products from local farmers.',
    },
    {
      step: '02',
      title: 'Place Order',
      description: 'Select quantity and confirm delivery location.',
    },
    {
      step: '03',
      title: 'Request Transport',
      description: 'Find a transporter to deliver your order.',
    },
    {
      step: '04',
      title: 'Rate Service',
      description: 'Review farmers and transporters after delivery.',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top card */}
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-green-500">
          Distributor Dashboard
        </p>

        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black leading-tight text-slate-900 md:text-4xl">
              Manage your distribution
              <span className="block text-green-500">more efficiently</span>
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
              Access your orders, reviews, and communication tools from one clean
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
            to="/products"
            className="rounded-2xl bg-green-500 px-6 py-3 text-sm font-bold text-white transition duration-300 hover:-translate-y-1 hover:bg-green-600"
          >
            Browse Products
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
            Distribution process
          </h3>

          <div className="mt-6 space-y-4">
            {workflow.map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 font-bold text-green-700">
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
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-green-500">
            Insights
          </p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            Distributor performance
          </h3>

          <p className="mt-3 text-sm text-slate-600">
            Overview of your operational performance and system activity.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-600">Order Progress</span>
                <span className="font-bold text-green-600">78%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-full w-[78%] rounded-full bg-green-500 transition-all duration-700" />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-600">Reviews Completed</span>
                <span className="font-bold text-green-600">0%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-full w-[0%] rounded-full bg-green-500 transition-all duration-700" />
              </div>
            </div>

            <Link
              to="/pending-reviews"
              className="mt-4 block rounded-2xl border border-dashed border-green-300 bg-green-50 p-4 text-center text-sm font-semibold text-green-700 transition hover:bg-green-100"
            >
              ✍️ Write pending reviews for completed orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DistributorPanel