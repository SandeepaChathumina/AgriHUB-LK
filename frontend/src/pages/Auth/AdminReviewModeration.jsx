// src/pages/Auth/AdminReviewModeration.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import AdminNav from '../../components/AdminNav'

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
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">⭐ Review Moderation</h1>
              <p className="text-slate-600">Approve, reject, or delete user reviews</p>
            </div>
            <button
              onClick={fetchReviews}
              className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700">Status:</label>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="All">All</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700">Target Type:</label>
              <select
                value={targetTypeFilter}
                onChange={(e) => {
                  setTargetTypeFilter(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="All">All</option>
                <option value="Farmer">Farmer</option>
                <option value="Transporter">Transporter</option>
                <option value="Distributor">Distributor</option>
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
              <div className="text-6xl mb-4">📝</div>
              <p className="text-slate-500">No reviews found with the selected filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getTargetIcon(review.targetType)}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {review.targetType} Review
                            </h3>
                            {getStatusBadge(review.moderationStatus)}
                          </div>
                          <p className="text-sm text-slate-500">
                            Target: {review.targetId?.fullName || review.targetId?.businessName || review.targetId?.companyName || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-amber-500">{renderStars(review.rating)}</div>
                        <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      {review.title && (
                        <h4 className="font-semibold text-slate-900">{review.title}</h4>
                      )}
                      <p className="mt-1 text-slate-700">{review.comment}</p>
                      
                      {/* Criteria */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {review.criteria?.productQuality && (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Product Quality: {review.criteria.productQuality}/5
                          </span>
                        )}
                        {review.criteria?.freshness && (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Freshness: {review.criteria.freshness}/5
                          </span>
                        )}
                        {review.criteria?.timeliness && (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                            Timeliness: {review.criteria.timeliness}/5
                          </span>
                        )}
                        {review.criteria?.professionalism && (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                            Professionalism: {review.criteria.professionalism}/5
                          </span>
                        )}
                      </div>

                      <div className="mt-3 text-sm text-slate-500">
                        <p>Reviewer: {review.reviewer?.fullName || 'Anonymous'} ({review.reviewer?.role})</p>
                        <p>Order ID: {review.order?._id?.slice(-8) || 'N/A'}</p>
                        {review.isVerifiedPurchase && (
                          <p className="text-emerald-600">✓ Verified Purchase</p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-3 border-t border-slate-100">
                      {review.moderationStatus === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleModerate(review._id, 'Approved')}
                            disabled={moderatingId === review._id}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleModerate(review._id, 'Rejected')}
                            disabled={moderatingId === review._id}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(review._id)}
                        disabled={moderatingId === review._id}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
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
  )
}

export default AdminReviewModeration