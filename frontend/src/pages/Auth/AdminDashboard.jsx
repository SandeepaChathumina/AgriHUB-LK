// src/pages/Auth/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import AdminFooter from "../Admin/AdminFooter";
// import AdminFooter from "../../pages/Admin/AdminFooter"; // Uncomment if needed
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";

/* ── Google Font ──────────────────────────────────────────────────────── */
if (!document.head.querySelector('[href*="Outfit"]')) {
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap";
  document.head.appendChild(l);
}

/* ── Design Tokens & CSS ───────────────────────────────────────────────── */
const CSS = `
  :root{
    --green-900:#064e3b; --green-800:#065f46; --green-700:#047857;
    --green-600:#059669; --green-500:#10b981; --green-400:#34d399;
    --green-300:#6ee7b7; --green-100:#d1fae5; --green-50:#ecfdf5;
    --slate-900:#0f172a; --slate-800:#1e293b; --slate-700:#334155;
    --slate-500:#64748b; --slate-400:#94a3b8; --slate-300:#cbd5e1; --slate-200:#e2e8f0;
    --slate-100:#f1f5f9; --slate-50:#f8fafc;
    --white:#ffffff;
    --amber:#f59e0b; --red:#ef4444; --blue:#3b82f6;
    --shadow-sm:0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);
    --shadow:0 4px 16px rgba(6,78,59,0.08),0 1px 3px rgba(0,0,0,0.04);
    --shadow-lg:0 12px 40px rgba(6,78,59,0.14),0 4px 12px rgba(0,0,0,0.05);
    --radius:14px; --radius-sm:9px; --radius-xs:6px;
    --font:'Outfit',sans-serif; --mono:'DM Mono',monospace;
  }

  /* ── Reset / Base ── */
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  a { text-decoration:none; color:inherit; }
  button { cursor:pointer; font-family:var(--font); }

  /* ── Shell ── */
  .ad { display:flex; min-height:100vh; background:var(--slate-50); font-family:var(--font); }

  /* ══════════════ SIDEBAR (Professional Deep Theme) ══════════════ */
  .ad-side {
    width:256px; min-width:256px; 
    background:var(--green-900); /* Deep, premium dark background */
    display:flex; flex-direction:column;
    position:fixed; top:0; left:0; bottom:0; z-index:200;
    box-shadow: 4px 0 24px rgba(6, 78, 59, 0.15); /* Soft depth shadow */
  }

  /* Logo */
  .ad-logo {
    padding:24px;
    border-bottom:1px solid rgba(255, 255, 255, 0.08);
    display:flex; align-items:center; gap:12px;
  }
  .ad-logo-mark {
    width:40px; height:40px; border-radius:10px;
    background:linear-gradient(135deg, var(--green-400), var(--green-600));
    display:flex; align-items:center; justify-content:center;
    font-size:18px; font-weight:900; color:#fff; flex-shrink:0;
    box-shadow:0 4px 12px rgba(16,185,129,0.25);
  }
  .ad-logo-name { font-size:18px; font-weight:800; color:var(--white); letter-spacing:-0.02em; }
  .ad-logo-name em { color:var(--green-400); font-style:normal; }
  .ad-logo-tag { 
    font-size:9.5px; font-weight:700; color:var(--green-300);
    text-transform:uppercase; letter-spacing:0.12em; margin-top:2px; opacity:0.85; 
  }

  /* Nav */
  .ad-nav { flex:1; padding:24px 16px; overflow-y:auto; }
  .ad-nav-section { margin-bottom:32px; }
  .ad-nav-label {
    font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em;
    color:var(--green-300); opacity:0.6; padding:0 12px; margin-bottom:10px; display:block;
  }
  .ad-nav-link {
    display:flex; align-items:center; gap:10px; padding:10px 16px; border-radius:var(--radius-sm);
    font-size:13.5px; font-weight:500; color:var(--slate-300);
    transition:all 0.2s ease; margin-bottom:4px; position:relative;
  }
  .ad-nav-link:hover { background:rgba(255, 255, 255, 0.06); color:var(--white); }
  .ad-nav-link.active {
    background:rgba(16, 185, 129, 0.15); color:var(--white); font-weight:600;
  }
  .ad-nav-link.active::before {
    content:''; position:absolute; left:0; top:20%; bottom:20%;
    width:3px; border-radius:999px; background:var(--green-400);
  }
  .ad-nav-badge {
    margin-left:auto; background:var(--amber); color:var(--slate-900);
    font-size:10px; font-weight:800; padding:2px 8px; border-radius:999px; min-width:20px; text-align:center;
  }

  /* Sidebar footer */
  .ad-side-foot { 
    padding:16px; border-top:1px solid rgba(255, 255, 255, 0.08); 
    background:rgba(0, 0, 0, 0.15); 
  }
  .ad-user-tile {
    display:flex; align-items:center; gap:12px; padding:10px 12px;
    border-radius:var(--radius-sm); transition: background 0.2s;
  }
  .ad-user-tile:hover { background:rgba(255, 255, 255, 0.04); }
  .ad-ava {
    width:36px; height:36px; border-radius:50%;
    background:var(--slate-800); border:2px solid var(--green-600);
    display:flex; align-items:center; justify-content:center;
    font-size:14px; font-weight:800; color:var(--white); flex-shrink:0;
  }
  .ad-user-name { font-size:13.5px; font-weight:600; color:var(--white); }
  .ad-user-role { font-size:11px; color:var(--green-400); font-weight:500; margin-top:2px; }
  .ad-logout {
    margin-left:auto; background:rgba(255, 255, 255, 0.06); border:none;
    width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center;
    font-size:16px; color:var(--slate-300); transition:all 0.15s;
  }
  .ad-logout:hover { background:var(--red); color:var(--white); }

  /* ══════════════ MAIN ══════════════ */
  .ad-main { margin-left:256px; flex:1; display:flex; flex-direction:column; }

  /* ══════════════ CONTENT ══════════════ */
  .ad-body { padding:26px 30px; flex:1; }

  /* Verify Banner */
  .ad-banner {
    background:linear-gradient(90deg,#fffbeb,#fef9ee);
    border:1.5px solid #fcd34d; border-radius:12px;
    padding:13px 20px; display:flex; align-items:center;
    justify-content:space-between; gap:12px; margin-bottom:24px;
  }
  .ad-banner-text { font-size:13px; font-weight:500; color:#78350f; }
  .ad-banner-btn {
    background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; border:none;
    border-radius:var(--radius-xs); padding:7px 18px; font-size:12.5px;
    font-weight:700; transition:opacity 0.15s; white-space:nowrap;
  }
  .ad-banner-btn:hover { opacity:0.88; }

  /* ── Stat Cards ── */
  .ad-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; margin-bottom:24px; }
  @media(max-width:960px){ .ad-stats{ grid-template-columns:repeat(2,1fr); } }

  .ad-stat {
    background:var(--white); border-radius:var(--radius); padding:22px 24px;
    border:1.5px solid var(--slate-100); transition:all 0.2s;
    position:relative; overflow:hidden;
  }
  .ad-stat::after {
    content:''; position:absolute; top:0; left:0; right:0; height:3px;
    background:linear-gradient(90deg,var(--green-400),var(--green-600));
    opacity:0; transition:opacity 0.2s;
  }
  .ad-stat:hover { box-shadow:var(--shadow-lg); transform:translateY(-3px); border-color:var(--green-100); }
  .ad-stat:hover::after { opacity:1; }

  .ad-stat-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:14px; }
  .ad-stat-lbl { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--slate-400); }
  .ad-stat-ico {
    width:42px; height:42px; border-radius:10px;
    display:flex; align-items:center; justify-content:center; font-size:20px;
  }
  .ad-stat-val {
    font-size:32px; font-weight:800; color:var(--slate-900);
    letter-spacing:-0.04em; font-family:var(--mono); line-height:1;
  }
  .ad-stat-val.green { color:var(--green-600); }
  .ad-stat-val.amber { color:var(--amber); }
  .ad-stat-foot { margin-top:8px; font-size:11.5px; color:var(--slate-400); font-weight:500; }
  .ad-stat-foot .up { color:var(--green-600); font-weight:700; }
  .ad-stat-foot .warn { color:var(--amber); font-weight:700; }

  /* ── Bottom grid ── */
  .ad-grid { display:grid; grid-template-columns:1fr 340px; gap:20px; }
  @media(max-width:1080px){ .ad-grid{ grid-template-columns:1fr; } }

  /* Card shell */
  .ad-card {
    background:var(--white); border-radius:var(--radius);
    border:1.5px solid var(--slate-100); overflow:hidden;
    box-shadow:var(--shadow-sm);
  }
  .ad-card-head {
    padding:20px 24px 14px; border-bottom:1px solid var(--slate-100);
    display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;
  }
  .ad-card-title { font-size:14.5px; font-weight:800; color:var(--slate-900); }
  .ad-card-sub { font-size:11.5px; color:var(--slate-400); margin-top:2px; font-weight:500; }

  /* Tabs */
  .ad-tabs { display:flex; gap:3px; background:var(--slate-100); border-radius:8px; padding:3px; }
  .ad-tab {
    padding:5px 14px; border-radius:6px; font-size:12px; font-weight:600;
    color:var(--slate-500); background:none; border:none; transition:all 0.15s;
  }
  .ad-tab.on { background:var(--white); color:var(--green-700); box-shadow:var(--shadow-sm); }
  .ad-tab:hover:not(.on) { color:var(--slate-700); }

  /* Time pills */
  .ad-pills { display:flex; gap:4px; }
  .ad-pill {
    padding:4px 12px; border-radius:var(--radius-xs); font-size:11.5px; font-weight:600;
    color:var(--slate-500); border:1.5px solid var(--slate-200); background:var(--white);
    transition:all 0.15s;
  }
  .ad-pill.on { background:var(--green-600); color:#fff; border-color:var(--green-600); }
  .ad-pill:hover:not(.on) { border-color:var(--green-300); color:var(--green-700); }

  /* Live badge */
  .ad-live {
    display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:700;
    color:var(--green-700); background:var(--green-50); border:1.5px solid var(--green-200);
    padding:3px 10px; border-radius:999px;
  }
  .ad-live-dot {
    width:6px; height:6px; border-radius:50%; background:var(--green-500);
    animation:lp 1.8s ease-in-out infinite;
  }
  @keyframes lp{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.7)} }

  /* Chart area */
  .ad-chart { padding:20px 24px 8px; }

  /* Progress bars */
  .ad-prog-area { padding:4px 24px 20px; }
  .ad-prog-row { display:flex; align-items:center; gap:14px; margin-bottom:14px; }
  .ad-prog-lbl { font-size:12px; font-weight:600; color:var(--slate-600); width:170px; flex-shrink:0; }
  .ad-prog-track { flex:1; height:8px; border-radius:999px; background:var(--green-50); overflow:hidden; border:1px solid var(--green-100); }
  .ad-prog-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,var(--green-400),var(--green-600)); transition:width 1s cubic-bezier(.16,1,.3,1); }
  .ad-prog-pct { font-size:12px; font-weight:700; color:var(--slate-700); width:38px; text-align:right; font-family:var(--mono); }

  /* Quick links */
  .ad-qlink {
    display:flex; align-items:center; gap:12px; padding:13px 20px;
    border-bottom:1px solid var(--slate-50); transition:all 0.12s; cursor:pointer;
  }
  .ad-qlink:last-child { border-bottom:none; }
  .ad-qlink:hover { background:var(--green-50); }
  .ad-qlink-num {
    width:26px; height:26px; border-radius:7px;
    display:flex; align-items:center; justify-content:center;
    font-size:11px; font-weight:800; flex-shrink:0;
  }
  .ad-qlink-num.top { background:var(--green-600); color:#fff; }
  .ad-qlink-num.mid { background:var(--green-100); color:var(--green-800); }
  .ad-qlink-num.lo  { background:var(--slate-100); color:var(--slate-500); }
  .ad-qlink-ico {
    width:34px; height:34px; border-radius:9px; background:var(--slate-50);
    border:1px solid var(--slate-100); display:flex; align-items:center; justify-content:center;
    font-size:15px; flex-shrink:0; transition:all 0.15s;
  }
  .ad-qlink:hover .ad-qlink-ico { background:var(--green-100); border-color:var(--green-200); }
  .ad-qlink-name { font-size:13px; font-weight:700; color:var(--slate-800); }
  .ad-qlink-desc { font-size:11px; color:var(--slate-400); margin-top:1px; font-weight:500; }
  .ad-qlink-chip {
    background:var(--amber); color:#fff; font-size:10px; font-weight:700;
    padding:1px 7px; border-radius:999px; margin-left:6px;
  }
  .ad-qlink-val { font-size:12.5px; font-weight:700; color:var(--green-700); font-family:var(--mono); margin-left:auto; }
  .ad-qlink-arr { color:var(--slate-300); font-size:16px; margin-left:6px; transition:all 0.15s; }
  .ad-qlink:hover .ad-qlink-arr { color:var(--green-500); transform:translateX(3px); }
`;

