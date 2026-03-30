import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';

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
    totalValue: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'Farmer') {
      toast.error('Only farmers can access this page');
      navigate('/dashboard');
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
        ...(filters.status && { status: filters.status })
      });

      console.log('Fetching products from:', `http://localhost:3000/api/products/farmer/my-products?${params}`);
      
      const res = await fetch(`http://localhost:3000/api/products/farmer/my-products?${params}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to fetch products');
      }
      
      const data = await res.json();
      console.log('Products fetched:', data);
      
      setProducts(data.products || []);
      setPagination({
        ...pagination,
        total: data.total,
        pages: data.pages
      });
      
      // Calculate stats
      const allProducts = data.products || [];
      const available = allProducts.filter(p => p.isAvailable === true).length;
      const soldOut = allProducts.filter(p => p.isAvailable === false).length;
      const totalVal = allProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      
      setStats({
        totalProducts: data.total,
        availableProducts: available,
        soldOutProducts: soldOut,
        totalValue: totalVal
      });
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`http://localhost:3000/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete product');
      }
      
      toast.success('Product deleted successfully');
      fetchMyProducts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleAvailability = async (productId, currentStatus) => {
    try {
      const res = await fetch(`http://localhost:3000/api/products/${productId}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable: !currentStatus })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update status');
      }
      
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
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
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <>
        <ProfileNav active="my-products" links={[
          { key: 'my-products', label: 'My Products', to: '/my-products' },
          { key: 'add-product', label: 'Add Product', to: '/products/add' }
        ]} />
        <div className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl bg-red-50 p-8 text-center">
              <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Products</h2>
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchMyProducts}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
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
      <ProfileNav active="my-products" links={[
        { key: 'my-products', label: 'My Products', to: '/my-products' },
        { key: 'add-product', label: 'Add Product', to: '/products/add' }
      ]} />
      
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Products</h1>
              <p className="text-slate-600">Manage your agricultural products inventory</p>
            </div>
            <Link
              to="/products/add"
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              + Add New Product
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Total Products</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.totalProducts}</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Available</p>
              <p className="text-3xl font-bold text-green-600">{stats.availableProducts}</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Sold Out</p>
              <p className="text-3xl font-bold text-red-600">{stats.soldOutProducts}</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Total Inventory Value</p>
              <p className="text-3xl font-bold text-emerald-600">LKR {stats.totalValue.toLocaleString()}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by product name..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="w-48">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Sold Out">Sold Out</option>
                </select>
              </div>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-6 py-2 text-white font-semibold hover:bg-emerald-700 transition"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters({ status: '', search: '' });
                  setPagination(prev => ({ ...prev, page: 1 }));
                  setTimeout(fetchMyProducts, 100);
                }}
                className="rounded-xl border border-slate-300 px-6 py-2 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Clear
              </button>
            </form>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-slate-500">Loading your products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <div className="text-6xl mb-4">🌾</div>
              <p className="text-slate-500 mb-4">You haven't added any products yet.</p>
              <Link
                to="/products/add"
                className="inline-block rounded-xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition"
              >
                Add Your First Product
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map(product => (
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
                    {product.images && product.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        +{product.images.length - 1}
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
                    <p className="mt-2 text-xl font-bold text-emerald-600">LKR {product.price.toLocaleString()}</p>
                    
                    <div className="mt-2 text-xs text-slate-400 space-y-1">
                      <p>📍 {product.pickupLocation?.district || 'N/A'}</p>
                      {product.harvestDate && (
                        <p>🌾 Harvest: {formatDate(product.harvestDate)}</p>
                      )}
                      <p>📦 Stock: {product.quantity}{product.unit}</p>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Link
                        to={`/products/edit/${product._id}`}
                        className="flex-1 rounded-lg border border-emerald-200 px-3 py-2 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => toggleAvailability(product._id, product.isAvailable)}
                        className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold transition ${
                          product.isAvailable
                            ? 'border border-amber-200 text-amber-700 hover:bg-amber-50'
                            : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {product.isAvailable ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Delete
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
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-slate-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
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