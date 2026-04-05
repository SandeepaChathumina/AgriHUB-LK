// src/pages/reviews/ProductReviews.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';

const ProductReviews = () => {
  const { targetType, targetId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [sort, setSort] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState('');
  const [responseText, setResponseText] = useState('');
  const [respondingTo, setRespondingTo] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [targetType, targetId, pagination.page, sort, ratingFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sort,
        ...(ratingFilter && { rating: ratingFilter })
      });

      console.log('Fetching reviews for:', targetType, targetId);
      
      const res = await fetch(`http://localhost:3000/api/reviews/target/${targetType}/${targetId}?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await res.json();
      console.log('API Response:', data);
      
      if (!res.ok) throw new Error(data.message || 'Failed to fetch reviews');
      
      setReviews(data.reviews || []);
      setStats(data.stats);
      setPagination({
        ...pagination,
        total: data.total || 0,
        pages: data.pages || 0
      });
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
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
    if (!token) {
      toast.error('Please login to mark reviews as helpful');
      return;
    }

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
      <span className="text-amber-500 text-xl">
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

  const getTargetIcon = () => {
    switch (targetType) {
      case 'Farmer': return '🌾';
      case 'Transporter': return '🚚';
      case 'Distributor': return '🏪';
      default: return '⭐';
    }
  };

  const getTargetColor = () => {
    switch (targetType) {
      case 'Farmer': return 'emerald';
      case 'Transporter': return 'blue';
      case 'Distributor': return 'amber';
      default: return 'slate';
    }
  };

  const getTargetTitle = () => {
    switch (targetType) {
      case 'Farmer': return 'Farmer Reviews';
      case 'Transporter': return 'Transporter Reviews';
      case 'Distributor': return 'Distributor Reviews';
      default: return 'Reviews';
    }
  };

  const isTargetOwner = user && user.id === targetId;

  if (error) {
    return (
      <>
        <ProfileNav active="reviews" links={[{ key: 'dashboard', label: 'Dashboard', to: '/dashboard' }]} />
        <div className="min-h-screen bg-slate-50 px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl bg-red-50 p-8 text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button onClick={fetchReviews} className="rounded-lg bg-red-600 px-4 py-2 text-white">
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
      <ProfileNav active="reviews" links={[
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard' }
      ]} />
      
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="mb-4 flex items-center gap-2 text-sm text-emerald-600 hover:underline"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <span className="text-5xl">{getTargetIcon()}</span>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{getTargetTitle()}</h1>
                <p className="text-slate-600">Real feedback from verified buyers</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="mb-8 grid gap-6 md:grid-cols-3">
              {/* Average Rating Card */}
              <div className={`rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-${getTargetColor()}-200`}>
                <p className="text-sm text-slate-500">Average Rating</p>
                <p className="text-5xl font-bold text-${getTargetColor()}-600 mt-2">{stats.averageRating?.toFixed(1) || '0.0'}</p>
                <div className="mt-2">
                  {renderStars(stats.averageRating || 0)}
                </div>
                <p className="text-xs text-slate-400 mt-2">from {stats.totalReviews || 0} reviews</p>
              </div>

              {/* Rating Distribution Card */}
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-3">Rating Distribution</p>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = stats.ratingDistribution?.[star] || 0;
                    const percentage = stats.totalReviews ? (count / stats.totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="w-8 text-slate-600">{star}★</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-${getTargetColor()}-400 rounded-full transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-slate-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className={`rounded-2xl bg-${getTargetColor()}-50 p-6 shadow-sm`}>
                <p className="text-sm font-semibold text-${getTargetColor()}-800 mb-3">Quick Stats</p>
                <div className="space-y-2 text-sm">
                  {stats.farmerSpecific?.averageProductQuality > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Product Quality:</span>
                      <span className={`font-semibold text-${getTargetColor()}-700`}>
                        {stats.farmerSpecific.averageProductQuality.toFixed(1)}/5
                      </span>
                    </div>
                  )}
                  {stats.farmerSpecific?.averageFreshness > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Freshness:</span>
                      <span className={`font-semibold text-${getTargetColor()}-700`}>
                        {stats.farmerSpecific.averageFreshness.toFixed(1)}/5
                      </span>
                    </div>
                  )}
                  {stats.transporterSpecific?.averageTimeliness > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Timeliness:</span>
                      <span className={`font-semibold text-${getTargetColor()}-700`}>
                        {stats.transporterSpecific.averageTimeliness.toFixed(1)}/5
                      </span>
                    </div>
                  )}
                  {stats.transporterSpecific?.averageProfessionalism > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Professionalism:</span>
                      <span className={`font-semibold text-${getTargetColor()}-700`}>
                        {stats.transporterSpecific.averageProfessionalism.toFixed(1)}/5
                      </span>
                    </div>
                  )}
                  {stats.distributorSpecific?.averagePaymentReliability > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Payment Reliability:</span>
                      <span className={`font-semibold text-${getTargetColor()}-700`}>
                        {stats.distributorSpecific.averagePaymentReliability.toFixed(1)}/5
                      </span>
                    </div>
                  )}
                  {stats.totalReviews === 0 && (
                    <p className="text-center text-slate-500 text-sm">No reviews yet</p>
                  )}
                </div>
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
              <div className="text-6xl mb-4">📝</div>
              <p className="text-slate-500 mb-4">No reviews yet. Be the first to leave a review!</p>
              {user?.role === 'Distributor' && (
                <Link to="/pending-reviews" className="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700">
                  Write a Review
                </Link>
              )}
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
                              ✓ Verified Purchase
                            </span>
                          </>
                        )}
                      </div>
                      
                      {review.title && (
                        <h3 className="mt-3 text-lg font-semibold text-slate-900">{review.title}</h3>
                      )}
                      
                      <p className="mt-2 text-slate-700 leading-relaxed">{review.comment}</p>
                      
                      {/* Criteria Badges */}
                      {review.criteria && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {review.criteria.productQuality && (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                              Product Quality: {review.criteria.productQuality}/5
                            </span>
                          )}
                          {review.criteria.freshness && (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                              Freshness: {review.criteria.freshness}/5
                            </span>
                          )}
                          {review.criteria.timeliness && (
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                              Timeliness: {review.criteria.timeliness}/5
                            </span>
                          )}
                          {review.criteria.professionalism && (
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                              Professionalism: {review.criteria.professionalism}/5
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-4 flex items-center gap-4">
                        <div className="text-sm text-slate-500">
                          By <span className="font-semibold text-slate-700">{review.reviewer?.fullName || 'Anonymous'}</span>
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
                    <div className={`mt-4 rounded-lg bg-${getTargetColor()}-50 p-4 border-l-4 border-${getTargetColor()}-500`}>
                      <p className="text-sm font-semibold text-${getTargetColor()}-800 mb-1">Response from {targetType}:</p>
                      <p className="text-sm text-${getTargetColor()}-700">{review.response.text}</p>
                      <p className="mt-2 text-xs text-${getTargetColor()}-500">
                        Responded on {formatDate(review.response.respondedAt)}
                      </p>
                    </div>
                  ) : isTargetOwner && respondingTo === review._id ? (
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
                  ) : isTargetOwner && !review.response?.text ? (
                    <button
                      onClick={() => setRespondingTo(review._id)}
                      className={`mt-4 text-sm font-semibold text-${getTargetColor()}-600 hover:underline`}
                    >
                      Respond to this review
                    </button>
                  ) : null}
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

export default ProductReviews;