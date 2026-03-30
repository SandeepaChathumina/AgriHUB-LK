import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';

const ProductReviews = () => {
  const { targetType, targetId } = useParams();
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
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
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sort,
        ...(ratingFilter && { rating: ratingFilter })
      });

      const res = await fetch(`http://localhost:3000/api/reviews/target/${targetType}/${targetId}?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) throw new Error('Failed to fetch reviews');
      
      const data = await res.json();
      setReviews(data.reviews || []);
      setStats(data.stats);
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

      if (!res.ok) throw new Error('Failed to submit response');
      
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

      if (!res.ok) throw new Error('Failed to mark as helpful');
      
      toast.success('Marked as helpful');
      fetchReviews();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isTargetOwner = user && user.id === targetId;

  return (
    <>
      <ProfileNav active="reviews" links={[
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard' }
      ]} />
      
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <Link to="/dashboard" className="text-sm text-emerald-600 hover:underline">
              ← Back to Dashboard
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">
              {targetType} Reviews
            </h1>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">Average Rating</p>
                <p className="text-4xl font-bold text-emerald-600">{stats.averageRating?.toFixed(1) || '0.0'}</p>
                <div className="mt-1 text-lg text-amber-500">
                  {renderStars(Math.round(stats.averageRating || 0))}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">Total Reviews</p>
                <p className="text-4xl font-bold text-emerald-600">{stats.totalReviews || 0}</p>
              </div>
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">Rating Distribution</p>
                <div className="mt-2 space-y-1">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-8">{star}★</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${(stats.ratingDistribution?.[star] || 0) / (stats.totalReviews || 1) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-slate-600">{stats.ratingDistribution?.[star] || 0}</span>
                    </div>
                  ))}
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
                className="rounded-lg border border-emerald-200 px-3 py-2 text-sm"
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
                className="rounded-lg border border-emerald-200 px-3 py-2 text-sm"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-slate-500">Loading reviews...</div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-slate-500">No reviews yet. Be the first to leave a review!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-amber-500">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-slate-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.title && (
                        <h3 className="mt-2 text-lg font-semibold text-slate-900">{review.title}</h3>
                      )}
                      <p className="mt-2 text-slate-700">{review.comment}</p>
                      
                      {/* Review Criteria */}
                      {review.criteria && Object.keys(review.criteria).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-4 text-sm">
                          {review.criteria.productQuality && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-600">Product Quality:</span>
                              <span className="font-semibold text-amber-600">{review.criteria.productQuality}/5</span>
                            </div>
                          )}
                          {review.criteria.freshness && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-600">Freshness:</span>
                              <span className="font-semibold text-amber-600">{review.criteria.freshness}/5</span>
                            </div>
                          )}
                          {review.criteria.packaging && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-600">Packaging:</span>
                              <span className="font-semibold text-amber-600">{review.criteria.packaging}/5</span>
                            </div>
                          )}
                          {review.criteria.timeliness && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-600">Timeliness:</span>
                              <span className="font-semibold text-amber-600">{review.criteria.timeliness}/5</span>
                            </div>
                          )}
                          {review.criteria.professionalism && (
                            <div className="flex items-center gap-1">
                              <span className="text-slate-600">Professionalism:</span>
                              <span className="font-semibold text-amber-600">{review.criteria.professionalism}/5</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Reviewer Info */}
                      <div className="mt-3 text-sm text-slate-500">
                        By {review.reviewer?.fullName || 'Anonymous'} • 
                        {review.isVerifiedPurchase && (
                          <span className="ml-1 text-emerald-600">Verified Purchase</span>
                        )}
                      </div>
                      
                      {/* Helpful Button */}
                      <button
                        onClick={() => markHelpful(review._id)}
                        className="mt-3 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-600 transition hover:bg-slate-200"
                      >
                        👍 Helpful ({review.helpfulCount || 0})
                      </button>
                    </div>
                  </div>
                  
                  {/* Response Section */}
                  {review.response?.text ? (
                    <div className="mt-4 rounded-lg bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-800">Response from {targetType}:</p>
                      <p className="mt-1 text-sm text-emerald-700">{review.response.text}</p>
                      <p className="mt-1 text-xs text-emerald-500">
                        Responded on {formatDate(review.response.respondedAt)}
                      </p>
                    </div>
                  ) : isTargetOwner && respondingTo === review._id ? (
                    <div className="mt-4">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Write your response..."
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
                      className="mt-4 text-sm font-semibold text-emerald-600 hover:underline"
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

export default ProductReviews;