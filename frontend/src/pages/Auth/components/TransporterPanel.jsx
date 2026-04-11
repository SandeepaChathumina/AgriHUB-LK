// src/pages/Auth/components/TransporterPanel.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { fetchTripStats, fetchReviewStats } from '../../../api/trips'

const clampPct = (n) => Math.min(100, Math.max(0, Number(n) || 0))

/* ─── tiny hook: fires once when element enters viewport ─── */
function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

/* ─── animated counter ─── */
function Counter({ target, duration = 900 }) {
  const [count, setCount] = useState(0)
  const [ref, visible] = useReveal()
  useEffect(() => {
    if (!visible) return
    const n = parseInt(target, 10) || 0
    if (n === 0) { setCount(0); return }
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setCount(Math.floor(progress * n))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [visible, target, duration])
  return <span ref={ref}>{count}</span>
}

const TransporterPanel = ({ links = [], unreadMessages = 0 }) => {
  const { token } = useAuth()
  const [tripStats, setTripStats] = useState(null)
  const [reviewStats, setReviewStats] = useState(null)
  const [loadingInsights, setLoadingInsights] = useState(true)

  /* ── inject Google Fonts into <head> reliably ── */
  useEffect(() => {
    const id = 'tp-google-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id   = id
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [])

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
    { title: 'Profile',           to: '/profile',             subtitle: 'Manage account details',        icon: ProfileIcon   },
    { title: 'My Vehicles',       to: '/vehicles',            subtitle: 'Manage your fleet',             icon: VehicleIcon   },
    { title: 'My Trips',          to: '/trips',               subtitle: 'Track active deliveries',       icon: TripIcon      },
    { title: 'Available Orders',  to: '/available-orders',    subtitle: 'Find new delivery requests',    icon: OrderIcon     },
    { title: 'My Ratings',        to: '/transporter-ratings', subtitle: 'View your performance',         icon: StarIcon      },
    { title: 'Messages',          to: '/chat',                subtitle: 'Connect with partners',         icon: ChatIcon      },
  ]

  const items = links.length ? links : defaultLinks

  const activeTrips     = tripStats?.activeTrips ?? 0
  const completedTrips  = tripStats?.completedTrips ?? 0
  const totalTrips      = tripStats?.totalTrips ?? 0
  const cancelledTrips  = tripStats?.cancelledTrips ?? 0
  const completionRate  = clampPct(tripStats?.completionRate)
  const onTimeRate      = tripStats?.onTimeDeliveryRate != null ? clampPct(tripStats.onTimeDeliveryRate) : null
  const onTimeN         = tripStats?.onTimeSampleSize ?? 0
  const revenue         = Number(tripStats?.revenueCompleted) || 0
  const avgRating       = Number(reviewStats?.averageRating) || 0
  const totalReviews    = Number(reviewStats?.totalReviews) || 0
  const ratingBarPct    = clampPct((avgRating / 5) * 100)
  const timeliness      = Number(reviewStats?.timeliness) || 0

  const headerStats = [
    { label: 'Active Trips',  value: loadingInsights ? '…' : String(activeTrips),   color: '#2563eb' },
    { label: 'Completed',     value: loadingInsights ? '…' : String(completedTrips), color: '#1d4ed8' },
    { label: 'Messages',      value: String(unreadMessages),                          color: '#1e40af' },
  ]

  const workflow = [
    { step: '01', title: 'Browse Orders',     description: 'Check available delivery requests from distributors.' },
    { step: '02', title: 'Request Delivery',  description: 'Submit delivery request with vehicle and pricing details.' },
    { step: '03', title: 'Await Approval',    description: 'Distributor reviews and accepts your delivery request.' },
    { step: '04', title: 'Complete Delivery', description: 'Start trip, transport goods, and mark delivery as completed.' },
  ]

  const [heroRef, heroVisible]       = useReveal()
  const [actionsRef, actionsVisible] = useReveal()
  const [bottomRef, bottomVisible]   = useReveal()

  return (
    <>
      <style>{`
        .tp-root { font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif; }
        .tp-display { font-family: 'Fraunces', Georgia, serif; }

        /* ── entry animations ── */
        @keyframes tp-rise {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes tp-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes tp-scale {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1);    }
        }
        @keyframes tp-bar {
          from { width: 0; }
        }
        @keyframes tp-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0;   }
        }

        .tp-rise  { animation: tp-rise  0.65s cubic-bezier(0.22,1,0.36,1) both; }
        .tp-fade  { animation: tp-fade  0.5s ease both; }
        .tp-scale { animation: tp-scale 0.55s cubic-bezier(0.22,1,0.36,1) both; }

        /* stagger helpers */
        .tp-d0 { animation-delay: 0ms;   }
        .tp-d1 { animation-delay: 80ms;  }
        .tp-d2 { animation-delay: 160ms; }
        .tp-d3 { animation-delay: 240ms; }
        .tp-d4 { animation-delay: 320ms; }
        .tp-d5 { animation-delay: 400ms; }
        .tp-d6 { animation-delay: 480ms; }

        /* ── hero card ── */
        .tp-hero {
          position: relative;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 36px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(37,99,235,0.04);
        }
        .tp-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 100% 0%, rgba(191,219,254,0.45) 0%, transparent 65%),
            radial-gradient(ellipse 40% 40% at 0% 100%, rgba(219,234,254,0.3) 0%, transparent 60%);
          pointer-events: none;
        }

        /* decorative circles */
        .tp-circle {
          position: absolute;
          top: -40px; right: -40px;
          width: 220px; height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(147,197,253,0.25) 0%, transparent 70%);
          pointer-events: none;
        }
        .tp-circle-2 {
          position: absolute;
          bottom: -60px; left: 30px;
          width: 160px; height: 160px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(191,219,254,0.2) 0%, transparent 70%);
          pointer-events: none;
        }

        /* ── stat pill ── */
        .tp-stat {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 100px;
          font-size: 13px;
          color: #1e3a8a;
          font-weight: 600;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .tp-stat:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37,99,235,0.14);
        }
        .tp-stat-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #2563eb;
          position: relative;
        }
        .tp-stat-dot::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: rgba(37,99,235,0.3);
          animation: tp-pulse-ring 1.6s ease-out infinite;
        }

        /* ── CTA button ── */
        .tp-browse-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #2563eb;
          color: #fff;
          font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif;
          font-weight: 700;
          font-size: 14px;
          border-radius: 16px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.25s, transform 0.25s, box-shadow 0.25s;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(37,99,235,0.25);
        }
        .tp-browse-btn:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(37,99,235,0.35);
        }
        .tp-browse-btn svg { transition: transform 0.25s; }
        .tp-browse-btn:hover svg { transform: translateX(3px); }

        /* ── section label ── */
        .tp-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #2563eb;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .tp-label::before {
          content: '';
          display: inline-block;
          width: 20px; height: 2px;
          background: #2563eb;
          border-radius: 2px;
        }

        /* ── action card ── */
        .tp-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 22px;
          text-decoration: none;
          display: block;
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .tp-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(239,246,255,0.7) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .tp-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 48px rgba(37,99,235,0.12), 0 4px 16px rgba(0,0,0,0.06);
          border-color: #bfdbfe;
        }
        .tp-card:hover::after { opacity: 1; }

        .tp-card-icon {
          width: 48px; height: 48px;
          border-radius: 16px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
          transition: background 0.3s, transform 0.3s;
        }
        .tp-card:hover .tp-card-icon {
          background: #dbeafe;
          transform: scale(1.1) rotate(-4deg);
        }

        .tp-card-arrow {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 14px;
          transition: background 0.3s, color 0.3s, transform 0.3s, border-color 0.3s;
          flex-shrink: 0;
        }
        .tp-card:hover .tp-card-arrow {
          background: #2563eb;
          color: #fff;
          border-color: #2563eb;
          transform: translateX(3px);
        }

        .tp-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 100px;
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          line-height: 1;
        }

        /* ── panel (workflow / insights) ── */
        .tp-panel {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }

        /* ── workflow step ── */
        .tp-workflow-step {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          border-radius: 18px;
          background: #fafafa;
          border: 1px solid #f1f5f9;
          transition: background 0.25s, border-color 0.25s, transform 0.25s;
          cursor: default;
        }
        .tp-workflow-step:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
          transform: translateX(4px);
        }
        .tp-step-num {
          width: 44px; height: 44px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          color: #fff;
          font-family: 'Fraunces', Georgia, serif;
          font-size: 13px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(37,99,235,0.3);
        }

        /* ── progress bar ── */
        .tp-progress-track {
          height: 8px;
          border-radius: 100px;
          background: #f1f5f9;
          overflow: hidden;
        }
        .tp-progress-fill-blue {
          height: 100%;
          border-radius: 100px;
          background: linear-gradient(90deg, #2563eb, #60a5fa);
          animation: tp-bar 1.2s cubic-bezier(0.22,1,0.36,1) both 0.3s;
        }
        .tp-progress-fill-emerald {
          height: 100%;
          border-radius: 100px;
          background: linear-gradient(90deg, #10b981, #34d399);
          animation: tp-bar 1.2s cubic-bezier(0.22,1,0.36,1) both 0.3s;
        }
        .tp-progress-fill-amber {
          height: 100%;
          border-radius: 100px;
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
          animation: tp-bar 1.2s cubic-bezier(0.22,1,0.36,1) both 0.3s;
        }

        /* ── insight metric card ── */
        .tp-insight-metric {
          padding: 16px;
          border-radius: 18px;
          background: #fafafa;
          border: 1px solid #f1f5f9;
          transition: background 0.25s, border-color 0.25s;
        }
        .tp-insight-metric:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        /* ── stat mini tiles ── */
        .tp-stat-tile {
          text-align: center;
          border-radius: 16px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          padding: 14px 8px;
        }

        /* ── CTA review link ── */
        .tp-review-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
          padding: 14px 20px;
          border-radius: 16px;
          border: 2px dashed #93c5fd;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.25s, border-color 0.25s, transform 0.25s, box-shadow 0.25s;
        }
        .tp-review-cta:hover {
          background: #dbeafe;
          border-color: #60a5fa;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37,99,235,0.15);
        }
        .tp-review-cta svg { transition: transform 0.25s; }
        .tp-review-cta:hover svg { transform: rotate(12deg) scale(1.15); }

        /* ── skeleton pulse ── */
        @keyframes tp-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .tp-skeleton {
          border-radius: 16px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 800px 100%;
          animation: tp-shimmer 1.4s infinite linear;
        }
      `}</style>

      <div className="tp-root space-y-6">

        {/* ══════════════════════════════════════════
            HERO CARD
        ══════════════════════════════════════════ */}
        <div ref={heroRef} className="tp-hero">
          <div className="tp-circle" />
          <div className="tp-circle-2" />

          <div className="relative z-10">
            {/* Label */}
            <p className={`tp-label ${heroVisible ? 'tp-fade tp-d0' : 'opacity-0'}`}>
              Transporter Dashboard
            </p>

            <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h2
                  className={`mt-2 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl ${heroVisible ? 'tp-rise tp-d1' : 'opacity-0'}`}
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                >
                  Manage your delivery operations
                  <span className="block text-blue-600">more efficiently.</span>
                </h2>

                <p className={`mt-4 text-sm leading-7 text-slate-500 md:text-base max-w-lg ${heroVisible ? 'tp-rise tp-d2' : 'opacity-0'}`}>
                  Access your trips, vehicles, orders, and communication tools from one
                  clean and modern dashboard built for Sri Lankan transporters.
                </p>

                {/* Stat pills */}
                <div className={`mt-6 flex flex-wrap gap-3 ${heroVisible ? 'tp-rise tp-d3' : 'opacity-0'}`}>
                  {headerStats.map((stat) => (
                    <div key={stat.label} className="tp-stat">
                      <span className="tp-stat-dot" />
                      <span className="text-slate-500 font-medium">{stat.label}</span>
                      <span style={{ color: stat.color }} className="font-bold">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA button */}
              <div className={heroVisible ? 'tp-scale tp-d4' : 'opacity-0'}>
                <Link to="/available-orders" className="tp-browse-btn">
                  Find Orders
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            QUICK ACTIONS
        ══════════════════════════════════════════ */}
        <div ref={actionsRef}>
          <div className={`mb-5 ${actionsVisible ? 'tp-fade tp-d0' : 'opacity-0'}`}>
            <p className="tp-label">Quick Actions</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Your main shortcuts</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item, idx) => {
              const IconComp = item.icon
              return (
                <Link
                  key={item.title}
                  to={item.to}
                  className={`tp-card ${actionsVisible ? `tp-rise tp-d${Math.min(idx + 1, 6)}` : 'opacity-0'}`}
                >
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="tp-card-icon">
                        {IconComp && typeof IconComp !== 'string'
                          ? <IconComp />
                          : <span className="text-xl">{item.icon}</span>
                        }
                      </div>

                      <h4 className="mt-4 flex items-center gap-2 text-base font-bold text-slate-900">
                        {item.title}
                        {item.to === '/chat' && unreadMessages > 0 && (
                          <span className="tp-badge">
                            {unreadMessages > 99 ? '99+' : unreadMessages}
                          </span>
                        )}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500 leading-relaxed">{item.subtitle}</p>
                    </div>

                    <div className="tp-card-arrow">→</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            WORKFLOW + INSIGHTS
        ══════════════════════════════════════════ */}
        <div ref={bottomRef} className="grid gap-6 lg:grid-cols-2">

          {/* Workflow */}
          <div className={`tp-panel ${bottomVisible ? 'tp-rise tp-d0' : 'opacity-0'}`}>
            <p className="tp-label">Workflow</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Delivery process</h3>

            <div className="mt-6 space-y-3">
              {workflow.map((item, idx) => (
                <div
                  key={item.step}
                  className={`tp-workflow-step ${bottomVisible ? `tp-rise tp-d${idx + 1}` : 'opacity-0'}`}
                >
                  <div className="tp-step-num">{item.step}</div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className={`tp-panel ${bottomVisible ? 'tp-rise tp-d1' : 'opacity-0'}`}>
            <p className="tp-label">Insights</p>
            <h3 className="mt-2 text-2xl font-bold text-slate-900" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Transporter performance</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Live metrics from your trips and distributor reviews.
            </p>

            {loadingInsights ? (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="tp-skeleton h-16" />
                  ))}
                </div>
                <div className="tp-skeleton h-14" />
                <div className="tp-skeleton h-16" />
                <div className="tp-skeleton h-16" />
                <div className="tp-skeleton h-16" />
              </div>
            ) : (
              <>
                {/* Trip stat tiles */}
                <div className={`mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 ${bottomVisible ? 'tp-rise tp-d2' : 'opacity-0'}`}>
                  {[
                    { label: 'Total Trips', value: totalTrips,     color: 'text-blue-700'    },
                    { label: 'Active',      value: activeTrips,    color: 'text-blue-600'    },
                    { label: 'Completed',   value: completedTrips, color: 'text-emerald-600' },
                    { label: 'Cancelled',   value: cancelledTrips, color: 'text-slate-700'   },
                  ].map((tile) => (
                    <div key={tile.label} className="tp-stat-tile">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{tile.label}</p>
                      <p className={`mt-1 text-2xl font-extrabold ${tile.color}`} style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                        <Counter target={String(tile.value)} />
                      </p>
                    </div>
                  ))}
                </div>

                {/* Revenue */}
                <div className={`mt-4 rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 ${bottomVisible ? 'tp-rise tp-d3' : 'opacity-0'}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Revenue (completed trips)</p>
                  <p className="mt-1 text-xl font-bold text-blue-700" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                    LKR {revenue.toLocaleString()}
                  </p>
                </div>

                {/* Metric bars */}
                <div className="mt-4 space-y-4">
                  {/* Trip completion rate */}
                  <div className={`tp-insight-metric ${bottomVisible ? 'tp-rise tp-d3' : 'opacity-0'}`}>
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-medium">Trip Completion Rate</span>
                      <span className="font-bold text-blue-600 tabular-nums">
                        {totalTrips > 0 ? `${completionRate.toFixed(0)}%` : '—'}
                      </span>
                    </div>
                    <div className="tp-progress-track">
                      {bottomVisible && (
                        <div className="tp-progress-fill-blue" style={{ width: `${totalTrips > 0 ? completionRate : 0}%` }} />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {totalTrips > 0
                        ? `${completedTrips} of ${totalTrips} trips finished successfully`
                        : 'Complete your first trip to see this metric'}
                    </p>
                  </div>

                  {/* On-time delivery */}
                  <div className={`tp-insight-metric ${bottomVisible ? 'tp-rise tp-d4' : 'opacity-0'}`}>
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-medium">On-Time Delivery</span>
                      <span className="font-bold text-blue-600 tabular-nums">
                        {onTimeRate != null ? `${Number(onTimeRate).toFixed(0)}%` : '—'}
                      </span>
                    </div>
                    <div className="tp-progress-track">
                      {bottomVisible && (
                        <div className="tp-progress-fill-emerald" style={{ width: `${onTimeRate != null ? clampPct(onTimeRate) : 0}%` }} />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {onTimeN > 0
                        ? `Among ${onTimeN} completed trip${onTimeN === 1 ? '' : 's'} with scheduled vs actual delivery times`
                        : 'Needs completed trips with both estimated and actual delivery times'}
                    </p>
                  </div>

                  {/* Customer rating */}
                  <div className={`tp-insight-metric ${bottomVisible ? 'tp-rise tp-d5' : 'opacity-0'}`}>
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-medium">Customer Rating</span>
                      <span className="font-bold text-blue-600 tabular-nums">
                        {totalReviews > 0 ? `${avgRating.toFixed(1)} / 5` : 'No reviews yet'}
                      </span>
                    </div>
                    <div className="tp-progress-track">
                      {bottomVisible && (
                        <div className="tp-progress-fill-amber" style={{ width: `${totalReviews > 0 ? ratingBarPct : 0}%` }} />
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {totalReviews > 0
                        ? `${totalReviews} review${totalReviews === 1 ? '' : 's'} · Timeliness score ${timeliness.toFixed(1)}/5`
                        : 'Distributor reviews appear here after deliveries'}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <Link to="/transporter-ratings" className="tp-review-cta">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  View full ratings and reviews
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── SVG Icon components ─── */
function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
function VehicleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  )
}
function TripIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
    </svg>
  )
}
function OrderIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    </svg>
  )
}
function StarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  )
}

export default TransporterPanel