import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import ProfileNav from "../../components/ProfileNav";
import { useAuth } from "../../context/AuthContext";
import {
  fetchFarmerOrders,
  acceptFarmerOrder,
  rejectFarmerOrder,
} from "../../api/orders";

const FarmerOrders = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (user?.role !== "Farmer") {
      toast.error("Only farmers can view incoming orders");
      navigate("/dashboard");
      return;
    }

    void loadOrders();
  }, [token, user?.role, pagination.page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchFarmerOrders(token, pagination.page, pagination.limit);
      setOrders(data?.orders || []);
      setPagination((prev) => ({
        ...prev,
        total: data?.total || 0,
        pages: data?.pages || 0,
      }));
    } catch (error) {
      toast.error(error.message || "Failed to load farmer orders");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      setProcessingId(orderId);
      await acceptFarmerOrder(token, orderId);
      toast.success("Order accepted");
      void loadOrders();
    } catch (error) {
      toast.error(error.message || "Failed to accept order");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (orderId) => {
    const confirmed = window.confirm(
      "Reject this order? This will cancel the order and restore product stock."
    );
    if (!confirmed) return;

    try {
      setProcessingId(orderId);
      await rejectFarmerOrder(token, orderId);
      toast.success("Order rejected");
      void loadOrders();
    } catch (error) {
      toast.error(error.message || "Failed to reject order");
    } finally {
      setProcessingId(null);
    }
  };

  const summary = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.total += 1;
        if (order.status === "Awaiting Farmer Approval") acc.awaiting += 1;
        if (order.status === "Confirmed") acc.confirmed += 1;
        if (order.status === "Cancelled") acc.cancelled += 1;
        acc.value += Number(order.totalPrice || 0);
        return acc;
      },
      { total: 0, awaiting: 0, confirmed: 0, cancelled: 0, value: 0 }
    );
  }, [orders]);

  return (
    <>
      <ProfileNav
        active="orders"
        links={[
          { key: "orders", label: "Incoming Orders", to: "/farmer-orders" },
          { key: "products", label: "My Products", to: "/my-products" },
          { key: "chat", label: "Messages", to: "/chat" },
        ]}
      />

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Incoming Orders</h1>
              <p className="text-slate-600">
                Review paid orders and accept or reject them before transport starts
              </p>
            </div>
            <Link
              to="/my-products"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              View My Products
            </Link>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">Awaiting Approval</p>
              <p className="text-2xl font-bold text-amber-600">{summary.awaiting}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">Confirmed</p>
              <p className="text-2xl font-bold text-emerald-600">{summary.confirmed}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">Value (LKR)</p>
              <p className="text-2xl font-bold text-slate-900">
                {summary.value.toLocaleString()}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-slate-500">Loading incoming orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-slate-600">No paid orders available for approval.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const canDecide =
                  order.paymentStatus === "paid" &&
                  order.status === "Awaiting Farmer Approval";

                return (
                  <div
                    key={order._id}
                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="w-full md:w-auto">
                        {order.product?.images && order.product.images.length > 0 ? (
                          <img
                            src={order.product.images[0]}
                            alt={order.product?.productName || "Product"}
                            className="h-32 w-32 rounded-xl object-cover shadow-sm"
                          />
                        ) : (
                          <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-slate-200">
                            <span className="text-sm text-slate-400">No image</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {order.product?.productName || "Product"}
                        </h3>
                        <p className="text-xs text-slate-500">Order ID: {order._id}</p>
                        <p className="text-sm text-slate-700">
                          Distributor:{" "}
                          <span className="font-semibold">
                            {order.distributor?.fullName || "N/A"}
                          </span>
                        </p>
                        <p className="text-sm text-slate-700">
                          Qty:{" "}
                          <span className="font-semibold">{order.quantity}</span>{" "}
                          {order.product?.unit || "kg"}
                        </p>
                        <p className="text-sm text-slate-700">
                          Amount:{" "}
                          <span className="font-semibold">
                            LKR {Number(order.totalPrice || 0).toLocaleString()}
                          </span>
                        </p>
                        <p className="text-sm text-slate-700">
                          Delivery: {order.deliveryAddress?.addressLine || "N/A"},{" "}
                          {order.deliveryAddress?.city || "N/A"}
                        </p>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            Status: {order.status || "Pending"}
                          </span>
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                            Delivery: {order.deliveryStatus || "Pending"}
                          </span>
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            Payment: {order.paymentStatus || "unpaid"}
                          </span>
                        </div>
                      </div>

                      <div className="w-full max-w-sm space-y-3">
                        {canDecide ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(order._id)}
                              disabled={processingId === order._id}
                              className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(order._id)}
                              disabled={processingId === order._id}
                              className="flex-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            This order has already been processed.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1}
                className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.pages, prev.page + 1),
                  }))
                }
                disabled={pagination.page === pagination.pages}
                className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FarmerOrders;