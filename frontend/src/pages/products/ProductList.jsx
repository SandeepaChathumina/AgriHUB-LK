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
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
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

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const res = await fetch(`http://localhost:3000/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to delete product');
      
      toast.success('Product deleted successfully');
      fetchProducts();
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
      
      if (!res.ok) throw new Error('Failed to update status');
      
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchProducts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <ProfileNav active="products" links={[
        { key: 'products', label: 'My Products', to: '/products' },
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
              <p className="text-slate-500">No products found. Start by adding your first product!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map(product => (
                <div key={product._id} className="group rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
                  <div className="relative h-48 overflow-hidden rounded-t-2xl bg-slate-100">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        No Image
                      </div>
                    )}
                    <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-semibold ${
                      product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {product.isAvailable ? 'Available' : 'Sold Out'}
                    </span>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-slate-900">{product.productName}</h3>
                    <p className="text-sm text-slate-500">{product.category} • {product.quantity}{product.unit}</p>
                    <p className="mt-2 text-xl font-bold text-emerald-600">LKR {product.price}</p>
                    <p className="mt-1 text-xs text-slate-400">Pickup: {product.pickupLocation?.district}</p>
                    
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
                            ? 'border border-red-200 text-red-700 hover:bg-red-50'
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
    </>
  );
};

export default ProductList;