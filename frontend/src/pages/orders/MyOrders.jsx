import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import ProfileNav from "../../components/ProfileNav";
import { useAuth } from "../../context/AuthContext";
import {
  cancelMyOrder,
  fetchMyOrders,
  updateMyOrder,
  retryPayment,
} from "../../api/orders";

const EDITABLE_STATUSES = ["Pending", "Confirmed", "Shipped", "Cancelled"];

const MyOrders = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editForm, setEditForm] = useState({ quantity: "", status: "" });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (user?.role !== "Distributor") {
      toast.error("Only distributors can view orders");
      navigate("/dashboard");
      return;
    }

    void loadOrders();
  }, [token, user?.role, pagination.page]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (!payment) return;

    const orderId = searchParams.get("orderId");

    if (payment === "success") {
      toast.success(
        orderId
          ? `Payment successful. Order ID: ${orderId}`
          : "Payment successful",
      );
    } else if (payment === "failed") {
      toast.error("Payment was not completed");
    } else if (payment === "cancelled") {
      toast("Payment was cancelled");
    } else {
      toast.error("Payment verification failed");
    }

    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchMyOrders(
        token,
        pagination.page,
        pagination.limit,
      );
      setOrders(data?.orders || []);
      setPagination((prev) => ({
        ...prev,
        total: data?.total || 0,
        pages: data?.pages || 0,
      }));
    } catch (error) {
      toast.error(error.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (order) => {
    setEditingOrderId(order._id);
    setEditForm({
      quantity: String(order.quantity || ""),
      status: order.status || "Pending",
    });
  };

  const stopEdit = () => {
    setEditingOrderId(null);
    setEditForm({ quantity: "", status: "" });
  };

  const submitEdit = async (orderId) => {
    const quantity = Number(editForm.quantity);

    if (!Number.isFinite(quantity) || quantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }

    try {
      const payload = {
        quantity,
        status: editForm.status,
      };

      const data = await updateMyOrder(token, orderId, payload);
      const updatedOrder = data?.order;

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, ...updatedOrder } : order,
        ),
      );

      toast.success("Order updated successfully");
      stopEdit();
    } catch (error) {
      toast.error(error.message || "Failed to update order");
    }
  };

  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm("Cancel this order and restore stock?");
    if (!confirmed) return;

    try {
      await cancelMyOrder(token, orderId);
      toast.success("Order cancelled");
      void loadOrders();
    } catch (error) {
      toast.error(error.message || "Failed to cancel order");
    }
  };

  const handleRetryPayment = async (orderId) => {
    try {
      const data = await retryPayment(token, orderId);

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("Failed to start payment");
      }
    } catch (error) {
      toast.error(error.message || "Retry payment failed");
    }
  };

  const summary = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.total += 1;
        if (order.status === "Pending") acc.pending += 1;
        if (order.status === "Confirmed") acc.confirmed += 1;
        if (order.deliveryStatus === "Delivered") acc.delivered += 1;
        acc.value += Number(order.totalPrice || 0);
        return acc;
      },
      { total: 0, pending: 0, confirmed: 0, delivered: 0, value: 0 },
    );
  }, [orders]);

  return (
    <>
      <ProfileNav
        active="orders"
        links={[
          { key: "orders", label: "My Orders", to: "/orders" },
          { key: "products", label: "All Products", to: "/products" },
          {
            key: "requests",
            label: "Incoming Requests",
            to: "/incoming-requests",
          },
        ]}
      />

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
              <p className="text-slate-600">
                Track, update, and manage your placed orders
              </p>
            </div>
            <Link
              to="/products"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Browse Products
            </Link>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-5">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900">
                {summary.total}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-amber-600">
                {summary.pending}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">Confirmed</p>
              <p className="text-2xl font-bold text-emerald-600">
                {summary.confirmed}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs uppercase text-slate-500">Delivered</p>
              <p className="text-2xl font-bold text-sky-600">
                {summary.delivered}
              </p>
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
              <p className="text-slate-500">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-slate-600">
                No orders found. Start by placing your first order.
              </p>
              <Link
                to="/products"
                className="mt-4 inline-block text-emerald-700 hover:underline"
              >
                Go to products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isEditing = editingOrderId === order._id;

                return (
                  <div
                    key={order._id}
                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      {/* Product Image */}
                      <div className="w-full md:w-auto">
                        {order.product?.images &&
                        order.product.images.length > 0 ? (
                          <img
                            src={order.product.images[0]}
                            alt={order.product?.productName || "Product"}
                            className="h-32 w-32 rounded-xl object-cover shadow-sm"
                          />
                        ) : (
                          <div className="h-32 w-32 rounded-xl bg-slate-200 flex items-center justify-center">
                            <span className="text-slate-400 text-sm">
                              No image
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {order.product?.productName || "Product"}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Order ID: {order._id}
                        </p>
                        <p className="text-sm text-slate-700">
                          Qty:{" "}
                          <span className="font-semibold">
                            {order.quantity}
                          </span>{" "}
                          {order.product?.unit || "kg"}
                        </p>
                        <p className="text-sm text-slate-700">
                          Amount:{" "}
                          <span className="font-semibold">
                            LKR {Number(order.totalPrice || 0).toLocaleString()}
                          </span>
                        </p>
                        <p className="text-sm text-slate-700">
                          Delivery:{" "}
                          {order.deliveryAddress?.addressLine || "N/A"},{" "}
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
                        {isEditing ? (
                          <>
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                                Quantity
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={editForm.quantity}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    quantity: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                                Status
                              </label>
                              <select
                                value={editForm.status}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    status: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                              >
                                {EDITABLE_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => submitEdit(order._id)}
                                className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={stopEdit}
                                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(order)}
                              className="flex-1 rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              className="flex-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                            >
                              Cancel Order
                            </button>
                            {(order.paymentStatus === "unpaid" ||
                              order.paymentStatus === "failed") && (
                              <button
                                onClick={() => handleRetryPayment(order._id)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Pay Now
                              </button>
                            )}
                            {order.deliveryStatus === "Requested" &&
                              order.status === "Confirmed" && (
                                <>
                                  <Link
                                    to={`/orders/${order._id}/request-transport`}
                                    className="flex-1 rounded-xl border border-emerald-200 px-3 py-2 text-center text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                                    title="Select a specific vehicle to request transport"
                                  >
                                    Request Vehicle
                                  </Link>
                                  <Link
                                    to={`/orders/${order._id}/request-transporters`}
                                    className="flex-1 rounded-xl bg-emerald-100 px-3 py-2 text-center text-sm font-semibold text-emerald-700 hover:bg-emerald-200"
                                    title="Find available transporters by their company"
                                  >
                                    Request Transporter
                                  </Link>
                                </>
                              )}
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

export default MyOrders;
