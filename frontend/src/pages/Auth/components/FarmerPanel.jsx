// src/pages/Auth/components/FarmerPanel.jsx
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

const FarmerPanel = ({ links = [], unreadMessages = 0 }) => {
  const { user } = useAuth()

  /* ── inject Google Fonts into <head> reliably ── */
  useEffect(() => {
    const id = 'fp-google-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id   = id
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
    document.head.appendChild(link)
  }, [])

  const defaultLinks = [
    { title: 'Profile',          to: '/profile',         subtitle: 'Manage personal details',          icon: ProfileIcon    },
    { title: 'My Products',      to: '/my-products',     subtitle: 'Manage your listings',            icon: LeafIcon       },
    { title: 'Add Product',      to: '/products/add',    subtitle: 'List a new product',              icon: AddIcon        },
    { title: 'Orders',           to: '/farmer-orders',   subtitle: 'Manage incoming orders',          icon: OrderIcon      },
    { title: 'My Ratings',       to: '/farmer-ratings',  subtitle: 'View ratings and respond',        icon: StarIcon       },
    { title: 'Messages',         to: '/chat',            subtitle: 'Connect with partners',           icon: ChatIcon       },
  ]

  const items = links.length ? links : defaultLinks

  const stats = [
    { label: 'Active Products', value: '12',                    color: '#10b981' },
    { label: 'Pending Orders',  value: '3',                     color: '#059669' },
    { label: 'Messages',        value: String(unreadMessages),  color: '#047857' },
  ]

  const workflow = [
    { step: '01', title: 'List Products',     description: 'Add your agricultural products to the marketplace with images.' },
    { step: '02', title: 'Manage Orders',     description: 'Review and accept incoming orders from buyers across SL.' },
    { step: '03', title: 'Update Location',   description: 'Keep your pickup location accurate using the map tool.' },
    { step: '04', title: 'Check Ratings',     description: 'View ratings from distributors and manage feedback.' },
  ]

  const [heroRef, heroVisible]       = useReveal()
  const [actionsRef, actionsVisible] = useReveal()
  const [bottomRef, bottomVisible]   = useReveal()

  return (
    <>
      <style>{`
        .fp-root { font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif; }
        .fp-display { font-family: 'Fraunces', Georgia, serif; }

        @keyframes fp-rise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fp-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fp-scale { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
        @keyframes fp-bar { from { width: 0; } }
        @keyframes fp-pulse-ring { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.8); opacity: 0; } }

        .fp-rise   { animation: fp-rise  0.65s cubic-bezier(0.22,1,0.36,1) both; }
        .fp-fade   { animation: fp-fade  0.5s ease both; }
        .fp-scale  { animation: fp-scale 0.55s cubic-bezier(0.22,1,0.36,1) both; }

        .fp-d0  { animation-delay: 0ms;   } .fp-d1  { animation-delay: 80ms;  } .fp-d2  { animation-delay: 160ms; }
        .fp-d3  { animation-delay: 240ms; } .fp-d4  { animation-delay: 320ms; } .fp-d5  { animation-delay: 400ms; }

        .fp-hero {
          position: relative; background: #fff; border: 1px solid #e2e8f0;
          border-radius: 28px; padding: 36px; overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(16,185,129,0.04);
        }
        .fp-hero::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 60% at 100% 0%, rgba(167,243,208,0.45) 0%, transparent 65%),
                      radial-gradient(ellipse 40% 40% at 0% 100%, rgba(209,250,229,0.3) 0%, transparent 60%);
          pointer-events: none;
        }

        .fp-circle { position: absolute; top: -40px; right: -40px; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(167,243,208,0.3) 0%, transparent 70%); pointer-events: none; }
        .fp-circle-2 { position: absolute; bottom: -60px; left: 30px; width: 160px; height: 160px; border-radius: 50%; background: radial-gradient(circle, rgba(167,243,208,0.2) 0%, transparent 70%); pointer-events: none; }

        .fp-stat {
          display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px;
          background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 100px;
          font-size: 13px; color: #064e3b; font-weight: 600;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .fp-stat:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16,185,129,0.14); }
        .fp-stat-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; position: relative; }
        .fp-stat-dot::after { content: ''; position: absolute; inset: -3px; border-radius: 50%; background: rgba(16,185,129,0.3); animation: fp-pulse-ring 1.6s ease-out infinite; }

        .fp-add-btn {
          display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px;
          background: #10b981; color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700; font-size: 14px; border-radius: 16px; border: none; cursor: pointer; text-decoration: none;
          transition: background 0.25s, transform 0.25s, box-shadow 0.25s; white-space: nowrap; box-shadow: 0 4px 16px rgba(16,185,129,0.25);
        }
        .fp-add-btn:hover { background: #059669; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(16,185,129,0.35); }
        .fp-add-btn svg { transition: transform 0.25s; } .fp-add-btn:hover svg { transform: translateX(2px) translateY(-2px) scale(1.1); }

        .fp-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: #10b981; display: flex; align-items: center; gap: 8px; }
        .fp-label::before { content: ''; display: inline-block; width: 20px; height: 2px; background: #10b981; border-radius: 2px; }

        .fp-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 22px; text-decoration: none; display: block; transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.3s ease; position: relative; overflow: hidden; }
        .fp-card::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(236,253,245,0.7) 0%, transparent 60%); opacity: 0; transition: opacity 0.3s; }
        .fp-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(16,185,129,0.12), 0 4px 16px rgba(0,0,0,0.06); border-color: #a7f3d0; }
        .fp-card:hover::after { opacity: 1; }

        .fp-card-icon { width: 48px; height: 48px; border-radius: 16px; background: #ecfdf5; border: 1px solid #d1fae5; display: flex; align-items: center; justify-content: center; color: #10b981; transition: background 0.3s, transform 0.3s; }
        .fp-card:hover .fp-card-icon { background: #d1fae5; transform: scale(1.1) rotate(4deg); }

        .fp-card-arrow { width: 32px; height: 32px; border-radius: 50%; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 14px; transition: background 0.3s, color 0.3s, transform 0.3s, border-color 0.3s; flex-shrink: 0; }
        .fp-card:hover .fp-card-arrow { background: #10b981; color: #fff; border-color: #10b981; transform: translateX(3px); }

        .fp-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 100px; background: #ef4444; color: #fff; font-size: 10px; font-weight: 800; line-height: 1; }

        .fp-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 28px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }

        .fp-workflow-step { display: flex; align-items: flex-start; gap: 16px; padding: 16px; border-radius: 18px; background: #fafafa; border: 1px solid #f1f5f9; transition: background 0.25s, border-color 0.25s, transform 0.25s; cursor: default; }
        .fp-workflow-step:hover { background: #ecfdf5; border-color: #a7f3d0; transform: translateX(4px); }
        .fp-step-num { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: #fff; font-family: 'Fraunces', Georgia, serif; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(16,185,129,0.3); }

        .fp-progress-track { height: 8px; border-radius: 100px; background: #f1f5f9; overflow: hidden; }
        .fp-progress-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, #10b981, #6ee7b7); animation: fp-bar 1.2s cubic-bezier(0.22,1,0.36,1) both 0.3s; }

        .fp-insight-metric { padding: 16px; border-radius: 18px; background: #fafafa; border: 1px solid #f1f5f9; transition: background 0.25s, border-color 0.25s; }
        .fp-insight-metric:hover { background: #ecfdf5; border-color: #a7f3d0; }

        .fp-review-cta { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 20px; padding: 14px 20px; border-radius: 16px; border: 2px dashed #6ee7b7; background: #ecfdf5; color: #059669; font-size: 14px; font-weight: 700; text-decoration: none; transition: background 0.25s, border-color 0.25s, transform 0.25s, box-shadow 0.25s; }
        .fp-review-cta:hover { background: #d1fae5; border-color: #34d399; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(16,185,129,0.15); }
        .fp-review-cta svg { transition: transform 0.25s; }
        .fp-review-cta:hover svg { transform: rotate(12deg) scale(1.15); }
      `}</style>

      <div className="fp-root space-y-6">

        {/* HERO CARD */}
        <div ref={heroRef} className="fp-hero">
          <div className="fp-circle" />
          <div className="fp-circle-2" />

          <div className="relative z-10">
            <p className={`fp-label ${heroVisible ? 'fp-fade fp-d0' : 'opacity-0'}`}>
              Farmer Dashboard
            </p>

            <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h2
                  className={`fp-display mt-2 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl ${heroVisible ? 'fp-rise fp-d1' : 'opacity-0'}`}
                >
                  Manage your farm operations
                  <span className="block text-emerald-500">more efficiently.</span>
                </h2>

                <p className={`mt-4 text-sm leading-7 text-slate-500 md:text-base max-w-lg ${heroVisible ? 'fp-rise fp-d2' : 'opacity-0'}`}>
                  Access your products, orders, and communication tools from one
                  clean and modern dashboard built for Sri Lankan farmers.
                </p>

                <div className={`mt-6 flex flex-wrap gap-3 ${heroVisible ? 'fp-rise fp-d3' : 'opacity-0'}`}>
                  {stats.map((stat) => (
                    <div key={stat.label} className="fp-stat">
                      <span className="fp-stat-dot" />
                      <span className="text-slate-500 font-medium">{stat.label}</span>
                      <span style={{ color: stat.color }} className="font-bold">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={heroVisible ? 'fp-scale fp-d4' : 'opacity-0'}>
                <Link to="/products/add" className="fp-add-btn">
                  Add New Product
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                     <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div ref={actionsRef}>
          <div className={`mb-5 ${actionsVisible ? 'fp-fade fp-d0' : 'opacity-0'}`}>
            <p className="fp-label">Quick Actions</p>
            <h3 className="fp-display mt-2 text-2xl font-bold text-slate-900">Your main shortcuts</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, idx) => {
              const IconComp = item.icon
              return (
                <Link
                  key={item.title}
                  to={item.to}
                  className={`fp-card ${actionsVisible ? `fp-rise fp-d${Math.min(idx + 1, 5)}` : 'opacity-0'}`}
                >
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="fp-card-icon">
                        {IconComp ? <IconComp /> : <span className="text-xl">{item.icon}</span>}
                      </div>

                      <h4 className="mt-4 flex items-center gap-2 text-base font-bold text-slate-900">
                        {item.title}
                        {item.to === '/chat' && unreadMessages > 0 && (
                          <span className="fp-badge">
                            {unreadMessages > 99 ? '99+' : unreadMessages}
                          </span>
                        )}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500 leading-relaxed">{item.subtitle}</p>
                    </div>

                    <div className="fp-card-arrow">→</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* WORKFLOW + INSIGHTS */}
        <div ref={bottomRef} className="grid gap-6 lg:grid-cols-2">

          <div className={`fp-panel ${bottomVisible ? 'fp-rise fp-d0' : 'opacity-0'}`}>
            <p className="fp-label">Workflow</p>
            <h3 className="fp-display mt-2 text-2xl font-bold text-slate-900">Farming process</h3>

            <div className="mt-6 space-y-3">
              {workflow.map((item, idx) => (
                <div key={item.step} className={`fp-workflow-step ${bottomVisible ? `fp-rise fp-d${idx + 1}` : 'opacity-0'}`}>
                  <div className="fp-step-num">{item.step}</div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`fp-panel ${bottomVisible ? 'fp-rise fp-d1' : 'opacity-0'}`}>
            <p className="fp-label">Insights</p>
            <h3 className="fp-display mt-2 text-2xl font-bold text-slate-900">Farm performance</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Overview of your sales performance and system activity.
            </p>

            <div className="mt-6 space-y-5">
              <div className={`fp-insight-metric ${bottomVisible ? 'fp-rise fp-d2' : 'opacity-0'}`}>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Products Sold</span>
                  <span className="font-bold text-emerald-600 tabular-nums">78%</span>
                </div>
                <div className="fp-progress-track">
                  {bottomVisible && <div className="fp-progress-fill" style={{ width: '78%' }} />}
                </div>
              </div>

              <div className={`fp-insight-metric ${bottomVisible ? 'fp-rise fp-d3' : 'opacity-0'}`}>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Profile Completion</span>
                  <span className="font-bold text-emerald-600 tabular-nums">95%</span>
                </div>
                <div className="fp-progress-track">
                  {bottomVisible && <div className="fp-progress-fill" style={{ width: '95%' }} />}
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-3 mt-4 ${bottomVisible ? 'fp-rise fp-d4' : 'opacity-0'}`}>
                  <div className="text-center rounded-2xl bg-emerald-50 border border-emerald-100 py-4 px-2">
                    <p className="fp-display text-2xl font-extrabold text-emerald-700">
                      <Counter target="12" />
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wide leading-tight">Active Listings</p>
                  </div>
                  <div className="text-center rounded-2xl bg-teal-50 border border-teal-100 py-4 px-2">
                    <p className="fp-display text-2xl font-extrabold text-teal-700">
                      <Counter target="4" />
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wide leading-tight">Recent Reviews</p>
                  </div>
              </div>

              <Link to="/farmer-ratings" className="fp-review-cta">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                View your ratings & feedback
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── SVG Icon components ─── */
function ProfileIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
function OrderIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg> }
function StarIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> }
function LeafIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 19.41A1 1 0 005.12 21C7 19.43 11.4 17 21 17c-1.5-2-3-5-4-9z"/></svg> }
function ChatIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> }
function AddIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg> }

export default FarmerPanel