// src/pages/Auth/components/TransporterPanel.jsx
import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { fetchTripStats, fetchReviewStats } from '../../../api/trips'

const clampPct = (n) => Math.min(100, Math.max(0, Number(n) || 0))

const TransporterPanel = ({ links = [], unreadMessages = 0 }) => {
  const { token } = useAuth()
  const [tripStats, setTripStats] = useState(null)
  const [reviewStats, setReviewStats] = useState(null)
  const [loadingInsights, setLoadingInsights] = useState(true)

  const loadDashboardData = useCallback(async () => {
    if (!token) return
    setLoadingInsights(true)
    try {
      const [tripsRes, reviewsRes] = await Promise.allSettled([
        fetchTripStats(token),
        fetchReviewStats(token),
      ])
      if (tripsRes.status === 'fulfilled' && tripsRes.value?.stats) {
        setTripStats(tripsRes.value.stats)
      } else {
        setTripStats(null)
      }
      if (reviewsRes.status === 'fulfilled' && reviewsRes.value?.stats) {
        setReviewStats(reviewsRes.value.stats)
      } else {
        setReviewStats(null)
      }
    } catch {
      setTripStats(null)
      setReviewStats(null)
    } finally {
      setLoadingInsights(false)
    }
  }, [token])

  useEffect(() => {
    void loadDashboardData()
  }, [loadDashboardData])

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

  const activeTrips = tripStats?.activeTrips ?? 0
  const completedTrips = tripStats?.completedTrips ?? 0
  const totalTrips = tripStats?.totalTrips ?? 0
  const cancelledTrips = tripStats?.cancelledTrips ?? 0
  const completionRate = clampPct(tripStats?.completionRate)
  const onTimeRate =
    tripStats?.onTimeDeliveryRate != null
      ? clampPct(tripStats.onTimeDeliveryRate)
      : null
  const onTimeN = tripStats?.onTimeSampleSize ?? 0
  const revenue = Number(tripStats?.revenueCompleted) || 0
  const avgRating = Number(reviewStats?.averageRating) || 0
  const totalReviews = Number(reviewStats?.totalReviews) || 0
  const ratingBarPct = clampPct((avgRating / 5) * 100)
  const timeliness = Number(reviewStats?.timeliness) || 0

  const headerStats = [
    { label: 'Active trips', value: loadingInsights ? '…' : String(activeTrips) },
    { label: 'Completed', value: loadingInsights ? '…' : String(completedTrips) },
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

  const MetricBar = ({ label, valuePct, sublabel, accentClass = 'bg-blue-500' }) => (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-bold text-slate-900">
          {valuePct != null ? `${Number(valuePct).toFixed(0)}%` : '—'}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-700 ${accentClass}`}
          style={{ width: `${valuePct != null ? clampPct(valuePct) : 0}%` }}
        />
      </div>
      {sublabel ? <p className="mt-1.5 text-xs text-slate-500">{sublabel}</p> : null}
    </div>
  )

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
              {headerStats.map((stat) => (
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
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
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

        {/* Insights — live trip + review data */}
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50/80 to-blue-50/60 p-6 shadow-sm ring-1 ring-slate-100">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-400/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
            Insights
          </p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            Transporter performance
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Live metrics from your trips and distributor reviews.
          </p>

          {loadingInsights ? (
            <div className="mt-6 space-y-4 animate-pulse">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-slate-200/80" />
                ))}
              </div>
              <div className="h-16 rounded-2xl bg-slate-200/80" />
              <div className="h-16 rounded-2xl bg-slate-200/80" />
              <div className="h-16 rounded-2xl bg-slate-200/80" />
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total trips</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{totalTrips}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Active</p>
                  <p className="mt-1 text-2xl font-black text-blue-600">{activeTrips}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Completed</p>
                  <p className="mt-1 text-2xl font-black text-emerald-600">{completedTrips}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cancelled</p>
                  <p className="mt-1 text-2xl font-black text-slate-700">{cancelledTrips}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revenue (completed trips)</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  LKR {revenue.toLocaleString()}
                </p>
              </div>

              <div className="mt-5 space-y-5 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-sm">
                <MetricBar
                  label="Trip completion rate"
                  valuePct={totalTrips > 0 ? completionRate : 0}
                  sublabel={
                    totalTrips > 0
                      ? `${completedTrips} of ${totalTrips} trips finished successfully`
                      : 'Complete your first trip to see this metric'
                  }
                  accentClass="bg-gradient-to-r from-blue-500 to-blue-600"
                />
                <MetricBar
                  label="On-time delivery"
                  valuePct={onTimeRate}
                  sublabel={
                    onTimeN > 0
                      ? `Among ${onTimeN} completed trip${onTimeN === 1 ? '' : 's'} with scheduled vs actual delivery times`
                      : 'Needs completed trips with both estimated and actual delivery times'
                  }
                  accentClass="bg-gradient-to-r from-emerald-500 to-teal-600"
                />
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-600">Customer rating</span>
                    <span className="font-bold text-slate-900">
                      {totalReviews > 0
                        ? `${avgRating.toFixed(1)} / 5`
                        : 'No reviews yet'}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                      style={{ width: `${totalReviews > 0 ? ratingBarPct : 0}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {totalReviews > 0
                      ? `${totalReviews} review${totalReviews === 1 ? '' : 's'} · Timeliness score ${timeliness.toFixed(1)}/5`
                      : 'Distributor reviews appear here after deliveries'}
                  </p>
                </div>
              </div>

              <Link
                to="/transporter-ratings"
                className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-300 bg-blue-50/90 px-4 py-3 text-center text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
              >
                <span>⭐</span> View full ratings and reviews
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TransporterPanel
