import React, { useEffect, useMemo, useState, useRef } from "react";
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
  const [editForm, setEditForm] = useState({ quantity: "" });
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState(null);
  const toastShownRef = useRef(false);

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
    if (!payment || toastShownRef.current) return;

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

    toastShownRef.current = true;

    // Remove query params AFTER showing toast
    setTimeout(() => {
      setSearchParams({}, { replace: true });
    }, 0);
  }, [searchParams]);

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
    });
  };

  const stopEdit = () => {
    setEditingOrderId(null);
    setEditForm({ quantity: "" });
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

  const handleOpenDeliveryModal = (order) => {
    setSelectedOrderForDelivery(order);
    setShowDeliveryModal(true);
  };

  const handleCloseDeliveryModal = () => {
    setShowDeliveryModal(false);
    setSelectedOrderForDelivery(null);
  };

  const handleRequestVehicle = () => {
    if (selectedOrderForDelivery) {
      handleCloseDeliveryModal();
      navigate(`/orders/${selectedOrderForDelivery._id}/request-transport`);
    }
  };

  const handleRequestTransporter = () => {
    if (selectedOrderForDelivery) {
      handleCloseDeliveryModal();
      navigate(`/orders/${selectedOrderForDelivery._id}/request-transporters`);
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
                                <button
                                  onClick={() => handleOpenDeliveryModal(order)}
                                  className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-700"
                                >
                                  Request Delivery
                                </button>
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

      {/* Request Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/60 to-black/40 p-4 backdrop-blur-sm">
          <div className="rounded-3xl bg-gradient-to-br from-white via-slate-50 to-white p-8 shadow-2xl max-w-md w-full transform transition-all duration-300 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-blue-100">
                <span className="text-3xl">📦</span>
              </div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Request Delivery
              </h2>
              <p className="text-sm leading-relaxed text-slate-500">
                Choose how you'd like to arrange transport for your order
              </p>
            </div>

            {/* Options Grid */}
            <div className="space-y-4 mb-6">
              {/* Option 1: Request Specific Vehicle */}
              <button
                onClick={handleRequestVehicle}
                className="group relative w-full rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Content */}
                <div className="relative rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 px-6 py-5 text-left group-hover:border-emerald-500 group-hover:from-emerald-500 group-hover:to-teal-500 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-lg group-hover:bg-white group-hover:text-emerald-600 transition-colors duration-300">
                        🚛
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-emerald-900 group-hover:text-white transition-colors duration-300 mb-1 text-base">
                        Specific Vehicle
                      </h3>
                      <p className="text-sm text-emerald-700 group-hover:text-emerald-50 transition-colors duration-300 leading-relaxed">
                        Hand-pick a vehicle that fits your delivery needs
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 inline-block text-emerald-600 group-hover:text-white transition-colors duration-300 text-sm font-semibold">
                    Choose Vehicle →
                  </div>
                </div>
              </button>

              {/* Option 2: Request via Transporter Company */}
              <button
                onClick={handleRequestTransporter}
                className="group relative w-full rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Content */}
                <div className="relative rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-5 text-left group-hover:border-blue-500 group-hover:from-blue-500 group-hover:to-indigo-500 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg group-hover:bg-white group-hover:text-blue-600 transition-colors duration-300">
                        🏢
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-900 group-hover:text-white transition-colors duration-300 mb-1 text-base">
                        Transporter Company
                      </h3>
                      <p className="text-sm text-blue-700 group-hover:text-blue-50 transition-colors duration-300 leading-relaxed">
                        Browse and connect with available transporter companies
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 inline-block text-blue-600 group-hover:text-white transition-colors duration-300 text-sm font-semibold">
                    Find Company →
                  </div>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={handleCloseDeliveryModal}
              className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:shadow-md"
            >
              Cancel
            </button>

            {/* Divider */}
            <div className="mt-6 pt-4 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-400">Need help? Check our delivery guide</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyOrders;
