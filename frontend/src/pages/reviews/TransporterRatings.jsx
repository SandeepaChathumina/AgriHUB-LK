// src/pages/reviews/TransporterRatings.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';

const TransporterRatings = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState('');
  const [respondingTo, setRespondingTo] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [sort, setSort] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'Transporter') {
      toast.error('Only transporters can access this page');
      navigate('/dashboard');
      return;
    }
    fetchReviews();
    fetchStats();
  }, [token, user, pagination.page, sort, ratingFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sort,
        ...(ratingFilter && { rating: ratingFilter })
      });

      const res = await fetch(`http://localhost:3000/api/reviews/target/Transporter/${user?.id}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch reviews');
      
      setReviews(data.reviews || []);
      setPagination({
        ...pagination,
        total: data.total || 0,
        pages: data.pages || 0
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/reviews/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleRespond = async (reviewId) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ responseText })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit response');
      
      toast.success('Response added successfully');
      setRespondingTo(null);
      setResponseText('');
      fetchReviews();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const markHelpful = async (reviewId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/reviews/${reviewId}/helpful`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to mark as helpful');
      
      toast.success('Marked as helpful');
      fetchReviews();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.round(rating || 0);
    const emptyStars = 5 - fullStars;
    return (
      <span className="text-amber-500 text-lg">
        {'★'.repeat(fullStars)}
        {'☆'.repeat(emptyStars)}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <ProfileNav active="my-ratings" links={[
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
        { key: 'vehicles', label: 'My Vehicles', to: '/vehicles' },
        { key: 'trips', label: 'My Trips', to: '/trips' }
      ]} />
      
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">⭐ My Ratings</h1>
            <p className="text-slate-600">See what distributors say about your delivery service</p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="mb-8 grid gap-6 md:grid-cols-4">
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-blue-200">
                <p className="text-sm text-slate-500">Overall Rating</p>
                <p className="text-5xl font-bold text-blue-600 mt-2">{stats.averageRating?.toFixed(1) || '0.0'}</p>
                <div className="mt-2">{renderStars(stats.averageRating || 0)}</div>
                <p className="text-xs text-slate-400 mt-2">from {stats.totalReviews || 0} reviews</p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-2">Timeliness</p>
                <p className="text-3xl font-bold text-slate-900">{stats.timeliness?.toFixed(1) || '0.0'}/5</p>
                <div className="mt-2">{renderStars(stats.timeliness || 0)}</div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-2">Vehicle Condition</p>
                <p className="text-3xl font-bold text-slate-900">{stats.vehicleCondition?.toFixed(1) || '0.0'}/5</p>
                <div className="mt-2">{renderStars(stats.vehicleCondition || 0)}</div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-2">Professionalism</p>
                <p className="text-3xl font-bold text-slate-900">{stats.professionalism?.toFixed(1) || '0.0'}/5</p>
                <div className="mt-2">{renderStars(stats.professionalism || 0)}</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700">Sort by:</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700">Rating:</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
            <button
              onClick={() => {
                setSort('newest');
                setRatingFilter('');
                setPagination(prev => ({ ...prev, page: 1 }));
                setTimeout(fetchReviews, 100);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset Filters
            </button>
          </div>

          {/* Reviews List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-slate-500">Loading reviews...</div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <div className="text-6xl mb-4">🚚</div>
              <p className="text-slate-500 mb-4">No reviews yet. Complete deliveries to receive ratings from distributors!</p>
              <p className="text-sm text-slate-400">When distributors rate your service, they will appear here.</p>
              <Link to="/available-orders" className="mt-4 inline-block text-emerald-600 hover:underline">
                Browse Available Orders →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1 text-amber-500 text-lg">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-slate-400">•</span>
                        <span className="text-sm text-slate-500">{formatDate(review.createdAt)}</span>
                        {review.isVerifiedPurchase && (
                          <>
                            <span className="text-sm text-slate-400">•</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              ✓ Verified Delivery
                            </span>
                          </>
                        )}
                      </div>
                      
                      {review.title && (
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">{review.title}</h3>
                      )}
                      
                      <p className="mt-2 text-slate-700 leading-relaxed">{review.comment}</p>
                      
                      {/* Criteria Badges */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {review.criteria?.timeliness && (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                            Timeliness: {review.criteria.timeliness}/5
                          </span>
                        )}
                        {review.criteria?.vehicleCondition && (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                            Vehicle Condition: {review.criteria.vehicleCondition}/5
                          </span>
                        )}
                        {review.criteria?.professionalism && (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                            Professionalism: {review.criteria.professionalism}/5
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-4 flex items-center gap-4">
                        <div className="text-sm text-slate-500">
                          By <span className="font-semibold text-slate-700">{review.reviewer?.fullName || 'Anonymous'}</span>
                          {review.reviewer?.role && <span className="text-slate-400 ml-1">({review.reviewer.role})</span>}
                        </div>
                        <button
                          onClick={() => markHelpful(review._id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                        >
                          👍 Helpful ({review.helpfulCount || 0})
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Response Section */}
                  {review.response?.text ? (
                    <div className="mt-4 rounded-lg bg-blue-50 p-4 border-l-4 border-blue-500">
                      <p className="text-sm font-semibold text-blue-800 mb-1">Your Response:</p>
                      <p className="text-sm text-blue-700">{review.response.text}</p>
                      <p className="mt-2 text-xs text-blue-500">
                        Responded on {formatDate(review.response.respondedAt)}
                      </p>
                    </div>
                  ) : respondingTo === review._id ? (
                    <div className="mt-4">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Write your response to this review..."
                        rows="3"
                        className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleRespond(review._id)}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          Submit Response
                        </button>
                        <button
                          onClick={() => {
                            setRespondingTo(null);
                            setResponseText('');
                          }}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRespondingTo(review._id)}
                      className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
                    >
                      Respond to this review
                    </button>
                  )}
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
                className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-slate-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
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

export default TransporterRatings;