// src/pages/reviews/PendingReviews.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import ProfileNav from '../../components/ProfileNav';

const PendingReviews = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    criteria: {}
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'Distributor') {
      toast.error('Only distributors can access pending reviews');
      navigate('/dashboard');
      return;
    }
    fetchPendingReviews();
  }, [token, user]);

  const fetchPendingReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/reviews/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch pending reviews');
      setPendingOrders(data.orders || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (order, target) => {
    let criteria = {};
    
    if (target.type === 'Farmer') {
      criteria = { productQuality: 5, freshness: 5, packaging: 5 };
    } else if (target.type === 'Transporter') {
      criteria = { timeliness: 5, vehicleCondition: 5, professionalism: 5 };
    }
    
    setSelectedOrder(order);
    setSelectedTarget(target);
    setReviewForm({
      rating: 5,
      title: '',
      comment: '',
      criteria
    });
  };

  const handleCriteriaChange = (field, value) => {
    setReviewForm(prev => ({
      ...prev,
      criteria: { ...prev.criteria, [field]: value }
    }));
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        targetType: selectedTarget.type,
        targetId: selectedTarget.targetId,
        orderId: selectedOrder._id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
        criteria: reviewForm.criteria
      };

      const res = await fetch('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit review');

      toast.success(`Review for ${selectedTarget.type} submitted successfully!`);
      setSelectedOrder(null);
      setSelectedTarget(null);
      fetchPendingReviews();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, onChange) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-3xl transition hover:scale-110 ${
              rating >= star ? 'text-amber-500' : 'text-slate-300'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const renderFarmerCriteria = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">🌾 Product Quality</label>
        {renderStars(reviewForm.criteria.productQuality, (val) => handleCriteriaChange('productQuality', val))}
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">🌿 Freshness</label>
        {renderStars(reviewForm.criteria.freshness, (val) => handleCriteriaChange('freshness', val))}
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">📦 Packaging</label>
        {renderStars(reviewForm.criteria.packaging, (val) => handleCriteriaChange('packaging', val))}
      </div>
    </div>
  );

  const renderTransporterCriteria = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">⏱️ Timeliness</label>
        {renderStars(reviewForm.criteria.timeliness, (val) => handleCriteriaChange('timeliness', val))}
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">🚛 Vehicle Condition</label>
        {renderStars(reviewForm.criteria.vehicleCondition, (val) => handleCriteriaChange('vehicleCondition', val))}
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">💼 Professionalism</label>
        {renderStars(reviewForm.criteria.professionalism, (val) => handleCriteriaChange('professionalism', val))}
      </div>
    </div>
  );

  return (
    <>
      <ProfileNav active="reviews" links={[
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
        { key: 'my-ratings', label: 'My Ratings', to: `/reviews/Distributor/${user?.id}` }
      ]} />
      
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">⭐ Pending Reviews</h1>
            <p className="text-slate-600">Rate farmers and transporters after delivery completion</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-slate-500">Loading...</div>
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-slate-500 mb-4">No pending reviews. You've reviewed all completed orders!</p>
              <p className="text-sm text-slate-400">New reviews appear after orders are marked as "Delivered"</p>
              <Link to="/dashboard" className="mt-4 inline-block text-emerald-600 hover:underline">
                Return to Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map(item => (
                <div key={item.order._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">
                        Order #{item.order._id.slice(-8)} • {new Date(item.order.createdAt).toLocaleDateString()}
                      </p>
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        Delivered
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      Product: {item.order.productName} • Total: LKR {item.order.totalPrice?.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {item.reviewableTargets.map(target => (
                      <div key={target.type} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {target.type === 'Farmer' ? '🌾' : '🚚'}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900">
                                Rate {target.type}
                              </p>
                              <p className="text-sm text-slate-600">
                                {target.targetName}
                              </p>
                              {target.type === 'Farmer' && (
                                <p className="text-xs text-emerald-600 mt-1">Rate product quality, freshness & packaging</p>
                              )}
                              {target.type === 'Transporter' && (
                                <p className="text-xs text-blue-600 mt-1">Rate timeliness, vehicle condition & professionalism</p>
                              )}
                            </div>
                          </div>
                        </div>
                        {target.isReviewed ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                            ✓ Reviewed
                          </span>
                        ) : (
                          <button
                            onClick={() => openReviewModal(item.order, target)}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                          >
                            Write Review
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedOrder && selectedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {selectedTarget.type === 'Farmer' ? '🌾' : '🚚'}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Rate {selectedTarget.type}
                  </h2>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Order #{selectedOrder._id.slice(-8)} • {selectedTarget.targetName}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setSelectedTarget(null);
                }}
                className="text-2xl text-slate-400 hover:text-slate-600 transition"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-5">
              {/* Overall Rating */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Overall Rating *
                </label>
                {renderStars(reviewForm.rating, (val) => setReviewForm(prev => ({ ...prev, rating: val })))}
              </div>
              
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Review Title
                </label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Summarize your experience"
                  className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              
              {/* Comment */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Review Comment *
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  rows="4"
                  placeholder="Share your detailed experience..."
                  className="w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              
              {/* Criteria Fields */}
              {selectedTarget.type === 'Farmer' && renderFarmerCriteria()}
              {selectedTarget.type === 'Transporter' && renderTransporterCriteria()}
              
              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setSelectedTarget(null);
                  }}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PendingReviews;