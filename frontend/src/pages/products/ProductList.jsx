// src/pages/products/ProductList.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import ProfileNav from "../../components/ProfileNav";

const ProductList = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [farmerRatings, setFarmerRatings] = useState({});
  const [loadingRatings, setLoadingRatings] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    district: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  const categories = [
    "All",
    "Vegetables",
    "Fruits",
    "Grains",
    "Dairy",
    "Poultry",
    "Other",
  ];
  const districts = [
    "All",
    "Colombo",
    "Gampaha",
    "Kalutara",
    "Kandy",
    "Matale",
    "Nuwara Eliya",
    "Galle",
    "Matara",
    "Hambantota",
    "Jaffna",
    "Kilinochchi",
    "Mannar",
    "Vavuniya",
    "Mullaitivu",
    "Batticaloa",
    "Ampara",
    "Trincomalee",
    "Kurunegala",
    "Puttalam",
    "Anuradhapura",
    "Polonnaruwa",
    "Badulla",
    "Monaragala",
    "Ratnapura",
    "Kegalle",
  ];

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchProducts();
  }, [token, pagination.page, filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.category &&
          filters.category !== "All" && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.district &&
          filters.district !== "All" && { district: filters.district }),
        ...(filters.search && { search: filters.search }),
      });

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/products?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      setProducts(data.products || []);
      setPagination({
        ...pagination,
        total: data.total,
        pages: data.pages,
      });

      // Fetch ratings for all farmers
      fetchAllFarmerRatings(data.products || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllFarmerRatings = async (productsList) => {
    const uniqueFarmerIds = [
      ...new Set(productsList.map((p) => p.farmer?._id).filter(Boolean)),
    ];

    for (const farmerId of uniqueFarmerIds) {
      fetchFarmerRating(farmerId);
    }
  };

  const fetchFarmerRating = async (farmerId) => {
    if (farmerRatings[farmerId]) return;

    setLoadingRatings((prev) => ({ ...prev, [farmerId]: true }));
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/reviews/target/Farmer/${farmerId}?limit=1`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      const data = await res.json();
      setFarmerRatings((prev) => ({
        ...prev,
        [farmerId]: {
          averageRating: data.stats?.averageRating || 0,
          totalReviews: data.stats?.totalReviews || 0,
        },
      }));
    } catch (error) {
      console.error("Failed to fetch farmer rating:", error);
    } finally {
      setLoadingRatings((prev) => ({ ...prev, [farmerId]: false }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOrderNow = (product) => {
    navigate(`/order/${product._id}`, { state: { product } });
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <span className="inline-flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="text-amber-500 text-sm">
            ★
          </span>
        ))}
        {hasHalfStar && <span className="text-amber-500 text-sm">½</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-slate-300 text-sm">
            ★
          </span>
        ))}
      </span>
    );
  };

  return (
    <>
      <ProfileNav
        active="products"
        links={[
          { key: "products", label: "All Products", to: "/products" },
          ...(user?.role === "Farmer"
            ? [{ key: "my-products", label: "My Products", to: "/my-products" }]
            : []),
        ]}
      />

      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f0fdf4] to-[#f8fafc] px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-4xl font-extrabold text-emerald-950 drop-shadow-sm mb-2"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Market Explorer
            </h1>
            <p className="text-emerald-700/80 font-medium tracking-wide">
              Discover premium agricultural products from verified local farmers
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 rounded-3xl bg-white/60 backdrop-blur-2xl p-5 shadow-xl shadow-emerald-900/5 border border-white/80">
            <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-5">
              <input
                type="text"
                name="search"
                placeholder="Search products..."
                value={filters.search}
                onChange={handleFilterChange}
                className="rounded-2xl border-0 bg-white/80 px-4 py-3 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/40 text-emerald-900 font-medium"
              />
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="rounded-2xl border-0 bg-white/80 px-4 py-3 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-900 font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                name="district"
                value={filters.district}
                onChange={handleFilterChange}
                className="rounded-2xl border-0 bg-white/80 px-4 py-3 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-900 font-medium"
              >
                {districts.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="minPrice"
                placeholder="Min Price (LKR)"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="rounded-2xl border-0 bg-white/80 px-4 py-3 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/40 text-emerald-900 font-medium"
              />
              <input
                type="number"
                name="maxPrice"
                placeholder="Max Price (LKR)"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="rounded-2xl border-0 bg-white/80 px-4 py-3 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all placeholder-emerald-800/40 text-emerald-900 font-medium"
              />
            </form>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-slate-500">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-slate-500">No products found.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const farmerRating = farmerRatings[product.farmer?._id];
                return (
                  <div
                    key={product._id}
                    className="group flex flex-col rounded-3xl bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-emerald-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/10 overflow-hidden relative"
                  >
                    <div className="relative h-56 overflow-hidden bg-emerald-50/50">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.productName}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-emerald-200">
                          <svg
                            className="w-16 h-16 mx-auto mb-2 opacity-50"
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

                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      <span
                        className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] uppercase font-bold tracking-widest backdrop-blur-md shadow-sm ${
                          product.isAvailable
                            ? "bg-white/90 text-emerald-700"
                            : "bg-red-50/90 text-red-700"
                        }`}
                      >
                        {product.isAvailable ? "Available" : "Sold Out"}
                      </span>
                    </div>

                    <div className="flex flex-col flex-1 p-5">
                      <div className="flex-1">
                        <h3 className="text-xl font-extrabold text-emerald-950 line-clamp-1 mb-1">
                          {product.productName}
                        </h3>
                        <p className="text-xs font-semibold tracking-wide text-emerald-600/70 uppercase">
                          {product.category} • {product.quantity}
                          {product.unit}
                        </p>

                        {/* Farmer Rating Section */}
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 border border-emerald-100/50">
                          <Link
                            to={`/reviews/Farmer/${product.farmer?._id}`}
                            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs font-bold text-emerald-800 line-clamp-1 max-w-[100px]">
                              {product.farmer?.fullName || "Farmer"}
                            </span>
                            <div className="w-px h-3 bg-emerald-200" />
                            {loadingRatings[product.farmer?._id] ? (
                              <span className="text-[10px] text-emerald-500 font-semibold tracking-wide uppercase">
                                ...
                              </span>
                            ) : farmerRating &&
                              farmerRating.totalReviews > 0 ? (
                              <>
                                {renderStars(farmerRating.averageRating)}
                                <span className="text-[10px] font-bold text-emerald-700 tracking-wider">
                                  ({farmerRating.totalReviews})
                                </span>
                              </>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest text-center w-full block">
                                New seller
                              </span>
                            )}
                          </Link>
                        </div>

                        <p className="mt-4 text-2xl font-black text-emerald-500 drop-shadow-sm">
                          LKR {product.price.toLocaleString()}
                        </p>
                        <p className="mt-1 flex items-center text-xs font-semibold text-emerald-700/60">
                          <svg
                            className="w-3.5 h-3.5 mr-1 text-emerald-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          {product.pickupLocation?.district || "N/A"}
                        </p>
                      </div>

                      {product.isAvailable ? (
                        <div className="mt-5 flex gap-2">
                          <button
                            onClick={() => handleViewDetails(product)}
                            className="flex-1 rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 px-3 py-2.5 text-center text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 hover:border-emerald-200 active:scale-[0.98]"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleOrderNow(product)}
                            className="flex-1 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-3 py-2.5 text-center text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-500 hover:to-emerald-700 hover:shadow-xl hover:shadow-emerald-500/40 active:scale-[0.98]"
                          >
                            Order Now
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4 text-center text-sm text-red-500">
                          Currently Unavailable
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
                className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
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
                className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Details Modal */}
      {/* Product Details Modal Premium Design */}
      {showDetailsModal && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-md px-4 p-4 transition-all"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-\[32px\] bg-white shadow-2xl border border-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-emerald-50 bg-white/80 backdrop-blur-xl px-8 py-5 z-10 transition-colors">
              <h2
                className="text-2xl font-extrabold text-emerald-950"
                style={{ fontFamily: "'Fraunces', Georgia, serif" }}
              >
                Product Breakdown
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="rounded-full bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100 transition active:scale-95"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-8">
              {/* Product Info top flex */}
              <div className="mb-8 flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-5/12 flex-shrink-0">
                  <div className="relative group overflow-hidden rounded-3xl shadow-lg border border-emerald-50 bg-emerald-50/50 aspect-square">
                    {selectedProduct.images &&
                    selectedProduct.images.length > 0 ? (
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.productName}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl opacity-30">
                        🛒
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full w-max mb-3">
                    {selectedProduct.category}
                  </span>
                  <h3 className="text-4xl font-extrabold text-emerald-950 mb-2 leading-tight">
                    {selectedProduct.productName}
                  </h3>
                  <p className="text-3xl font-black text-emerald-500 mb-6 drop-shadow-sm">
                    LKR {selectedProduct.price.toLocaleString()}{" "}
                    <span className="text-lg font-medium text-emerald-600/60 uppercase tracking-widest">
                      / {selectedProduct.unit}
                    </span>
                  </p>

                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-emerald-50">
                    <div className="rounded-2xl bg-gradient-to-br from-[#f8fafc] to-[#f0fdf4] px-5 py-4 border border-white shadow-sm ring-1 ring-emerald-900/5">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1 opacity-80">
                        Stock Level
                      </p>
                      <p className="text-2xl font-black text-emerald-900">
                        {selectedProduct.quantity}{" "}
                        <span className="text-sm font-semibold">
                          {selectedProduct.unit}
                        </span>
                      </p>
                    </div>
                  </div>

                  <p className="text-emerald-800/70 text-sm leading-relaxed font-medium">
                    {selectedProduct.description ||
                      "Verified agricultural product directly from the source."}
                  </p>
                </div>
              </div>

              {/* Specifications grid */}
              <div className="mb-8 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl bg-[#fafafa] border border-white shadow-sm ring-1 ring-emerald-900/5 px-5 py-4 text-center">
                  <p className="text-[10px] text-emerald-600 uppercase font-black tracking-widest mb-1.5 opacity-60">
                    Quality
                  </p>
                  <p className="font-bold text-emerald-950">
                    {selectedProduct.quality || "Premium"}
                  </p>
                </div>
                {selectedProduct.harvestDate && (
                  <div className="rounded-2xl bg-[#fafafa] border border-white shadow-sm ring-1 ring-emerald-900/5 px-5 py-4 text-center">
                    <p className="text-[10px] text-emerald-600 uppercase font-black tracking-widest mb-1.5 opacity-60">
                      Harvested
                    </p>
                    <p className="font-bold text-emerald-950">
                      {new Date(
                        selectedProduct.harvestDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedProduct.expiryDate && (
                  <div className="rounded-2xl bg-[#fafafa] border border-white shadow-sm ring-1 ring-emerald-900/5 px-5 py-4 text-center">
                    <p className="text-[10px] text-emerald-600 uppercase font-black tracking-widest mb-1.5 opacity-60">
                      Expires
                    </p>
                    <p className="font-bold text-emerald-950">
                      {new Date(
                        selectedProduct.expiryDate,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div className="rounded-2xl bg-[#fafafa] border border-white shadow-sm ring-1 ring-emerald-900/5 px-5 py-4 text-center">
                  <p className="text-[10px] text-emerald-600 uppercase font-black tracking-widest mb-1.5 opacity-60">
                    Sold as
                  </p>
                  <p className="font-bold text-emerald-950">
                    {selectedProduct.isAvailable ? "Available" : "Sold Out"}
                  </p>
                </div>
              </div>

              {/* Seller */}
              <div className="flex items-center justify-between rounded-3xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 px-6 py-5 border border-emerald-100/60">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm ring-1 ring-emerald-200 flex flex-col items-center justify-center text-emerald-600">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600/80 font-black uppercase tracking-widest block mb-0.5">
                      Verified Farmer
                    </span>
                    <span className="text-lg font-bold text-emerald-950">
                      {selectedProduct.farmer?.fullName || "Hidden Identity"}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-1.5 text-emerald-700 bg-white/60 px-3 py-1 rounded-full shadow-sm font-semibold text-xs border border-emerald-100">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {selectedProduct.pickupLocation?.district ||
                      "Not specified"}
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="mt-8">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    if (selectedProduct.isAvailable)
                      handleOrderNow(selectedProduct);
                  }}
                  disabled={!selectedProduct.isAvailable}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 px-6 py-4 text-lg font-black text-white shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-[0.99] disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
                >
                  {selectedProduct.isAvailable
                    ? "Proceed to Order"
                    : "Out of Stock"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductList;
