// src/pages/Auth/AdminReviewModeration.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import AdminNav from '../../components/AdminNav'
import AdminFooter from '../Admin/AdminFooter'

const AdminReviewModeration = () => {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Pending')
  const [targetTypeFilter, setTargetTypeFilter] = useState('All')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [moderatingId, setModeratingId] = useState(null)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    if (user?.role !== 'Admin') {
      toast.error('Access denied. Admin only.')
      navigate('/dashboard')
      return
    }
    fetchReviews()
  }, [token, user, pagination.page, filter, targetTypeFilter])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        status: filter,
        ...(targetTypeFilter !== 'All' && { targetType: targetTypeFilter })
      })

      const res = await fetch(`http://localhost:3000/api/reviews/admin/moderation?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.message || 'Failed to fetch reviews')
      
      setReviews(data.reviews || [])
      setPagination({
        ...pagination,
        total: data.total || 0,
        pages: data.pages || 0
      })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleModerate = async (reviewId, status) => {
    setModeratingId(reviewId)
    try {
      const res = await fetch(`http://localhost:3000/api/reviews/admin/${reviewId}/moderate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.message || 'Failed to moderate review')
      
      toast.success(`Review ${status.toLowerCase()} successfully`)
      fetchReviews()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setModeratingId(null)
    }
  }

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) return
    
    try {
      const res = await fetch(`http://localhost:3000/api/reviews/admin/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.message || 'Failed to delete review')
      
      toast.success('Review deleted successfully')
      fetchReviews()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const renderStars = (rating) => {
    const fullStars = Math.round(rating || 0)
    const emptyStars = 5 - fullStars
    return (
      <span className="text-amber-500">
        {'★'.repeat(fullStars)}{'☆'.repeat(emptyStars)}
      </span>
    )
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString()
  }

  const getTargetIcon = (type) => {
    switch (type) {
      case 'Farmer': return '🌾'
      case 'Transporter': return '🚚'
      case 'Distributor': return '🏪'
      default: return '⭐'
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">Pending</span>
      case 'Approved':
        return <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Approved</span>
      case 'Rejected':
        return <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">Rejected</span>
      default:
        return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{status}</span>
    }
  }

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f0fdf4] to-[#f8fafc] px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-emerald-950 drop-shadow-sm mb-2" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>⭐ Review Moderation</h1>
              <p className="text-emerald-700/80 font-medium tracking-wide">Approve, reject, or manage community feedback</p>
            </div>
            <button
              onClick={fetchReviews}
              className="rounded-2xl border-2 border-emerald-100 bg-white/80 px-5 py-2.5 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 hover:border-emerald-200 active:scale-[0.98]"
            >
              ⟳ Refresh Data
            </button>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-wrap gap-5 rounded-3xl bg-white/60 backdrop-blur-2xl p-5 shadow-xl shadow-emerald-900/5 border border-white/80">
            <div className="flex items-center gap-3">
              <label className="text-xs font-black uppercase tracking-widest text-emerald-600/80">Status:</label>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="rounded-2xl border-0 bg-white/80 px-4 py-2.5 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="All">All</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-black uppercase tracking-widest text-emerald-600/80">Context:</label>
              <select
                value={targetTypeFilter}
                onChange={(e) => {
                  setTargetTypeFilter(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="rounded-2xl border-0 bg-white/80 px-4 py-2.5 shadow-inner ring-1 ring-emerald-100 focus:bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all text-emerald-950 font-bold"
              >
                <option value="All">All Entities</option>
                <option value="Farmer">Farmers</option>
                <option value="Transporter">Transporters</option>
                <option value="Distributor">Distributors</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="text-emerald-500/60 font-semibold tracking-widest uppercase">Loading reviews...</div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-[32px] bg-white/60 backdrop-blur-xl p-16 text-center shadow-xl shadow-emerald-900/5 border border-white/80 flex flex-col items-center justify-center">
              <div className="text-7xl mb-6 opacity-40 grayscale">📝</div>
              <p className="text-emerald-900/40 font-bold tracking-wide">No feedback records found.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {reviews.map(review => (
                <div key={review._id} className="rounded-[32px] bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-emerald-900/5 border border-white transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/10">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f8fafc] to-[#f0fdf4] shadow-inner ring-1 ring-emerald-100 flex items-center justify-center text-3xl">
                          {getTargetIcon(review.targetType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-extrabold text-emerald-950">
                              {review.targetType} Review
                            </h3>
                            {getStatusBadge(review.moderationStatus)}
                          </div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600/70">
                            Subject: <span className="font-bold text-emerald-800">{review.targetId?.fullName || review.targetId?.businessName || review.targetId?.companyName || 'N/A'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <div className="rounded-full bg-amber-50 px-3 py-1 ring-1 ring-amber-100/50 shadow-sm">{renderStars(review.rating)}</div>
                        <p className="text-[10px] font-bold text-emerald-600/50 uppercase tracking-widest">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>

                    <div className="border-t border-emerald-50/50 pt-5">
                      {review.title && (
                        <h4 className="font-black text-lg text-emerald-950 mb-2">{review.title}</h4>
                      )}
                      <p className="text-emerald-900/80 font-medium leading-relaxed bg-white/60 rounded-2xl p-4 shadow-inner ring-1 ring-emerald-50">{review.comment}</p>
                      
                      {/* Criteria */}
                      <div className="mt-5 flex flex-wrap gap-2">
                        {review.criteria?.productQuality && (
                          <span className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                            Product Quality: {review.criteria.productQuality}/5
                          </span>
                        )}
                        {review.criteria?.freshness && (
                          <span className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                            Freshness: {review.criteria.freshness}/5
                          </span>
                        )}
                        {review.criteria?.timeliness && (
                          <span className="rounded-lg border border-teal-100 bg-teal-50/50 px-3 py-1.5 text-xs font-bold text-teal-700 shadow-sm">
                            Timeliness: {review.criteria.timeliness}/5
                          </span>
                        )}
                        {review.criteria?.professionalism && (
                          <span className="rounded-lg border border-teal-100 bg-teal-50/50 px-3 py-1.5 text-xs font-bold text-teal-700 shadow-sm">
                            Professionalism: {review.criteria.professionalism}/5
                          </span>
                        )}
                      </div>

                      <div className="mt-6 flex flex-wrap gap-6 text-[11px] uppercase tracking-widest font-bold text-emerald-600/50">
                        <p>Author: <span className="text-emerald-700">{review.reviewer?.fullName || 'Anonymous'}</span> <span className="bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-600">({review.reviewer?.role})</span></p>
                        <p>Order Ref: <span className="text-emerald-700 font-mono bg-white/80 shadow-inner px-1.5 py-0.5 rounded">{review.order?._id?.slice(-8) || 'N/A'}</span></p>
                        {review.isVerifiedPurchase && (
                          <p className="flex items-center gap-1 text-emerald-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                            Verified Origin
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-5 border-t border-emerald-50/50 mt-2">
                      {review.moderationStatus === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleModerate(review._id, 'Approved')}
                            disabled={moderatingId === review._id}
                            className="rounded-2xl border border-emerald-400 bg-gradient-to-br from-emerald-400 to-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/30 active:scale-95 disabled:opacity-50"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleModerate(review._id, 'Rejected')}
                            disabled={moderatingId === review._id}
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-bold text-rose-700 shadow-sm transition-all hover:bg-rose-100 hover:border-rose-300 active:scale-95 disabled:opacity-50"
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(review._id)}
                        disabled={moderatingId === review._id}
                        className="rounded-2xl border border-rose-200 bg-white/80 backdrop-blur-sm px-5 py-2.5 text-sm font-bold text-rose-600 shadow-sm transition-all hover:bg-rose-50 hover:border-rose-300 active:scale-95 disabled:opacity-50 ml-auto"
                      >
                        🗑 Delete Record
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

      <AdminFooter/>
    </>
  )
}

export default AdminReviewModeration