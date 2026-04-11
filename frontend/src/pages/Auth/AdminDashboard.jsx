// src/pages/Auth/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

function AdminDashboard() {
  const { user, token, isAuthReady, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    completedDeliveries: 0,
    successRate: 0,
    availableProducts: 0,
  });
  const navigate = useNavigate();

  const displayName = profile?.fullName || user?.fullName || "Admin";
  const displayRole = profile?.role || user?.role || "Admin";
  const initial = (displayName?.[0] || "A").toUpperCase();
  const isVerified = Boolean(profile?.isVerified ?? user?.isVerified);
  const formatNumber = (value) =>
    new Intl.NumberFormat().format(Number(value) || 0);

  const availabilityRate =
    dashboardStats.totalProducts > 0
      ? Math.round(
          (dashboardStats.availableProducts / dashboardStats.totalProducts) *
            100,
        )
      : 0;

  useEffect(() => {
    if (!isAuthReady) return;
    if (!token) {
      navigate("/login");
      return;
    }
    const role = profile?.role || user?.role;
    if (role && role !== "Admin") {
      navigate("/dashboard");
    }
    fetchDashboardStats();
  }, [token, user?.role, profile?.role, navigate, isAuthReady]);

  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await fetch("http://localhost:3000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || "Failed to load profile");
        }
        const data = await res.json();
        setProfile(data?.user || null);
      } catch (error) {
        toast.error(error?.message || "Failed to load profile");
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [token]);

  const fetchDashboardStats = async () => {
    if (!token) return;

    setStatsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [usersRes, impactRes, productRes, pendingRes] = await Promise.all([
        fetch("http://localhost:3000/api/auth/users", { headers }),
        fetch("http://localhost:3000/api/admin/impact-stats", { headers }),
        fetch("http://localhost:3000/api/products/stats/overview", { headers }),
        fetch(
          "http://localhost:3000/api/reviews/admin/moderation?status=Pending&limit=1",
          { headers },
        ),
      ]);

      const [usersData, impactData, productData, pendingData] =
        await Promise.all([
          usersRes.json().catch(() => ({})),
          impactRes.json().catch(() => ({})),
          productRes.json().catch(() => ({})),
          pendingRes.json().catch(() => ({})),
        ]);

      const totalUsers = usersRes.ok
        ? (usersData?.count ?? usersData?.users?.length ?? 0)
        : 0;
      const impactStats = impactRes.ok ? impactData?.stats || {} : {};
      const productStats = productRes.ok ? productData?.stats || {} : {};
      const pending = pendingRes.ok ? pendingData?.total || 0 : 0;

      setPendingReviewsCount(pending);
      setDashboardStats({
        totalUsers,
        totalOrders: impactStats.totalOrders || 0,
        totalProducts: productStats.totalProducts || 0,
        completedDeliveries: impactStats.completedDeliveries || 0,
        successRate: impactStats.successRate || 0,
        availableProducts: productStats.availableProducts || 0,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;
    logout();
    navigate("/");
  };

  const handleVerify = async () => {
    if (!profile?.email && !user?.email) {
      toast.error("Email not available for verification");
      return;
    }
    const email = profile?.email || user?.email;
    setRequestingOtp(true);
    try {
      const res = await fetch("http://localhost:3000/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to request OTP");
      }
      const body = await res.json().catch(() => ({}));
      toast.success(body?.message || "OTP sent to your email");
      navigate("/verify-email", { state: { email } });
    } catch (error) {
      toast.error(error?.message || "Failed to request OTP");
    } finally {
      setRequestingOtp(false);
    }
  };

  const adminLinks = [
    {
      title: "👥 Manage Users",
      to: "/admin/users",
      icon: "👥",
      description: "View and remove users",
    },
    {
      title: "🔔 Manage Notifications",
      to: "/admin/notifications",
      icon: "🔔",
      description: "Send and manage notifications",
    },
    {
      title: "⭐ Review Moderation",
      to: "/admin/reviews",
      icon: "⭐",
      description: `Approve or reject reviews (${pendingReviewsCount} pending)`,
    },
    {
      title: "👤 Manage Profile",
      to: "/profile",
      icon: "👤",
      description: "Update your profile",
    },
    {
      title: "✅ Verify Email",
      to: "/verify-email",
      icon: "✅",
      description: "Verify your account",
    },
    {
      title: "🔑 Reset Password",
      to: "/reset-password",
      icon: "🔑",
      description: "Change your password",
    },
    {
      title: "📊 Impact Analytics",
      to: "/admin/impact",
      icon: "📊",
      description: "View order summary and SDG impact",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">
              {initial}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-slate-900">
                  {displayName}
                </h1>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                  {displayRole}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                >
                  {isVerified ? "Verified" : "Pending Verification"}
                </span>
              </div>
              <p className="text-sm text-slate-600">
                Admin console for verification, user oversight, review
                moderation, and profile management.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isVerified && (
              <button
                onClick={handleVerify}
                className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                disabled={loadingProfile || requestingOtp}
              >
                {loadingProfile || requestingOtp
                  ? "Sending OTP..."
                  : "Verify Account"}
              </button>
            )}
            <button
              onClick={handleLogout}
              type="button"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Stats Card */}
          <div className="admin-stats-card relative overflow-hidden rounded-2xl bg-linear-to-r from-emerald-500 via-emerald-600 to-teal-600 p-6 text-white shadow-sm">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
                  System Snapshot
                </p>
                <p className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  <span className="admin-live-dot" />
                  Live Data
                </p>
              </div>

              <p className="mt-3 text-2xl font-bold md:text-3xl">
                Welcome, {displayName}
              </p>
              <p className="mt-1 text-sm opacity-85">
                Real-time operational metrics from users, orders, reviews, and products.
              </p>

              <div className="admin-metric-grid mt-5">
                <div className="admin-metric-card" style={{ "--delay": "0s" }}>
                  <p className="text-[11px] uppercase tracking-wide opacity-80">Users</p>
                  <p className="mt-1 text-2xl font-bold">{formatNumber(dashboardStats.totalUsers)}</p>
                </div>
                <div className="admin-metric-card" style={{ "--delay": "0.08s" }}>
                  <p className="text-[11px] uppercase tracking-wide opacity-80">Orders</p>
                  <p className="mt-1 text-2xl font-bold">{formatNumber(dashboardStats.totalOrders)}</p>
                </div>
                <div className="admin-metric-card" style={{ "--delay": "0.16s" }}>
                  <p className="text-[11px] uppercase tracking-wide opacity-80">Products</p>
                  <p className="mt-1 text-2xl font-bold">{formatNumber(dashboardStats.totalProducts)}</p>
                </div>
                <div className="admin-metric-card" style={{ "--delay": "0.24s" }}>
                  <p className="text-[11px] uppercase tracking-wide opacity-80">Pending Reviews</p>
                  <p className="mt-1 text-2xl font-bold">{formatNumber(pendingReviewsCount)}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                    <span>Delivery Success</span>
                    <span>{dashboardStats.successRate}%</span>
                  </div>
                  <div className="admin-progress-track">
                    <div
                      className="admin-progress-fill"
                      style={{ width: `${dashboardStats.successRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                    <span>Available Product Stock</span>
                    <span>{availabilityRate}%</span>
                  </div>
                  <div className="admin-progress-track">
                    <div className="admin-progress-fill" style={{ width: `${availabilityRate}%` }} />
                  </div>
                </div>

                <div className="pt-1 text-xs opacity-90">
                  {statsLoading
                    ? "Refreshing live metrics..."
                    : `Completed deliveries: ${formatNumber(dashboardStats.completedDeliveries)}`}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quick Actions
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  Admin Links
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {adminLinks.map((item) => (
                <Link
                  key={item.title}
                  to={item.to}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-emerald-200 hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <span>{item.title}</span>
                      <p className="text-xs text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-slate-400">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
