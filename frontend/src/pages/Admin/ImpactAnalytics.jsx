import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

/* ─── Animated counter hook ─── */
function useCountUp(target, duration = 1400, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || !target) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

/* ─── Single animated stat card ─── */
const StatCard = ({ label, rawValue, suffix = "", color, icon, delay = 0, animate }) => {
  const numericValue = parseFloat(rawValue) || 0;
  const counted = useCountUp(numericValue, 1200, animate);
  const display = Number.isInteger(numericValue) ? counted : counted.toFixed(1);

  return (
    <div
      className="ia-card ia-stat-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="ia-stat-icon" style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <p className="ia-stat-label">{label}</p>
      <p className="ia-stat-value" style={{ color }}>
        {display}{suffix}
      </p>
    </div>
  );
};

/* ─── Custom Recharts tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1.5px solid #d1fae5", borderRadius: 12,
      padding: "10px 16px", boxShadow: "0 8px 24px rgba(21,128,61,0.12)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {label && <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, fontSize: 14, fontWeight: 800, color: p.fill || p.color || "#15803d" }}>
          {p.name ? `${p.name}: ` : ""}{p.value}
        </p>
      ))}
    </div>
  );
};

/* ─── Empty chart placeholder ─── */
const EmptyChart = ({ text, sub }) => (
  <div style={{
    height: "100%", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 8,
    border: "1.5px dashed #d1fae5", borderRadius: 16, background: "#f0fdf4",
  }}>
    <span style={{ fontSize: 32 }}>📊</span>
    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#374151" }}>{text}</p>
    <p style={{ margin: 0, fontSize: 12, color: "#9ca3af", maxWidth: 220, textAlign: "center", lineHeight: 1.5 }}>{sub}</p>
  </div>
);

/* ─── Section wrapper with top divider ─── */
const Section = ({ children, delay = 0, first = false }) => (
  <div
    className="ia-rise ia-section"
    style={{ animationDelay: `${delay}ms`, paddingTop: first ? 0 : 56 }}
  >
    {!first && (
      <div style={{
        height: 1,
        background: "linear-gradient(90deg, transparent 0%, #d1fae5 20%, #a7f3d0 50%, #d1fae5 80%, transparent 100%)",
        marginBottom: 48,
      }} />
    )}
    {children}
  </div>
);

/* ─── Section heading ─── */
const SectionHeading = ({ label, title }) => (
  <div style={{ marginBottom: 24 }}>
    <p className="ia-eyebrow">{label}</p>
    <h2 className="ia-section-title">{title}</h2>
  </div>
);

