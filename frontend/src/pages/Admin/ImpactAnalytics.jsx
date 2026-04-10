import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const ImpactAnalytics = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/api/admin/impact-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load impact stats");
      }

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
      toast.error(error.message || "Failed to load impact analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (user?.role && user.role !== "Admin") {
      toast.error("Only admins can access this page");
      navigate("/dashboard");
      return;
    }

    fetchStats();
  }, [token, user?.role, navigate]);

  const orderStatusData = [
    { name: "Pending", value: stats?.pendingOrders || 0 },
    {
      name: "Awaiting Farmer",
      value: stats?.awaitingFarmerApprovalOrders || 0,
    },
    { name: "Confirmed", value: stats?.confirmedOrders || 0 },
    { name: "Cancelled", value: stats?.cancelledOrders || 0 },
  ];

  const deliveryData = [
    { name: "Delivered", value: stats?.completedDeliveries || 0 },
    {
      name: "Other Orders",
      value: Math.max(
        (stats?.totalOrders || 0) - (stats?.completedDeliveries || 0),
        0,
      ),
    },
  ];

  const hasOrderChartData = orderStatusData.some((item) => item.value > 0);
  const hasDeliveryChartData = deliveryData.some((item) => item.value > 0);

  const BAR_COLORS = ["#f59e0b", "#fb923c", "#10b981", "#ef4444"];
  const PIE_COLORS = ["#10b981", "#94a3b8"];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            to="/admin-dashboard"
            className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:underline"
          >
            ← Back to Admin Dashboard
          </Link>
        </div>

        <div className="mb-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
            🌾 Zero Hunger Impact (SDG 2)
          </p>
          <h1 className="mt-2 text-3xl font-bold">Impact Analytics</h1>
          <p className="mt-2 max-w-3xl text-sm opacity-90">
            AGRIHUB-LK supports Zero Hunger by improving food distribution
            between farmers, distributors, and transporters. This page shows
            order flow, delivery performance, and the measurable impact of the
            platform.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-500">Loading impact analytics...</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                SDG Impact Summary
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs uppercase text-slate-500">
                    Food Distributed
                  </p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">
                    {stats?.totalFoodDistributed || 0} kg
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs uppercase text-slate-500">
                    Completed Deliveries
                  </p>
                  <p className="mt-2 text-2xl font-bold text-sky-600">
                    {stats?.completedDeliveries || 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs uppercase text-slate-500">
                    Active Farmers
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-600">
                    {stats?.activeFarmers || 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs uppercase text-slate-500">
                    Success Rate
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {stats?.successRate || 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Order Summary
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs uppercase text-slate-500">
                    Total Orders
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {stats?.totalOrders || 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs uppercase text-slate-500">Pending</p>
                  <p className="mt-2 text-2xl font-bold text-amber-500">
                    {stats?.pendingOrders || 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs uppercase text-slate-500">
                    Awaiting Farmer
                  </p>
                  <p className="mt-2 text-2xl font-bold text-orange-500">
                    {stats?.awaitingFarmerApprovalOrders || 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs uppercase text-slate-500">Confirmed</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">
                    {stats?.confirmedOrders || 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs uppercase text-slate-500">Cancelled</p>
                  <p className="mt-2 text-2xl font-bold text-red-600">
                    {stats?.cancelledOrders || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                  Order Status Overview
                </h2>

                <div className="h-[320px]">
                  {hasOrderChartData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={orderStatusData}>
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {orderStatusData.map((entry, index) => (
                            <Cell
                              key={`bar-cell-${index}`}
                              fill={BAR_COLORS[index % BAR_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          No order data available yet
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          This chart will appear after orders move through the
                          system.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                  Delivery Distribution
                </h2>

                <div className="h-[320px]">
                  {hasDeliveryChartData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deliveryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={95}
                          label
                        >
                          {deliveryData.map((entry, index) => (
                            <Cell
                              key={`pie-cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          No delivery data available yet
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Delivery insights will appear after trips and
                          deliveries are recorded.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">
                  Platform Insight
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  AGRIHUB-LK improves coordination between farmers,
                  distributors, and transporters. By tracking fulfilled orders
                  and food distribution, the platform provides measurable
                  evidence of its contribution toward reducing food access
                  challenges.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">
                  SDG Contribution
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  This system contributes to SDG Goal 2: Zero Hunger by helping
                  food move more efficiently from producers to distribution
                  points. Better order handling, farmer approval, and delivery
                  tracking reduce delays and strengthen the food supply chain.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImpactAnalytics;
