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
        <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f0fdf4] to-[#f8fafc] px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-[32px] bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-red-900/5 p-12 text-center">
              <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-100">
                <span className="text-4xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-extrabold text-red-900 mb-3">Error Loading Data</h2>
              <p className="text-red-700/80 font-medium">{error}</p>
              <button
                onClick={fetchReviews}
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
      <ProfileNav active="reviews" links={[
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard' }
      ]} />
      
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f0fdf4] to-[#f8fafc] px-4 py-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-10">
            <button
              onClick={() => navigate(-1)}
              className="mb-6 flex items-center gap-2 text-sm font-bold tracking-wide text-emerald-600 hover:text-emerald-700 transition"
            >
              ← Back
            </button>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-[24px] bg-white shadow-xl shadow-emerald-900/10 flex items-center justify-center text-4xl border border-emerald-50">
                 {getTargetIcon()}
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-emerald-950 mb-2 drop-shadow-sm" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{getTargetTitle()}</h1>
                <p className="text-emerald-700/80 font-medium tracking-wide">Real feedback from verified buyers and partners</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="mb-10 grid gap-6 md:grid-cols-3">
              {/* Average Rating Card */}
              <div className={`rounded-[32px] bg-white/80 backdrop-blur-xl p-8 text-center shadow-xl shadow-${getTargetColor()}-900/5 border border-white transition-transform hover:-translate-y-1`}>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Average Rating</p>
                <p className={`text-6xl font-black text-${getTargetColor()}-600 drop-shadow-sm`}>{stats.averageRating?.toFixed(1) || '0.0'}</p>
                <div className="mt-4 filter drop-shadow-sm">
                  {renderStars(stats.averageRating || 0)}
                </div>
                <p className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-wider">based on {stats.totalReviews || 0} reviews</p>
              </div>

              {/* Rating Distribution Card */}
              <div className="rounded-[32px] bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-emerald-900/5 border border-white transition-transform hover:-translate-y-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-5">Rating Distribution</p>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = stats.ratingDistribution?.[star] || 0;
                    const percentage = stats.totalReviews ? (count / stats.totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3 text-sm">
                        <span className="w-8 font-bold text-slate-600">{star}★</span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full bg-gradient-to-r from-${getTargetColor()}-400 to-${getTargetColor()}-500 rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-bold text-slate-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className={`rounded-[32px] bg-gradient-to-br from-${getTargetColor()}-50 to-white/50 backdrop-blur-xl p-8 shadow-xl shadow-${getTargetColor()}-900/5 border border-white transition-transform hover:-translate-y-1`}>
                <p className={`text-[11px] font-black uppercase tracking-widest text-${getTargetColor()}-800 mb-5`}>Performance Metrics</p>
                <div className="space-y-4 text-sm font-medium">
                  {stats.farmerSpecific?.averageProductQuality > 0 && (
                    <div className="flex justify-between items-center border-b border-white/50 pb-2">
                       <span className="text-slate-600">Product Quality</span>
                       <span className={`font-black text-lg text-${getTargetColor()}-700 bg-white px-2 py-0.5 rounded-lg shadow-sm`}>
                        {stats.farmerSpecific.averageProductQuality.toFixed(1)}<span className="text-xs opacity-50">/5</span>
                      </span>
                    </div>
                  )}
                  {stats.farmerSpecific?.averageFreshness > 0 && (
                    <div className="flex justify-between items-center border-b border-white/50 pb-2">
                       <span className="text-slate-600">Freshness</span>
                       <span className={`font-black text-lg text-${getTargetColor()}-700 bg-white px-2 py-0.5 rounded-lg shadow-sm`}>
                        {stats.farmerSpecific.averageFreshness.toFixed(1)}<span className="text-xs opacity-50">/5</span>
                      </span>
                    </div>
                  )}
                  {stats.transporterSpecific?.averageTimeliness > 0 && (
                     <div className="flex justify-between items-center border-b border-white/50 pb-2">
                       <span className="text-slate-600">Timeliness</span>
                       <span className={`font-black text-lg text-${getTargetColor()}-700 bg-white px-2 py-0.5 rounded-lg shadow-sm`}>
                        {stats.transporterSpecific.averageTimeliness.toFixed(1)}<span className="text-xs opacity-50">/5</span>
                      </span>
                    </div>
                  )}
                  {stats.transporterSpecific?.averageProfessionalism > 0 && (
                     <div className="flex justify-between items-center border-b border-white/50 pb-2">
                       <span className="text-slate-600">Professionalism</span>
                       <span className={`font-black text-lg text-${getTargetColor()}-700 bg-white px-2 py-0.5 rounded-lg shadow-sm`}>
                        {stats.transporterSpecific.averageProfessionalism.toFixed(1)}<span className="text-xs opacity-50">/5</span>
                      </span>
                    </div>
                  )}
                  {stats.distributorSpecific?.averagePaymentReliability > 0 && (
                     <div className="flex justify-between items-center border-b border-white/50 pb-2">
                       <span className="text-slate-600">Payment Reliability</span>
                       <span className={`font-black text-lg text-${getTargetColor()}-700 bg-white px-2 py-0.5 rounded-lg shadow-sm`}>
                        {stats.distributorSpecific.averagePaymentReliability.toFixed(1)}<span className="text-xs opacity-50">/5</span>
                      </span>
                    </div>
                  )}
                  {stats.totalReviews === 0 && (
                    <div className="h-full flex items-center justify-center">
                       <p className="text-center text-slate-500 text-sm font-bold opacity-60">Not enough data yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-8 flex flex-wrap gap-4 rounded-3xl bg-white/60 backdrop-blur-2xl p-5 shadow-xl shadow-emerald-900/5 border border-white/80 items-center">
            <div className="flex items-center gap-3">
              <label className="text-xs font-black uppercase tracking-widest text-emerald-600/80">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-40 rounded-2xl border-0 bg-white/80 px-4 py-3 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-black uppercase tracking-widest text-emerald-600/80">Filter</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-40 rounded-2xl border-0 bg-white/80 px-4 py-3 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold text-sm"
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
              className="ml-auto rounded-2xl border-2 border-emerald-100 bg-white/80 px-6 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 active:scale-95 transition-all shadow-sm"
            >
              Reset Filters
            </button>
          </div>

          {/* Reviews List */}
          {loading ? (
            <div className="flex justify-center py-16">
               <div className="text-emerald-500/60 font-semibold tracking-widest uppercase">Loading feedback...</div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-[32px] bg-white/60 backdrop-blur-xl p-16 text-center shadow-xl shadow-emerald-900/5 border border-white/80">
              <div className="text-7xl mb-6 opacity-40 grayscale">📝</div>
              <p className="text-emerald-900/40 font-bold tracking-wide mb-6">No reviews yet. Be the first to leave a review!</p>
              {user?.role === 'Distributor' && (
                <Link to="/pending-reviews" className="inline-block rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-8 py-4 text-white font-black tracking-wide shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all">
                  Write a Review
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review._id} className="group rounded-[32px] bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-emerald-900/5 border border-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/10">
                  <div className="flex flex-col gap-5">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-4 border-b border-emerald-50/50 pb-4 mb-4">
                        <div className="flex items-center gap-1 text-amber-500 text-xl filter drop-shadow-sm">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm font-bold text-slate-400">•</span>
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{formatDate(review.createdAt)}</span>
                        {review.isVerifiedPurchase && (
                          <>
                            <span className="text-sm text-slate-400">•</span>
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-black tracking-widest text-emerald-600 uppercase shadow-sm border border-emerald-100/50">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg> Verified
                            </span>
                          </>
                        )}
                      </div>
                      
                      {review.title && (
                        <h3 className="text-xl font-extrabold text-emerald-950 mb-2">{review.title}</h3>
                      )}
                      
                      <p className="text-slate-600 font-medium leading-relaxed">{review.comment}</p>
                      
                      {/* Criteria Badges */}
                      {review.criteria && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {review.criteria.productQuality && (
                            <div className="rounded-xl bg-teal-50 border border-teal-100/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-teal-700 flex items-center gap-2">
                              <span>Quality</span>
                              <span className="bg-white rounded px-1.5 py-0.5 shadow-sm">{review.criteria.productQuality}/5</span>
                            </div>
                          )}
                          {review.criteria.freshness && (
                            <div className="rounded-xl bg-emerald-50 border border-emerald-100/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                              <span>Freshness</span>
                              <span className="bg-white rounded px-1.5 py-0.5 shadow-sm">{review.criteria.freshness}/5</span>
                            </div>
                          )}
                          {review.criteria.timeliness && (
                            <div className="rounded-xl bg-blue-50 border border-blue-100/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700 flex items-center gap-2">
                              <span>Time</span>
                              <span className="bg-white rounded px-1.5 py-0.5 shadow-sm">{review.criteria.timeliness}/5</span>
                            </div>
                          )}
                          {review.criteria.professionalism && (
                            <div className="rounded-xl bg-indigo-50 border border-indigo-100/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-700 flex items-center gap-2">
                              <span>Pro</span>
                              <span className="bg-white rounded px-1.5 py-0.5 shadow-sm">{review.criteria.professionalism}/5</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-6 pt-4 border-t border-emerald-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold uppercase ring-2 ring-white">
                              {review.reviewer?.fullName?.charAt(0) || 'A'}
                           </div>
                           <div className="text-sm font-semibold text-slate-600">
                             {review.reviewer?.fullName || 'Anonymous'}
                           </div>
                        </div>
                        <button
                          onClick={() => markHelpful(review._id)}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${review.helpfulCount > 0 ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 ring-1 ring-slate-200'}`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>
                          Helpful {review.helpfulCount > 0 && <span className="bg-white px-1.5 rounded text-emerald-700">{review.helpfulCount}</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Response Section */}
                  {review.response?.text ? (
                    <div className={`mt-6 rounded-2xl bg-gradient-to-br from-${getTargetColor()}-50 to-white p-6 border border-${getTargetColor()}-100 shadow-sm relative overflow-hidden`}>
                      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${getTargetColor()}-400`}></div>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className={`w-4 h-4 text-${getTargetColor()}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                        <p className={`text-xs font-black uppercase tracking-widest text-${getTargetColor()}-800`}>Response from {targetType}</p>
                      </div>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed pl-6">{review.response.text}</p>
                      <p className={`mt-3 pl-6 text-[10px] font-bold uppercase tracking-widest text-${getTargetColor()}-500/80`}>
                        {formatDate(review.response.respondedAt)}
                      </p>
                    </div>
                  ) : isTargetOwner && respondingTo === review._id ? (
                    <div className="mt-6 rounded-2xl bg-slate-50/50 p-5 ring-1 ring-emerald-100">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Write your response to this review..."
                        rows="3"
                        className="w-full rounded-xl border-0 bg-white px-4 py-3 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all font-medium text-sm"
                      />
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => handleRespond(review._id)}
                          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all"
                        >
                          Submit Response
                        </button>
                        <button
                          onClick={() => {
                            setRespondingTo(null);
                            setResponseText('');
                          }}
                          className="rounded-xl border-2 border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : isTargetOwner && !review.response?.text ? (
                    <button
                      onClick={() => setRespondingTo(review._id)}
                      className={`mt-5 flex items-center gap-2 rounded-xl bg-${getTargetColor()}-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-${getTargetColor()}-700 transition hover:bg-${getTargetColor()}-100 active:scale-95`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                      Respond
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
                className="rounded-2xl border-2 border-emerald-100 bg-white/50 px-6 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 disabled:opacity-50 transition-all active:scale-95"
              >
                Previous
              </button>
              <span className="px-6 py-2.5 text-sm font-bold text-slate-500">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="rounded-2xl border-2 border-emerald-100 bg-white/50 px-6 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 disabled:opacity-50 transition-all active:scale-95"
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