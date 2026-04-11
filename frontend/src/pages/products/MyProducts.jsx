import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import ProfileNav from "../../components/ProfileNav";

const MyProducts = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    availableProducts: 0,
    soldOutProducts: 0,
    totalValue: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (user?.role !== "Farmer") {
      toast.error("Only farmers can access this page");
      navigate("/dashboard");
      return;
    }
    fetchMyProducts();
  }, [token, user, pagination.page, filters.status]);

  const fetchMyProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status && { status: filters.status }),
      });

      console.log(
        "Fetching products from:",
        `${import.meta.env.VITE_API_BASE_URL}/api/products/farmer/my-products?${params}`,
      );

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/products/farmer/my-products?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw new Error(errorData.message || "Failed to fetch products");
      }

      const data = await res.json();
      console.log("Products fetched:", data);

      setProducts(data.products || []);
      setPagination({
        ...pagination,
        total: data.total,
        pages: data.pages,
      });

      // Calculate stats
      const allProducts = data.products || [];
      const available = allProducts.filter(
        (p) => p.isAvailable === true,
      ).length;
      const soldOut = allProducts.filter((p) => p.isAvailable === false).length;
      const totalVal = allProducts.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0,
      );

      setStats({
        totalProducts: data.total,
        availableProducts: available,
        soldOutProducts: soldOut,
        totalValue: totalVal,
      });
    } catch (error) {
      console.error("Fetch error:", error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone.",
      )
    )
      return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete product");
      }

      toast.success("Product deleted successfully");
      fetchMyProducts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleAvailability = async (productId, currentStatus) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/products/${productId}/availability`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isAvailable: !currentStatus }),
        },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update status");
      }

      toast.success(
        `Product ${!currentStatus ? "activated" : "deactivated"} successfully`,
      );
      fetchMyProducts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMyProducts();
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (error) {
    return (
      <>
        <ProfileNav
          active="my-products"
          links={[
            { key: "my-products", label: "My Products", to: "/my-products" },
            { key: "add-product", label: "Add Product", to: "/products/add" },
          ]}
        />
        <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f0fdf4] to-[#f8fafc] px-4 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[32px] bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-red-900/5 p-12 text-center">
              <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-100">
                <span className="text-4xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-extrabold text-red-900 mb-3">
                Error Loading Data
              </h2>
              <p className="text-red-700/80 font-medium">{error}</p>
              <button
                onClick={fetchMyProducts}
                className="mt-8 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 px-8 py-3 text-white font-bold tracking-wide shadow-lg shadow-red-500/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ProfileNav
        active="my-products"
        links={[
          { key: "my-products", label: "My Products", to: "/my-products" },
          { key: "add-product", label: "Add Product", to: "/products/add" },
        ]}
      />

      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f0fdf4] to-[#f8fafc] px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1
                className="text-4xl font-extrabold text-emerald-950 drop-shadow-sm mb-2"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                My Inventory
              </h1>
              <p className="text-emerald-700/80 font-medium tracking-wide">
                Manage your agricultural products and listings
              </p>
            </div>
            <Link
              to="/products/add"
              className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-95"
            >
              + List New Product
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-5 md:grid-cols-4">
            <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 shadow-xl shadow-emerald-900/5 border border-white transition-transform hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-4 ring-1 ring-teal-100">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">
                Total Products
              </p>
              <p className="text-3xl font-black text-emerald-950">
                {stats.totalProducts}
              </p>
            </div>
            <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 shadow-xl shadow-emerald-900/5 border border-white transition-transform hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 mb-4 ring-1 ring-green-100">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">
                Available
              </p>
              <p className="text-3xl font-black text-green-600">
                {stats.availableProducts}
              </p>
            </div>
            <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 shadow-xl shadow-emerald-900/5 border border-white transition-transform hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 mb-4 ring-1 ring-orange-100">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">
                Sold Out
              </p>
              <p className="text-3xl font-black text-orange-600">
                {stats.soldOutProducts}
              </p>
            </div>
            <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-6 shadow-xl shadow-emerald-900/5 border border-white transition-transform hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 ring-1 ring-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50">
                <span className="font-bold">LKR</span>
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600/70 mb-1">
                Total Value
              </p>
              <p
                className="text-3xl font-black text-emerald-500 max-w-[200px] truncate"
                title={`LKR ${stats.totalValue.toLocaleString()}`}
              >
                LKR{" "}
                {stats.totalValue >= 1000000
                  ? (stats.totalValue / 1000000).toFixed(2) + "M"
                  : stats.totalValue.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8 rounded-3xl bg-white/60 backdrop-blur-2xl p-5 shadow-xl shadow-emerald-900/5 border border-white/80">
            <form
              onSubmit={handleSearch}
              className="flex flex-wrap gap-4 items-center"
            >
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by product name..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="w-full rounded-2xl border-0 bg-white/80 px-4 py-3 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/40 text-emerald-900 font-medium"
                />
              </div>
              <div className="w-full sm:w-48">
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full rounded-2xl border-0 bg-white/80 px-4 py-3 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-900 font-medium"
                >
                  <option value="">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Sold Out">Sold Out</option>
                </select>
              </div>
              <button
                type="submit"
                className="rounded-2xl bg-emerald-500 px-8 py-3 text-white font-bold shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters({ status: "", search: "" });
                  setPagination((prev) => ({ ...prev, page: 1 }));
                  setTimeout(fetchMyProducts, 100);
                }}
                className="rounded-2xl border-2 border-emerald-100 bg-white/80 px-8 py-3 text-emerald-700 font-bold hover:bg-emerald-50 hover:border-emerald-200 active:scale-95 transition-all w-full sm:w-auto"
              >
                Reset
              </button>
            </form>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="text-emerald-500/60 font-semibold tracking-widest uppercase">
                Loading inventory...
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[32px] bg-white/60 backdrop-blur-xl p-16 text-center shadow-xl shadow-emerald-900/5 border border-white/80 flex flex-col items-center justify-center">
              <div className="text-7xl mb-6 opacity-40 grayscale">🌾</div>
              <p className="text-emerald-900/40 font-bold tracking-wide mb-6">
                You haven't added any products yet.
              </p>
              <Link
                to="/products/add"
                className="inline-block rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-8 py-4 text-white font-black tracking-wide shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all text-lg"
              >
                List Your First Product
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="group flex flex-col rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl shadow-emerald-900/5 border border-white transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/10 overflow-hidden relative"
                >
                  <div className="relative h-52 overflow-hidden bg-emerald-50/50">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.productName}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-emerald-200">
                        <svg
                          className="w-16 h-16 mx-auto opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    {product.images && product.images.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
                        +{product.images.length - 1} images
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />

                    <span
                      className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm ${
                        product.isAvailable
                          ? "bg-white/95 text-emerald-700"
                          : "bg-orange-50/95 text-orange-700"
                      }`}
                    >
                      {product.isAvailable ? "Active" : "Sold Out"}
                    </span>
                  </div>

                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex-1">
                      <h3 className="text-xl font-extrabold text-emerald-950 line-clamp-1 mb-1">
                        {product.productName}
                      </h3>
                      <p className="text-xs font-semibold tracking-wide text-emerald-600/70 uppercase">
                        {product.category}
                      </p>

                      <p className="mt-4 text-2xl font-black text-emerald-500 drop-shadow-sm">
                        LKR {product.price.toLocaleString()}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] uppercase font-bold tracking-widest">
                        <div className="rounded-xl bg-slate-50/50 border border-slate-100 p-2 text-slate-500">
                          <span className="opacity-60 block mb-0.5">
                            Location
                          </span>
                          <span className="text-slate-700 truncate">
                            {product.pickupLocation?.district || "N/A"}
                          </span>
                        </div>
                        <div className="rounded-xl bg-emerald-50/50 border border-emerald-100/50 p-2 text-emerald-700">
                          <span className="opacity-60 block mb-0.5">Stock</span>
                          <span className="text-emerald-900 truncate">
                            {product.quantity}
                            {product.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <Link
                        to={`/products/edit/${product._id}`}
                        className="rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 py-2.5 text-center flex justify-center items-center text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 hover:border-emerald-200 active:scale-95"
                        aria-label="Edit product"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </Link>
                      <button
                        onClick={() =>
                          toggleAvailability(product._id, product.isAvailable)
                        }
                        className={`rounded-2xl border-2 py-2.5 text-center flex justify-center items-center text-sm font-bold transition active:scale-95 ${
                          product.isAvailable
                            ? "border-orange-100 bg-orange-50/50 text-orange-600 hover:bg-orange-100 hover:border-orange-200"
                            : "border-emerald-100 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-200"
                        }`}
                        aria-label={
                          product.isAvailable
                            ? "Mark as Out of Stock"
                            : "Mark as Available"
                        }
                        title={
                          product.isAvailable
                            ? "Set as Sold Out"
                            : "Set as Available"
                        }
                      >
                        {product.isAvailable ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="rounded-2xl border-2 border-rose-100 bg-rose-50/50 py-2.5 text-center flex justify-center items-center text-sm font-bold text-rose-600 transition hover:bg-rose-100 hover:border-rose-200 active:scale-95"
                        aria-label="Delete product"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-slate-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === pagination.pages}
                className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default MyProducts;