const ImpactAnalytics = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);

  /* Font injection */
  useEffect(() => {
    const id = "ia-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id; link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Lora:wght@600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/admin/impact-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load impact stats");
      if (data.success) {
        setStats(data.stats);
        setTimeout(() => setAnimate(true), 300);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load impact analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    if (user?.role && user.role !== "Admin") {
      toast.error("Only admins can access this page");
      navigate("/dashboard"); return;
    }
    fetchStats();
  }, [token, user?.role, navigate]);

  const orderStatusData = [
    { name: "Pending",         value: stats?.pendingOrders || 0 },
    { name: "Awaiting Farmer", value: stats?.awaitingFarmerApprovalOrders || 0 },
    { name: "Confirmed",       value: stats?.confirmedOrders || 0 },
    { name: "Cancelled",       value: stats?.cancelledOrders || 0 },
  ];
  const deliveryData = [
    { name: "Delivered",   value: stats?.completedDeliveries || 0 },
    { name: "In Progress", value: Math.max((stats?.totalOrders || 0) - (stats?.completedDeliveries || 0), 0) },
  ];

  const hasOrderData    = orderStatusData.some((d) => d.value > 0);
  const hasDeliveryData = deliveryData.some((d) => d.value > 0);

  const BAR_COLORS = ["#f59e0b", "#fb923c", "#22c55e", "#f87171"];
  const PIE_COLORS = ["#15803d", "#bbf7d0"];

  const sdgStats = [
    { label: "Food Distributed",     rawValue: stats?.totalFoodDistributed || 0, suffix: " kg", color: "#15803d", icon: "🌾", delay: 0   },
    { label: "Completed Deliveries", rawValue: stats?.completedDeliveries   || 0, suffix: "",    color: "#0284c7", icon: "🚚", delay: 80  },
    { label: "Active Farmers",       rawValue: stats?.activeFarmers         || 0, suffix: "",    color: "#d97706", icon: "👨‍🌾", delay: 160 },
    { label: "Success Rate",         rawValue: stats?.successRate           || 0, suffix: "%",   color: "#7c3aed", icon: "📈", delay: 240 },
  ];

  const orderCards = [
    { label: "Total Orders",    value: stats?.totalOrders || 0,                       color: "#0f172a" },
    { label: "Pending",         value: stats?.pendingOrders || 0,                      color: "#d97706" },
    { label: "Awaiting Farmer", value: stats?.awaitingFarmerApprovalOrders || 0,       color: "#ea580c" },
    { label: "Confirmed",       value: stats?.confirmedOrders || 0,                    color: "#15803d" },
    { label: "Cancelled",       value: stats?.cancelledOrders || 0,                    color: "#dc2626" },
  ];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes ia-rise   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ia-fade   { from { opacity:0; } to { opacity:1; } }
        @keyframes ia-pop    { from { opacity:0; transform:scale(0.93); } to { opacity:1; transform:scale(1); } }
        @keyframes ia-mesh   { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes ia-float  { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes ia-spin   { to { transform: rotate(360deg); } }
        @keyframes ia-shimmer {
          0%   { background-position: -300% center; }
          100% { background-position:  300% center; }
        }
        @keyframes ia-bar-grow {
          from { transform: scaleY(0); transform-origin: bottom; }
          to   { transform: scaleY(1); transform-origin: bottom; }
        }

        .ia-root {
          font-family: 'DM Sans', system-ui, sans-serif;
          background: linear-gradient(160deg, #f0fdf4 0%, #ffffff 50%, #f8fafc 100%);
          min-height: 100vh;
          padding: 32px 20px 80px;
          color: #0f172a;
        }

        .ia-rise { animation: ia-rise 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .ia-pop  { animation: ia-pop  0.5s cubic-bezier(0.34,1.56,0.64,1) both; }

        /* ── Back link ── */
        .ia-back {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 13px; font-weight: 700; color: #15803d;
          text-decoration: none; padding: 6px 14px;
          border: 1.5px solid #a7f3d0; border-radius: 100px;
          background: #f0fdf4; transition: all 0.2s ease;
          margin-bottom: 24px;
        }
        .ia-back:hover { background: #dcfce7; border-color: #6ee7b7; transform: translateX(-3px); }

        /* ── Hero banner ── */
        .ia-hero {
          position: relative; overflow: hidden;
          border-radius: 28px; padding: 40px 36px;
          margin-bottom: 36px;
          background: linear-gradient(135deg, #14532d 0%, #15803d 40%, #22c55e 80%, #4ade80 100%);
          background-size: 300% 300%;
          animation: ia-mesh 8s ease infinite, ia-rise 0.7s cubic-bezier(0.22,1,0.36,1) both;
          box-shadow: 0 20px 60px rgba(21,128,61,0.28);
        }
        .ia-hero::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 60% 80% at 100% 0%, rgba(255,255,255,0.12) 0%, transparent 60%),
                      radial-gradient(ellipse 40% 50% at 0% 100%, rgba(255,255,255,0.08) 0%, transparent 60%);
        }
        .ia-hero-blob {
          position: absolute; border-radius: 50%; pointer-events: none;
          background: rgba(255,255,255,0.08);
        }
        .ia-hero-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: 0.22em;
          text-transform: uppercase; color: rgba(255,255,255,0.75);
          display: flex; align-items: center; gap: 8px; margin: 0 0 12px;
        }
        .ia-hero-title {
          font-family: 'Lora', Georgia, serif;
          font-size: clamp(28px, 4vw, 44px); font-weight: 700;
          color: #fff; margin: 0 0 12px; line-height: 1.1;
        }
        .ia-hero-desc {
          font-size: 14px; color: rgba(255,255,255,0.85);
          max-width: 560px; line-height: 1.75; margin: 0;
        }
        .ia-sdg-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.18); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.3); border-radius: 100px;
          padding: 8px 18px; font-size: 13px; font-weight: 700; color: #fff;
          margin-top: 20px;
        }

        /* ── Section heading ── */
        .ia-eyebrow {
          margin: 0 0 6px; font-size: 10px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase; color: #15803d;
          display: flex; align-items: center; gap: 8px;
        }
        .ia-eyebrow::before {
          content: ''; display: inline-block; width: 18px; height: 2px;
          background: #15803d; border-radius: 2px;
        }
        .ia-section-title {
          margin: 0; font-family: 'Lora', Georgia, serif;
          font-size: clamp(20px, 2.5vw, 26px); font-weight: 700; color: #0f172a;
        }

        /* ── Cards ── */
        .ia-card {
          background: #fff; border: 1.5px solid #e8f5e9; border-radius: 22px;
          box-shadow: 0 2px 16px rgba(21,128,61,0.06);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .ia-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 36px rgba(21,128,61,0.14);
          border-color: #a7f3d0;
        }
        .ia-stat-card {
          padding: 22px 20px;
          animation: ia-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
          display: flex; flex-direction: column; gap: 8px;
        }
        .ia-stat-icon {
          width: 42px; height: 42px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .ia-stat-label {
          margin: 0; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8;
        }
        .ia-stat-value {
          margin: 0; font-size: 32px; font-weight: 800; line-height: 1;
          font-family: 'Lora', Georgia, serif;
        }

        /* ── Order mini cards ── */
        .ia-order-card {
          padding: 18px 16px;
          animation: ia-rise 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        .ia-order-label {
          margin: 0 0 8px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em; color: #94a3b8;
        }
        .ia-order-value {
          margin: 0; font-size: 28px; font-weight: 800;
          font-family: 'Lora', Georgia, serif;
        }

        /* ── Chart card ── */
        .ia-chart-card { padding: 26px; }

        /* ── Insight cards ── */
        .ia-insight-card { padding: 28px 26px; }
        .ia-insight-title {
          margin: 0 0 12px; font-family: 'Lora', Georgia, serif;
          font-size: 18px; font-weight: 700; color: #0f172a;
          display: flex; align-items: center; gap: 10px;
        }
        .ia-insight-title::before {
          content: ''; display: inline-block; width: 4px; height: 20px;
          background: linear-gradient(180deg, #15803d, #4ade80);
          border-radius: 4px; flex-shrink: 0;
        }
        .ia-insight-body {
          margin: 0; font-size: 14px; line-height: 1.85; color: #475569;
        }

        /* ── Loading spinner ── */
        .ia-spinner {
          width: 40px; height: 40px; border-radius: 50%;
          border: 3px solid #d1fae5; border-top-color: #15803d;
          animation: ia-spin 0.8s linear infinite;
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .ia-hero { padding: 28px 22px; }
          .ia-grid-4 { grid-template-columns: 1fr 1fr !important; }
          .ia-grid-5 { grid-template-columns: 1fr 1fr !important; }
          .ia-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="ia-root">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* ── Back link ── */}
          <Link to="/admin-dashboard" className="ia-back ia-rise" style={{ animationDelay: "0ms" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Admin Dashboard
          </Link>

          {/* ── Hero Banner ── */}
          <div className="ia-hero">
            {/* Decorative blobs */}
            <div className="ia-hero-blob" style={{ width:220, height:220, top:-60, right:-40, animation:"ia-float 6s ease-in-out infinite" }} />
            <div className="ia-hero-blob" style={{ width:140, height:140, bottom:-50, left:80, animation:"ia-float 8s ease-in-out infinite 1s" }} />
            <div className="ia-hero-blob" style={{ width:80, height:80, top:20, right:200, animation:"ia-float 5s ease-in-out infinite 0.5s" }} />

            <div style={{ position:"relative", zIndex:1 }}>
              <p className="ia-hero-eyebrow">
                <span style={{ fontSize:16 }}>🌾</span>
                AGRIHUB-LK · Admin Analytics
              </p>
              <h1 className="ia-hero-title">Impact Analytics</h1>
              <p className="ia-hero-desc">
                Tracking how AGRIHUB-LK moves food from farms to tables —
                measuring real progress toward <strong style={{color:"#fff"}}>SDG Goal 2: Zero Hunger</strong> through
                order flow, delivery performance, and platform-wide coordination.
              </p>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:20 }}>
                {[
                  { icon:"🎯", label:"SDG 2: Zero Hunger" },
                  { icon:"🇱🇰", label:"Sri Lanka" },
                  { icon:"🔄", label:"Live Data" },
                ].map(b => (
                  <span key={b.label} className="ia-sdg-badge">
                    <span>{b.icon}</span> {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="ia-card" style={{ padding:60, textAlign:"center" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
                <div className="ia-spinner" />
                <p style={{ margin:0, fontSize:14, color:"#64748b", fontWeight:500 }}>Loading impact analytics…</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── SDG Impact Summary ── */}
              <Section delay={100} first>
                <SectionHeading label="SDG Impact" title="Key Impact Metrics" />
                <div
                  className="ia-grid-4"
                  style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}
                >
                  {sdgStats.map((s) => (
                    <StatCard key={s.label} {...s} animate={animate} />
                  ))}
                </div>
              </Section>

              {/* ── Order Summary ── */}
              <Section delay={180}>
                <SectionHeading label="Order Pipeline" title="Order Summary" />
                <div
                  className="ia-grid-5"
                  style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14 }}
                >
                  {orderCards.map((c, i) => (
                    <div key={c.label} className="ia-card ia-order-card" style={{ animationDelay:`${i*60}ms` }}>
                      <p className="ia-order-label">{c.label}</p>
                      <p className="ia-order-value" style={{ color:c.color }}>{c.value}</p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* ── Charts ── */}
              <Section delay={260}>
                <SectionHeading label="Visualisations" title="Order & Delivery Charts" />
                <div
                  className="ia-grid-2"
                  style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}
                >
                  {/* Bar chart */}
                  <div className="ia-card ia-chart-card">
                    <div style={{ marginBottom:18 }}>
                      <p className="ia-eyebrow">Status breakdown</p>
                      <h3 style={{ margin:0, fontFamily:"'Lora',Georgia,serif", fontSize:18, fontWeight:700, color:"#0f172a" }}>
                        Order Status Overview
                      </h3>
                    </div>
                    <div style={{ height:280 }}>
                      {hasOrderData ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={orderStatusData} barCategoryGap="35%">
                            <XAxis dataKey="name" tick={{ fontSize:11, fill:"#94a3b8", fontFamily:"'DM Sans',system-ui" }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize:11, fill:"#94a3b8", fontFamily:"'DM Sans',system-ui" }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[10,10,0,0]}>
                              {orderStatusData.map((_, index) => (
                                <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyChart
                          text="No order data available yet"
                          sub="This chart will appear after orders move through the system."
                        />
                      )}
                    </div>
                  </div>

                  {/* Pie chart */}
                  <div className="ia-card ia-chart-card">
                    <div style={{ marginBottom:18 }}>
                      <p className="ia-eyebrow">Delivery performance</p>
                      <h3 style={{ margin:0, fontFamily:"'Lora',Georgia,serif", fontSize:18, fontWeight:700, color:"#0f172a" }}>
                        Delivery Distribution
                      </h3>
                    </div>
                    <div style={{ height:280 }}>
                      {hasDeliveryData ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={deliveryData} dataKey="value" nameKey="name"
                              cx="50%" cy="50%" outerRadius={95} innerRadius={45}
                              paddingAngle={4}
                              label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {deliveryData.map((_, index) => (
                                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                              iconType="circle"
                              iconSize={8}
                              formatter={(v) => <span style={{ fontSize:12, color:"#475569", fontFamily:"'DM Sans',system-ui" }}>{v}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyChart
                          text="No delivery data yet"
                          sub="Delivery insights will appear after trips are recorded."
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Section>

              {/* ── Insight cards ── */}
              <Section delay={340}>
                <SectionHeading label="Context" title="Platform Insights" />
                <div
                  className="ia-grid-2"
                  style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}
                >
                  <div className="ia-card ia-insight-card">
                    <h3 className="ia-insight-title">Platform Insight</h3>
                    <p className="ia-insight-body">
                      AGRIHUB-LK improves coordination between farmers, distributors, and
                      transporters. By tracking fulfilled orders and food distribution, the
                      platform provides measurable evidence of its contribution toward
                      reducing food access challenges across Sri Lanka.
                    </p>
                  </div>

                  <div className="ia-card ia-insight-card" style={{ background:"linear-gradient(145deg,#f0fdf4 0%,#fff 60%)" }}>
                    <h3 className="ia-insight-title">SDG Contribution</h3>
                    <p className="ia-insight-body">
                      This system contributes directly to <strong style={{ color:"#15803d" }}>SDG Goal 2: Zero Hunger</strong> by
                      helping food move more efficiently from producers to distribution points.
                      Better order handling, farmer approval workflows, and delivery tracking
                      reduce delays and strengthen the national food supply chain.
                    </p>
                  </div>
                </div>
              </Section>

            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ImpactAnalytics;