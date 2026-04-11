// src/pages/Auth/components/DistributorPanel.jsx
import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'

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

const DistributorPanel = ({ links = [], unreadMessages = 0 }) => {
  const { user } = useAuth()

  /* ── inject Google Fonts into <head> reliably ── */
  useEffect(() => {
    const id = 'dp-google-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id   = id
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [])

  const defaultLinks = [
    { title: 'Profile',          to: '/profile',                        subtitle: 'Manage business details',          icon: ProfileIcon    },
    { title: 'My Orders',        to: '/orders',                         subtitle: 'Track and manage orders',          icon: OrderIcon      },
    { title: 'Pending Reviews',  to: '/pending-reviews',                subtitle: 'Rate farmers and transporters',    icon: StarIcon       },
    { title: 'My Ratings',       to: `/reviews/Distributor/${user?.id}`, subtitle: 'See your ratings from partners',  icon: ChartIcon      },
    { title: 'All Products',     to: '/products',                       subtitle: 'Browse and order products',        icon: LeafIcon       },
    { title: 'Messages',         to: '/chat',                           subtitle: 'Connect with partners',            icon: ChatIcon       },
  ]

  const items = links.length ? links : defaultLinks

  const stats = [
    { label: 'Active Orders',    value: '0',                    color: '#16a34a' },
    { label: 'Pending Reviews',  value: '0',                    color: '#15803d' },
    { label: 'Messages',         value: String(unreadMessages), color: '#166534' },
  ]

  const workflow = [
    { step: '01', title: 'Browse Products',   description: 'Find fresh agricultural products from local farmers across Sri Lanka.' },
    { step: '02', title: 'Place Order',        description: 'Select quantity, confirm price, and set your delivery location.' },
    { step: '03', title: 'Request Transport',  description: 'Connect with a verified transporter to deliver your order.' },
    { step: '04', title: 'Rate Service',       description: 'Leave reviews for farmers and transporters after delivery.' },
  ]

  const [heroRef, heroVisible]       = useReveal()
  const [actionsRef, actionsVisible] = useReveal()
  const [bottomRef, bottomVisible]   = useReveal()

  return (
    <>
      <style>{`
        .dp-root { font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif; }
        .dp-display { font-family: 'Fraunces', Georgia, serif; }

        /* ── entry animations ── */
        @keyframes dp-rise {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes dp-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes dp-scale {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1);    }
        }
        @keyframes dp-bar {
          from { width: 0; }
        }
        @keyframes dp-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes dp-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0;   }
        }

        .dp-rise   { animation: dp-rise  0.65s cubic-bezier(0.22,1,0.36,1) both; }
        .dp-fade   { animation: dp-fade  0.5s ease both; }
        .dp-scale  { animation: dp-scale 0.55s cubic-bezier(0.22,1,0.36,1) both; }

        /* stagger helpers */
        .dp-d0  { animation-delay: 0ms;   }
        .dp-d1  { animation-delay: 80ms;  }
        .dp-d2  { animation-delay: 160ms; }
        .dp-d3  { animation-delay: 240ms; }
        .dp-d4  { animation-delay: 320ms; }
        .dp-d5  { animation-delay: 400ms; }
        .dp-d6  { animation-delay: 480ms; }

        /* ── hero card ── */
        .dp-hero {
          position: relative;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 36px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(22,163,74,0.04);
        }
        .dp-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 60% at 100% 0%, rgba(187,247,208,0.45) 0%, transparent 65%),
            radial-gradient(ellipse 40% 40% at 0% 100%, rgba(220,252,231,0.3) 0%, transparent 60%);
          pointer-events: none;
        }

        /* decorative circle */
        .dp-circle {
          position: absolute;
          top: -40px; right: -40px;
          width: 220px; height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(134,239,172,0.25) 0%, transparent 70%);
          pointer-events: none;
        }
        .dp-circle-2 {
          position: absolute;
          bottom: -60px; left: 30px;
          width: 160px; height: 160px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(187,247,208,0.2) 0%, transparent 70%);
          pointer-events: none;
        }

        /* ── stat pill ── */
        .dp-stat {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 100px;
          font-size: 13px;
          color: #14532d;
          font-weight: 600;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .dp-stat:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(22,163,74,0.14);
        }
        .dp-stat-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #16a34a;
          position: relative;
        }
        .dp-stat-dot::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: rgba(22,163,74,0.3);
          animation: dp-pulse-ring 1.6s ease-out infinite;
        }

        /* ── browse btn ── */
        .dp-browse-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #16a34a;
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
          box-shadow: 0 4px 16px rgba(22,163,74,0.25);
        }
        .dp-browse-btn:hover {
          background: #15803d;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(22,163,74,0.35);
        }
        .dp-browse-btn svg { transition: transform 0.25s; }
        .dp-browse-btn:hover svg { transform: translateX(3px); }

        /* ── section label ── */
        .dp-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #16a34a;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dp-label::before {
          content: '';
          display: inline-block;
          width: 20px; height: 2px;
          background: #16a34a;
          border-radius: 2px;
        }

        /* ── action card ── */
        .dp-card {
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
        .dp-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(240,253,244,0.7) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .dp-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 48px rgba(22,163,74,0.12), 0 4px 16px rgba(0,0,0,0.06);
          border-color: #bbf7d0;
        }
        .dp-card:hover::after { opacity: 1; }

        .dp-card-icon {
          width: 48px; height: 48px;
          border-radius: 16px;
          background: #f0fdf4;
          border: 1px solid #dcfce7;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #16a34a;
          transition: background 0.3s, transform 0.3s;
        }
        .dp-card:hover .dp-card-icon {
          background: #dcfce7;
          transform: scale(1.1) rotate(-4deg);
        }

        .dp-card-arrow {
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
        .dp-card:hover .dp-card-arrow {
          background: #16a34a;
          color: #fff;
          border-color: #16a34a;
          transform: translateX(3px);
        }

        .dp-badge {
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

        /* ── workflow card ── */
        .dp-panel {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }

        .dp-workflow-step {
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
        .dp-workflow-step:hover {
          background: #f0fdf4;
          border-color: #bbf7d0;
          transform: translateX(4px);
        }
        .dp-step-num {
          width: 44px; height: 44px;
          border-radius: 14px;
          background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
          color: #fff;
          font-family: 'Fraunces', Georgia, serif;
          font-size: 13px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(22,163,74,0.3);
        }

        /* ── progress bar ── */
        .dp-progress-track {
          height: 8px;
          border-radius: 100px;
          background: #f1f5f9;
          overflow: hidden;
        }
        .dp-progress-fill {
          height: 100%;
          border-radius: 100px;
          background: linear-gradient(90deg, #16a34a, #4ade80);
          animation: dp-bar 1.2s cubic-bezier(0.22,1,0.36,1) both 0.3s;
        }

        /* ── insight card ── */
        .dp-insight-metric {
          padding: 16px;
          border-radius: 18px;
          background: #fafafa;
          border: 1px solid #f1f5f9;
          transition: background 0.25s, border-color 0.25s;
        }
        .dp-insight-metric:hover {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        /* ── CTA review link ── */
        .dp-review-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 20px;
          padding: 14px 20px;
          border-radius: 16px;
          border: 2px dashed #86efac;
          background: #f0fdf4;
          color: #15803d;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: background 0.25s, border-color 0.25s, transform 0.25s, box-shadow 0.25s;
        }
        .dp-review-cta:hover {
          background: #dcfce7;
          border-color: #4ade80;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(22,163,74,0.15);
        }
        .dp-review-cta svg {
          transition: transform 0.25s;
        }
        .dp-review-cta:hover svg {
          transform: rotate(12deg) scale(1.15);
        }
      `}</style>

      <div className="dp-root space-y-6">

        {/* ══════════════════════════════════════════
            HERO CARD
        ══════════════════════════════════════════ */}
        <div
          ref={heroRef}
          className="dp-hero"
        >
          <div className="dp-circle" />
          <div className="dp-circle-2" />

          <div className="relative z-10">
            {/* Label */}
            <p className={`dp-label ${heroVisible ? 'dp-fade dp-d0' : 'opacity-0'}`}>
              Distributor Dashboard
            </p>

            <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h2
                  className={`dp-display mt-2 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl ${heroVisible ? 'dp-rise dp-d1' : 'opacity-0'}`}
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                >
                  Manage your distribution
                  <span className="block text-green-600">more efficiently.</span>
                </h2>

                <p className={`mt-4 text-sm leading-7 text-slate-500 md:text-base max-w-lg ${heroVisible ? 'dp-rise dp-d2' : 'opacity-0'}`}>
                  Access your orders, reviews, and communication tools from one
                  clean and modern dashboard built for Sri Lankan distributors.
                </p>

                {/* Stat pills */}
                <div className={`mt-6 flex flex-wrap gap-3 ${heroVisible ? 'dp-rise dp-d3' : 'opacity-0'}`}>
                  {stats.map((stat) => (
                    <div key={stat.label} className="dp-stat">
                      <span className="dp-stat-dot" />
                      <span className="text-slate-500 font-medium">{stat.label}</span>
                      <span style={{ color: stat.color }} className="font-bold">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA button */}
              <div className={heroVisible ? 'dp-scale dp-d4' : 'opacity-0'}>
                <Link to="/products" className="dp-browse-btn">
                  Browse Products
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
          <div className={`mb-5 ${actionsVisible ? 'dp-fade dp-d0' : 'opacity-0'}`}>
            <p className="dp-label">Quick Actions</p>
            <h3 className="dp-display mt-2 text-2xl font-bold text-slate-900" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Your main shortcuts</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item, idx) => {
              const IconComp = item.icon
              return (
                <Link
                  key={item.title}
                  to={item.to}
                  className={`dp-card ${actionsVisible ? `dp-rise dp-d${Math.min(idx + 1, 6)}` : 'opacity-0'}`}
                >
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="dp-card-icon">
                        {IconComp
                          ? <IconComp />
                          : <span className="text-xl">{item.icon}</span>
                        }
                      </div>

                      <h4 className="mt-4 flex items-center gap-2 text-base font-bold text-slate-900">
                        {item.title}
                        {item.to === '/chat' && unreadMessages > 0 && (
                          <span className="dp-badge">
                            {unreadMessages > 99 ? '99+' : unreadMessages}
                          </span>
                        )}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500 leading-relaxed">{item.subtitle}</p>
                    </div>

                    <div className="dp-card-arrow">→</div>
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
          <div className={`dp-panel ${bottomVisible ? 'dp-rise dp-d0' : 'opacity-0'}`}>
            <p className="dp-label">Workflow</p>
            <h3 className="dp-display mt-2 text-2xl font-bold text-slate-900" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Distribution process</h3>

            <div className="mt-6 space-y-3">
              {workflow.map((item, idx) => (
                <div
                  key={item.step}
                  className={`dp-workflow-step ${bottomVisible ? `dp-rise dp-d${idx + 1}` : 'opacity-0'}`}
                >
                  <div className="dp-step-num">{item.step}</div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className={`dp-panel ${bottomVisible ? 'dp-rise dp-d1' : 'opacity-0'}`}>
            <p className="dp-label">Insights</p>
            <h3 className="dp-display mt-2 text-2xl font-bold text-slate-900" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Your performance</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              An overview of your operational activity and platform engagement.
            </p>

            <div className="mt-6 space-y-5">
              {/* Order Progress */}
              <div className={`dp-insight-metric ${bottomVisible ? 'dp-rise dp-d2' : 'opacity-0'}`}>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-medium">Order Progress</span>
                  </div>
                  <span className="font-bold text-green-600 tabular-nums">78%</span>
                </div>
                <div className="dp-progress-track">
                  {bottomVisible && (
                    <div className="dp-progress-fill" style={{ width: '78%' }} />
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-400">Based on completed deliveries this month</p>
              </div>

              {/* Reviews Completed */}
              <div className={`dp-insight-metric ${bottomVisible ? 'dp-rise dp-d3' : 'opacity-0'}`}>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Reviews Completed</span>
                  <span className="font-bold text-green-600 tabular-nums">0%</span>
                </div>
                <div className="dp-progress-track">
                  {bottomVisible && (
                    <div className="dp-progress-fill" style={{ width: '0%' }} />
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-400">Complete reviews to improve community trust</p>
              </div>

              {/* Stats row */}
              <div className={`grid grid-cols-3 gap-3 ${bottomVisible ? 'dp-rise dp-d4' : 'opacity-0'}`}>
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center rounded-2xl bg-green-50 border border-green-100 py-4 px-2">
                    <p className="dp-display text-2xl font-extrabold text-green-700" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                      <Counter target={stat.value} />
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wide leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Review CTA */}
              <Link to="/pending-reviews" className="dp-review-cta">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Write pending reviews
              </Link>
            </div>
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
function OrderIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
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
function ChartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}
function LeafIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 19.41A1 1 0 005.12 21C7 19.43 11.4 17 21 17c-1.5-2-3-5-4-9z"/>
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

export default DistributorPanel