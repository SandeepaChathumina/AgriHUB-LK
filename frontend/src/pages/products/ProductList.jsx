// src/pages/products/ProductList.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';

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
    category: '',
    minPrice: '',
    maxPrice: '',
    district: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  const categories = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Poultry', 'Other'];
  const districts = ['All', 'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'];

  useEffect(() => {
    if (!token) {
      navigate('/login');
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
        ...(filters.category && filters.category !== 'All' && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.district && filters.district !== 'All' && { district: filters.district }),
        ...(filters.search && { search: filters.search })
      });

      const res = await fetch(`http://localhost:3000/api/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch products');
      
      const data = await res.json();
      setProducts(data.products || []);
      setPagination({
        ...pagination,
        total: data.total,
        pages: data.pages
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
    const uniqueFarmerIds = [...new Set(productsList.map(p => p.farmer?._id).filter(Boolean))];
    
    for (const farmerId of uniqueFarmerIds) {
      fetchFarmerRating(farmerId);
    }
  };

  const fetchFarmerRating = async (farmerId) => {
    if (farmerRatings[farmerId]) return;
    
    setLoadingRatings(prev => ({ ...prev, [farmerId]: true }));
    try {
      const res = await fetch(`http://localhost:3000/api/reviews/target/Farmer/${farmerId}?limit=1`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      setFarmerRatings(prev => ({
        ...prev,
        [farmerId]: {
          averageRating: data.stats?.averageRating || 0,
          totalReviews: data.stats?.totalReviews || 0
        }
      }));
    } catch (error) {
      console.error('Failed to fetch farmer rating:', error);
    } finally {
      setLoadingRatings(prev => ({ ...prev, [farmerId]: false }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
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
          <span key={`full-${i}`} className="text-amber-500 text-sm">★</span>
        ))}
        {hasHalfStar && (
          <span className="text-amber-500 text-sm">½</span>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-slate-300 text-sm">★</span>
        ))}
      </span>
    );
  };

  return (
    <>
      <ProfileNav active="products" links={[
        { key: 'products', label: 'All Products', to: '/products' },
        ...(user?.role === 'Farmer' ? [{ key: 'my-products', label: 'My Products', to: '/my-products' }] : [])
      ]} />
      
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">All Products</h1>
            <p className="text-slate-600">Browse fresh agricultural products from local farmers</p>
          </div>

          {/* Filters */}
          <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-5">
              <input
                type="text"
                name="search"
                placeholder="Search products..."
                value={filters.search}
                onChange={handleFilterChange}
                className="rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              />
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                name="district"
                value={filters.district}
                onChange={handleFilterChange}
                className="rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              >
                {districts.map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
              <input
                type="number"
                name="minPrice"
                placeholder="Min Price (LKR)"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="number"
                name="maxPrice"
                placeholder="Max Price (LKR)"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
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
              {products.map(product => {
                const farmerRating = farmerRatings[product.farmer?._id];
                return (
                  <div key={product._id} className="group rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
                    <div className="relative h-48 overflow-hidden rounded-t-2xl bg-slate-100">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.productName}
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          <div className="text-center">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">No Image</span>
                          </div>
                        </div>
                      )}
                      <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-semibold ${
                        product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {product.isAvailable ? 'Available' : 'Sold Out'}
                      </span>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">{product.productName}</h3>
                      <p className="text-sm text-slate-500">{product.category} • {product.quantity}{product.unit}</p>
                      
                      {/* Farmer Rating Section */}
                      <div className="mt-2 flex items-center gap-2">
                        <Link 
                          to={`/reviews/Farmer/${product.farmer?._id}`}
                          className="flex items-center gap-1 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {loadingRatings[product.farmer?._id] ? (
                            <span className="text-xs text-slate-400">Loading...</span>
                          ) : farmerRating && farmerRating.totalReviews > 0 ? (
                            <>
                              {renderStars(farmerRating.averageRating)}
                              <span className="text-xs text-slate-500 ml-1">
                                ({farmerRating.totalReviews})
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">No ratings yet</span>
                          )}
                        </Link>
                      </div>
                      
                      <p className="mt-1 text-xs text-slate-400">
                        <span className="font-medium text-slate-600">Seller:</span> {product.farmer?.fullName || 'Unknown Farmer'}
                      </p>
                      <p className="mt-2 text-xl font-bold text-emerald-600">LKR {product.price.toLocaleString()}</p>
                      <p className="mt-1 text-xs text-slate-400">📍 Pickup: {product.pickupLocation?.district || 'N/A'}</p>
                      
                      {product.isAvailable ? (
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => handleViewDetails(product)}
                            className="flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleOrderNow(product)}
                            className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
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
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-slate-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
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
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowDetailsModal(false)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4 z-10">
              <h2 className="text-xl font-bold text-slate-900">Product Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="rounded-full p-1 hover:bg-slate-100 transition"
              >
                <svg className="h-6 w-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Product Info */}
              <div className="mb-6 flex gap-6 flex-col md:flex-row">
                <div className="w-full md:w-1/3 flex-shrink-0">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.productName}
                      className="h-48 w-full rounded-xl object-cover border border-slate-100"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center rounded-xl bg-slate-100 text-4xl">
                      🥬
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">{selectedProduct.productName}</h3>
                  <p className="text-emerald-600 font-semibold mb-3">LKR {selectedProduct.price.toLocaleString()} / {selectedProduct.unit}</p>
                  
                  <div className="inline-block rounded-lg bg-emerald-50 px-3 py-2 border border-emerald-100 mb-4">
                    <p className="text-xs text-emerald-800 uppercase tracking-wide font-semibold">Available Quantity</p>
                    <p className="text-lg font-bold text-emerald-900">{selectedProduct.quantity} {selectedProduct.unit}</p>
                  </div>
                  
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedProduct.description || 'No description provided for this product.'}
                  </p>
                </div>
              </div>

              {/* Specifications */}
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Category</p>
                  <p className="font-medium text-slate-900">{selectedProduct.category}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Quality</p>
                  <p className="font-medium text-slate-900">{selectedProduct.quality || 'Standard'}</p>
                </div>
                {selectedProduct.harvestDate && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Harvest Date</p>
                    <p className="font-medium text-slate-900">{new Date(selectedProduct.harvestDate).toLocaleDateString()}</p>
                  </div>
                )}
                {selectedProduct.expiryDate && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Expiry Date</p>
                    <p className="font-medium text-slate-900">{new Date(selectedProduct.expiryDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              
              {/* Seller Info */}
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-sm font-semibold text-slate-800 mb-2">Seller Information</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Farmer:</span>
                  <span className="font-medium text-slate-900">{selectedProduct.farmer?.fullName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-slate-600">Location:</span>
                  <span className="font-medium text-slate-900">{selectedProduct.pickupLocation?.district || 'Not specified'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    if (selectedProduct.isAvailable) handleOrderNow(selectedProduct);
                  }}
                  disabled={!selectedProduct.isAvailable}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-center"
                >
                  {selectedProduct.isAvailable ? 'Order Now' : 'Sold Out'}
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