/* ── Custom Tooltip ──────────────────────────────────────────────────── */
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:"#fff", borderRadius:10, padding:"10px 14px",
      border:"1.5px solid #d1fae5", boxShadow:"0 8px 24px rgba(6,78,59,0.12)",
      fontFamily:"'Outfit',sans-serif",
    }}>
      <p style={{ color:"#059669", fontSize:11, fontWeight:700, marginBottom:5 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color:"#334155", fontSize:12, fontWeight:600 }}>
          {p.name}:{" "}
          <span style={{ color: p.color, fontFamily:"'DM Mono',monospace" }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

/* ── Mock trend data ─────────────────────────────────────────────────── */
const TREND = [
  { m:"Jul", orders:32, products:18 }, { m:"Aug", orders:45, products:24 },
  { m:"Sep", orders:28, products:19 }, { m:"Oct", orders:56, products:31 },
  { m:"Nov", orders:38, products:22 }, { m:"Dec", orders:67, products:40 },
  { m:"Jan", orders:42, products:28 }, { m:"Feb", orders:74, products:45 },
  { m:"Mar", orders:58, products:36 }, { m:"Apr", orders:81, products:52 },
];

/* ════════════════════════════════════════════════════════════════════════ */
function AdminDashboard() {
  const { user, token, isAuthReady, logout } = useAuth();
  const [profile,             setProfile]            = useState(null);
  const [loadingProfile,      setLoadingProfile]      = useState(false);
  const [requestingOtp,       setRequestingOtp]       = useState(false);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [statsLoading,        setStatsLoading]        = useState(false);
  const [activeTab,           setActiveTab]           = useState("Orders");
  const [activeTime,          setActiveTime]          = useState("Year");
  const [dashboardStats,      setDashboardStats]      = useState({
    totalUsers: 0, totalOrders: 0, totalProducts: 0,
    completedDeliveries: 0, successRate: 0, availableProducts: 0,
  });
  const navigate = useNavigate();

  const displayName = profile?.fullName || user?.fullName || "Admin";
  const displayRole = profile?.role     || user?.role     || "Admin";
  const initial     = (displayName?.[0] || "A").toUpperCase();
  const isVerified  = Boolean(profile?.isVerified ?? user?.isVerified);
  const fmt = (v) => new Intl.NumberFormat().format(Number(v) || 0);
  const availRate = dashboardStats.totalProducts > 0
    ? Math.round((dashboardStats.availableProducts / dashboardStats.totalProducts) * 100) : 0;

  useEffect(() => {
    if (!isAuthReady) return;
    if (!token) { navigate("/login"); return; }
    const role = profile?.role || user?.role;
    if (role && role !== "Admin") navigate("/dashboard");
    fetchStats();
  }, [token, user?.role, profile?.role, navigate, isAuthReady]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoadingProfile(true);
      try {
        const r = await fetch("http://localhost:3000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message);
        setProfile((await r.json())?.user || null);
      } catch (e) { toast.error(e?.message || "Failed to load profile"); }
      finally { setLoadingProfile(false); }
    })();
  }, [token]);

  const fetchStats = async () => {
    if (!token) return;
    setStatsLoading(true);
    try {
      const h = { Authorization: `Bearer ${token}` };
      const [uR, iR, pR, rR] = await Promise.all([
        fetch("http://localhost:3000/api/auth/users", { headers: h }),
        fetch("http://localhost:3000/api/admin/impact-stats", { headers: h }),
        fetch("http://localhost:3000/api/products/stats/overview", { headers: h }),
        fetch("http://localhost:3000/api/reviews/admin/moderation?status=Pending&limit=1", { headers: h }),
      ]);
      const [uD, iD, pD, rD] = await Promise.all([uR, iR, pR, rR].map(r => r.json().catch(() => ({}))));
      const imp = iR.ok ? iD?.stats || {} : {};
      const prod = pR.ok ? pD?.stats || {} : {};
      setPendingReviewsCount(rR.ok ? rD?.total || 0 : 0);
      setDashboardStats({
        totalUsers:          uR.ok ? (uD?.count ?? uD?.users?.length ?? 0) : 0,
        totalOrders:         imp.totalOrders || 0,
        totalProducts:       prod.totalProducts || 0,
        completedDeliveries: imp.completedDeliveries || 0,
        successRate:         imp.successRate || 0,
        availableProducts:   prod.availableProducts || 0,
      });
    } catch (e) { console.error(e); }
    finally { setStatsLoading(false); }
  };

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    logout(); navigate("/");
  };

  const handleVerify = async () => {
    const email = profile?.email || user?.email;
    if (!email) { toast.error("Email not available"); return; }
    setRequestingOtp(true);
    try {
      const r = await fetch("http://localhost:3000/api/auth/request-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message);
      toast.success((await r.json().catch(() => ({}))).message || "OTP sent");
      navigate("/verify-email", { state: { email } });
    } catch (e) { toast.error(e?.message || "Failed"); }
    finally { setRequestingOtp(false); }
  };

  /* ── Static data ── */
  const statCards = [
    {
      label: "Total Users", value: fmt(dashboardStats.totalUsers),
      icon: "👥", bg: "var(--green-50)",
      sub: "Registered accounts",
    },
    {
      label: "Total Orders", value: fmt(dashboardStats.totalOrders),
      icon: "📦", bg: "#eff6ff",
      sub: `${fmt(dashboardStats.completedDeliveries)} completed`,
    },
    {
      label: "Products Listed", value: fmt(dashboardStats.totalProducts),
      icon: "🌾", bg: "var(--green-50)",
      sub: `${availRate}% available stock`,
    },
    {
      label: "Pending Reviews", value: fmt(pendingReviewsCount),
      icon: "⭐", bg: "#fffbeb",
      sub: pendingReviewsCount > 0 ? "Needs attention" : "All clear",
      accent: pendingReviewsCount > 0 ? "amber" : "green",
    },
  ];

  const quickLinks = [
    { n:1, icon:"👥", name:"User Management",  desc:"View and remove users",        val:fmt(dashboardStats.totalUsers),   to:"/admin/users" },
    { n:2, icon:"⭐", name:"Review Moderation", desc:"Pending approvals",             val:fmt(pendingReviewsCount),         to:"/admin/reviews", badge:pendingReviewsCount||null },
    { n:3, icon:"📊", name:"Impact Analytics",  desc:"SDG Zero Hunger metrics",       val:`${dashboardStats.successRate}%`, to:"/admin/impact" },
    { n:4, icon:"🔔", name:"Notifications",     desc:"Send platform alerts",          val:"",                               to:"/admin/notifications" },
    { n:5, icon:"👤", name:"Profile Settings",  desc:"Update admin profile",          val:"",                               to:"/profile" },
    { n:6, icon:"✅", name:"Verify Email",      desc:isVerified?"Verified":"Pending", val:"",                               to:"/verify-email" },
  ];

  // Sidebar navigation – icons removed for cleaner professional look
  const navMain = [
    { label:"Dashboard",         to:"/admin-dashboard",               active:true },
    { label:"User Management",   to:"/admin/users" },
    { label:"Review Moderation", to:"/admin/reviews",       badge:pendingReviewsCount||null },
    { label:"Notifications",     to:"/admin/notifications" },
    { label:"Impact Analytics",  to:"/admin/impact" },
  ];
  const navAccount = [
    { label:"Profile Settings", to:"/profile" }
  ];

  const chartKey   = activeTab === "Orders" ? "orders" : "products";
  const chartColor = activeTab === "Orders" ? "#3b82f6" : "#10b981";

  /* ══ RENDER ══════════════════════════════════════════════════════════ */
  return (
    <>
    <div className="ad">
      <style>{CSS}</style>

      {/* ══ SIDEBAR – High Contrast Dark Theme ═══════════════ */}
      <aside className="ad-side">

        {/* Logo */}
        <div className="ad-logo">
          <div className="ad-logo-mark">A</div>
          <div>
            <div className="ad-logo-name">AgriHUB<em>.LK</em></div>
            <div className="ad-logo-tag">SDG Zero Hunger</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="ad-nav">
          <div className="ad-nav-section">
            <span className="ad-nav-label">Main</span>
            {navMain.map(n => (
              <Link key={n.to} to={n.to} className={`ad-nav-link ${n.active ? "active" : ""}`}>
                {n.label}
                {n.badge ? <span className="ad-nav-badge">{n.badge}</span> : null}
              </Link>
            ))}
          </div>
          <div className="ad-nav-section">
            <span className="ad-nav-label">Account</span>
            {navAccount.map(n => (
              <Link key={n.to} to={n.to} className="ad-nav-link">
                {n.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="ad-side-foot">
          <div className="ad-user-tile">
            <div className="ad-ava">{initial}</div>
            <div>
              <div className="ad-user-name">{displayName}</div>
              <div className="ad-user-role">{displayRole}</div>
            </div>
            <button className="ad-logout" onClick={handleLogout} title="Sign Out">⏻</button>
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══════════════════════════════════════════════════════ */}
      <main className="ad-main">

        {/* Body */}
        <div className="ad-body">

          {/* Verify banner */}
          {!isVerified && (
            <div className="ad-banner">
              <span className="ad-banner-text">
                ⚠ Your account email is not verified. Verify to unlock all admin features.
              </span>
              <button className="ad-banner-btn" onClick={handleVerify} disabled={requestingOtp}>
                {requestingOtp ? "Sending OTP…" : "Verify Account →"}
              </button>
            </div>
          )}

          {/* Stat cards */}
          <div className="ad-stats">
            {statCards.map(s => (
              <div className="ad-stat" key={s.label}>
                <div className="ad-stat-head">
                  <span className="ad-stat-lbl">{s.label}</span>
                  <div className="ad-stat-ico" style={{ background: s.bg }}>{s.icon}</div>
                </div>
                <div className={`ad-stat-val ${s.accent || ""}`}>
                  {statsLoading ? "—" : s.value}
                </div>
                <div className="ad-stat-foot">
                  <span className={s.accent === "amber" ? "warn" : s.accent === "green" ? "up" : ""}>
                    {s.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom grid */}
          <div className="ad-grid">

            {/* Chart card */}
            <div className="ad-card">
              <div className="ad-card-head">
                <div>
                  <div className="ad-card-title">Platform Activity Trend</div>
                  <div className="ad-card-sub">Monthly orders &amp; product listing overview</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <div className="ad-tabs">
                    {["Orders", "Products"].map(t => (
                      <button key={t} className={`ad-tab ${activeTab === t ? "on" : ""}`}
                        onClick={() => setActiveTab(t)}>{t}</button>
                    ))}
                  </div>
                  <div className="ad-pills">
                    {["Week", "Month", "Year"].map(t => (
                      <button key={t} className={`ad-pill ${activeTime === t ? "on" : ""}`}
                        onClick={() => setActiveTime(t)}>All {t}</button>
                    ))}
                  </div>
                  <span className="ad-live">
                    <span className="ad-live-dot" />Live
                  </span>
                </div>
              </div>

              <div className="ad-chart">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={TREND} barSize={22} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="m"
                      tick={{ fontSize:11, fontFamily:"'Outfit',sans-serif", fill:"#94a3b8" }}
                      axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize:11, fontFamily:"'Outfit',sans-serif", fill:"#94a3b8" }}
                      axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} cursor={{ fill:"rgba(16,185,129,0.06)", radius:4 }} />
                    <Bar dataKey={chartKey} name={activeTab} fill={chartColor} radius={[5,5,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="ad-prog-area">
                <div className="ad-prog-row">
                  <span className="ad-prog-lbl">Delivery Success Rate</span>
                  <div className="ad-prog-track">
                    <div className="ad-prog-fill" style={{ width:`${dashboardStats.successRate}%` }} />
                  </div>
                  <span className="ad-prog-pct">{dashboardStats.successRate}%</span>
                </div>
                <div className="ad-prog-row">
                  <span className="ad-prog-lbl">Available Stock</span>
                  <div className="ad-prog-track">
                    <div className="ad-prog-fill" style={{ width:`${availRate}%` }} />
                  </div>
                  <span className="ad-prog-pct">{availRate}%</span>
                </div>
              </div>
            </div>

            {/* Quick links card */}
            <div className="ad-card">
              <div className="ad-card-head">
                <div>
                  <div className="ad-card-title">Admin Modules</div>
                  <div className="ad-card-sub">Quick access ranking</div>
                </div>
              </div>
              <div>
                {quickLinks.map((item, i) => (
                  <Link key={item.to} to={item.to} className="ad-qlink">
                    <div className={`ad-qlink-num ${i < 3 ? "top" : i < 5 ? "mid" : "lo"}`}>{item.n}</div>
                    <div className="ad-qlink-ico">{item.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="ad-qlink-name">
                        {item.name}
                        {item.badge ? <span className="ad-qlink-chip">{item.badge}</span> : null}
                      </div>
                      <div className="ad-qlink-desc">{item.desc}</div>
                    </div>
                    {item.val && <span className="ad-qlink-val">{item.val}</span>}
                    <span className="ad-qlink-arr">›</span>
                  </Link>
                ))}
              </div>
            </div>

          </div>{/* /ad-grid */}
        </div>{/* /ad-body */}
      </main>
      
    </div>

    </>
  );
}

export default AdminDashboard;