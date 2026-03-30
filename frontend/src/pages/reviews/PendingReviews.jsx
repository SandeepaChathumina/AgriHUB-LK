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
    fetchPendingReviews();
  }, [token]);

  const fetchPendingReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/reviews/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch pending reviews');
      const data = await res.json();
      setPendingOrders(data.orders || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (order, target) => {
    // Initialize criteria based on target type
    let criteria = {};
    if (target.type === 'Farmer') {
      criteria = { productQuality: 5, freshness: 5, packaging: 5 };
    } else if (target.type === 'Transporter') {
      criteria = { timeliness: 5, vehicleCondition: 5, professionalism: 5 };
    } else if (target.type === 'Distributor') {
      criteria = { paymentReliability: 5, communication: 5, wouldWorkAgain: true };
    }
    
    setSelectedOrder({ order, target });
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
        targetType: selectedOrder.target.type,
        targetId: selectedOrder.target.targetId,
        orderId: selectedOrder.order._id,
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

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      setSelectedOrder(null);
      fetchPendingReviews();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCriteriaFields = () => {
    if (!selectedOrder) return null;
    
    const targetType = selectedOrder.target.type;
    
    if (targetType === 'Farmer') {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-semibold text-slate-900">Product Quality</h4>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleCriteriaChange('productQuality', star)}
                  className={`text-3xl ${reviewForm.criteria.productQuality >= star ? 'text-amber-500' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="mb-2 font-semibold text-slate-900">Freshness</h4>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleCriteriaChange('freshness', star)}
                  className={`text-3xl ${reviewForm.criteria.freshness >= star ? 'text-amber-500' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="mb-2 font-semibold text-slate-900">Packaging</h4>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleCriteriaChange('packaging', star)}
                  className={`text-3xl ${reviewForm.criteria.packaging >= star ? 'text-amber-500' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    if (targetType === 'Transporter') {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-semibold text-slate-900">Timeliness</h4>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleCriteriaChange('timeliness', star)}
                  className={`text-3xl ${reviewForm.criteria.timeliness >= star ? 'text-amber-500' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="mb-2 font-semibold text-slate-900">Vehicle Condition</h4>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleCriteriaChange('vehicleCondition', star)}
                  className={`text-3xl ${reviewForm.criteria.vehicleCondition >= star ? 'text-amber-500' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="mb-2 font-semibold text-slate-900">Professionalism</h4>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleCriteriaChange('professionalism', star)}
                  className={`text-3xl ${reviewForm.criteria.professionalism >= star ? 'text-amber-500' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    if (targetType === 'Distributor') {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-semibold text-slate-900">Payment Reliability</h4>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleCriteriaChange('paymentReliability', star)}
                  className={`text-3xl ${reviewForm.criteria.paymentReliability >= star ? 'text-amber-500' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="mb-2 font-semibold text-slate-900">Communication</h4>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleCriteriaChange('communication', star)}
                  className={`text-3xl ${reviewForm.criteria.communication >= star ? 'text-amber-500' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-slate-900">Would work again?</h4>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={reviewForm.criteria.wouldWorkAgain}
                onChange={(e) => handleCriteriaChange('wouldWorkAgain', e.target.checked)}
                className="rounded border-emerald-300"
              />
              <span>Yes, I would work with this distributor again</span>
            </label>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <>
      <ProfileNav active="reviews" links={[
        { key: 'dashboard', label: 'Dashboard', to: '/dashboard' }
      ]} />
      
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Pending Reviews</h1>
            <p className="text-slate-600">Share your experience with recent transactions</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-slate-500">Loading...</div>
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-slate-500">No pending reviews. You've reviewed all completed orders!</p>
              <Link to="/dashboard" className="mt-4 inline-block text-emerald-600 hover:underline">
                Return to Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map(item => (
                <div key={item.order._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <div className="mb-4 border-b border-slate-100 pb-4">
                    <p className="text-sm text-slate-500">
                      Order #{item.order._id.slice(-8)} • {new Date(item.order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-600">
                      Total: LKR {item.order.totalPrice}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {item.reviewableTargets.map(target => (
                      <div key={target.type} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            Review {target.type}
                          </p>
                          <p className="text-sm text-slate-600">
                            {target.targetName}
                          </p>
                        </div>
                        {target.isReviewed ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700">
                            ✓ Reviewed
                          </span>
                        ) : (
                          <button
                            onClick={() => openReviewModal(item.order, target)}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
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
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Review {selectedOrder.target.type}
                </h2>
                <p className="text-sm text-slate-500">
                  Order #{selectedOrder.order._id.slice(-8)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-2xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Rating */}
              <div>
                <label className="block text-sm font-semibold text-slate-700">Overall Rating *</label>
                <div className="mt-1 flex gap-2">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      className={`text-3xl ${reviewForm.rating >= star ? 'text-amber-500' : 'text-slate-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700">Review Title</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Summarize your experience"
                  className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              
              {/* Comment */}
              <div>
                <label className="block text-sm font-semibold text-slate-700">Review Comment *</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  rows="4"
                  placeholder="Share your detailed experience..."
                  className="mt-1 w-full rounded-xl border border-emerald-200 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              
              {/* Criteria Fields */}
              {renderCriteriaFields()}
              
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
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
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