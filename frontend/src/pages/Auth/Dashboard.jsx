// src/pages/Auth/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import FarmerPanel from './components/FarmerPanel'
import DistributorPanel from './components/DistributorPanel'
import TransporterPanel from './components/TransporterPanel'
import MemberPanel from './components/MemberPanel'

function Dashboard() {
  const { user, token, isAuthReady, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [requestingOtp, setRequestingOtp] = useState(false)
  const [reviewStats, setReviewStats] = useState(null)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const navigate = useNavigate()

  const displayName = profile?.fullName || user?.fullName || 'Guest User'
  const displayRole = profile?.role || user?.role || 'Member'
  const initial = (displayName?.[0] || 'U').toUpperCase()
  const isVerified = Boolean(profile?.isVerified ?? user?.isVerified)

  useEffect(() => {
    if (!isAuthReady) return

    if (!token) {
      navigate('/login')
      return
    }

    const role = profile?.role || user?.role
    if (role === 'Admin') {
      navigate('/admin-dashboard')
    }
  }, [token, user?.role, profile?.role, navigate, isAuthReady])

  useEffect(() => {
    if (!token) return
    fetchProfile()
  }, [token])

  // Fetch review stats for all roles
  useEffect(() => {
    if (token && (displayRole === 'Farmer' || displayRole === 'Transporter' || displayRole === 'Distributor')) {
      fetchReviewStats()
    }
  }, [token, displayRole])

  const fetchProfile = async () => {
    setLoadingProfile(true)
    try {
      const res = await fetch('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'Failed to load profile')
      }
      const data = await res.json()
      setProfile(data?.user || null)
    } catch (error) {
      toast.error(error?.message || 'Failed to load profile')
    } finally {
      setLoadingProfile(false)
    }
  }

  const fetchReviewStats = async () => {
    setLoadingReviews(true)
    try {
      const res = await fetch('http://localhost:3000/api/reviews/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to load review stats')
      }
      const data = await res.json()
      setReviewStats(data.stats)
    } catch (error) {
      console.error('Failed to load review stats:', error)
    } finally {
      setLoadingReviews(false)
    }
  }

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out?')
    if (!confirmed) return
    logout()
    navigate('/')
  }

  const handleVerify = async () => {
    if (!profile?.email && !user?.email) {
      toast.error('Email not available for verification')
      return
    }
    const email = profile?.email || user?.email

    setRequestingOtp(true)
    try {
      const res = await fetch('http://localhost:3000/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'Failed to request OTP')
      }

      const body = await res.json().catch(() => ({}))
      toast.success(body?.message || 'OTP sent to your email')
      navigate('/verify-email', { state: { email } })
    } catch (error) {
      toast.error(error?.message || 'Failed to request OTP')
    } finally {
      setRequestingOtp(false)
    }
  }

  // Render review stats based on role
  const renderReviewStats = () => {
    if (loadingReviews) {
      return (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center">
          <div className="text-sm text-slate-500">Loading your ratings...</div>
        </div>
      )
    }

    if (!reviewStats) return null

    // Farmer Stats
    if (displayRole === 'Farmer') {
      return (
        <div className="mt-4 rounded-xl bg-emerald-50 p-4 border border-emerald-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-emerald-800">🌾 Your Rating Stats</h3>
            <Link to={`/reviews/Farmer/${user?.id}`} className="text-xs text-emerald-600 hover:underline">
              View all reviews →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-700">{reviewStats.averageRating?.toFixed(1) || '0.0'}</p>
              <p className="text-xs text-emerald-600">Average Rating</p>
              <div className="text-amber-500 text-sm mt-1">
                {'★'.repeat(Math.round(reviewStats.averageRating || 0))}
                {'☆'.repeat(5 - Math.round(reviewStats.averageRating || 0))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-700">{reviewStats.totalReviews || 0}</p>
              <p className="text-xs text-emerald-600">Total Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-700">{reviewStats.productQuality?.toFixed(1) || '0.0'}/5</p>
              <p className="text-xs text-emerald-600">Product Quality</p>
            </div>
          </div>
          {reviewStats.totalReviews === 0 && (
            <p className="text-xs text-emerald-600 text-center mt-3">
              No reviews yet. Complete orders to receive ratings from distributors.
            </p>
          )}
        </div>
      )
    }

    // Transporter Stats
    if (displayRole === 'Transporter') {
      return (
        <div className="mt-4 rounded-xl bg-blue-50 p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-800">🚚 Your Rating Stats</h3>
            <Link to={`/reviews/Transporter/${user?.id}`} className="text-xs text-blue-600 hover:underline">
              View all reviews →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-700">{reviewStats.averageRating?.toFixed(1) || '0.0'}</p>
              <p className="text-xs text-blue-600">Average Rating</p>
              <div className="text-amber-500 text-sm mt-1">
                {'★'.repeat(Math.round(reviewStats.averageRating || 0))}
                {'☆'.repeat(5 - Math.round(reviewStats.averageRating || 0))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-700">{reviewStats.totalReviews || 0}</p>
              <p className="text-xs text-blue-600">Total Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-700">{reviewStats.timeliness?.toFixed(1) || '0.0'}/5</p>
              <p className="text-xs text-blue-600">Timeliness</p>
            </div>
          </div>
          {reviewStats.totalReviews === 0 && (
            <p className="text-xs text-blue-600 text-center mt-3">
              No reviews yet. Complete deliveries to receive ratings from distributors.
            </p>
          )}
        </div>
      )
    }

    // Distributor Stats
    if (displayRole === 'Distributor') {
      return (
        <div className="mt-4 rounded-xl bg-amber-50 p-4 border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-amber-800">🏪 Your Rating Stats</h3>
            <Link to={`/reviews/Distributor/${user?.id}`} className="text-xs text-amber-600 hover:underline">
              View all reviews →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-700">{reviewStats.averageRating?.toFixed(1) || '0.0'}</p>
              <p className="text-xs text-amber-600">Average Rating</p>
              <div className="text-amber-500 text-sm mt-1">
                {'★'.repeat(Math.round(reviewStats.averageRating || 0))}
                {'☆'.repeat(5 - Math.round(reviewStats.averageRating || 0))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-700">{reviewStats.totalReviews || 0}</p>
              <p className="text-xs text-amber-600">Total Reviews</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-700">{reviewStats.paymentReliability?.toFixed(1) || '0.0'}/5</p>
              <p className="text-xs text-amber-600">Payment Reliability</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-700">{reviewStats.communication?.toFixed(1) || '0.0'}/5</p>
              <p className="text-xs text-amber-600">Communication</p>
            </div>
          </div>
          {reviewStats.totalReviews === 0 && (
            <p className="text-xs text-amber-600 text-center mt-3">
              No reviews yet. After deliveries, farmers and transporters can rate you.
            </p>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        {/* Profile Header Card */}
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">
              {initial}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold text-slate-900">{displayName}</h1>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                  {displayRole}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
              <p className="text-sm text-slate-600">Securely manage your profile, actions, and quick links below.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/notifications"
              className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              🔔 Notifications
            </Link>
            {!isVerified && (
              <button
                onClick={handleVerify}
                className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                disabled={loadingProfile || requestingOtp}
              >
                {loadingProfile || requestingOtp ? 'Sending OTP...' : `Verify ${displayRole}`}
              </button>
            )}
            <button
              onClick={handleLogout}
              type="button"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Left Column - Profile Overview & Review Stats */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Overview</p>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Name</span>
                <span className="font-semibold text-slate-900">{displayName}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="shrink-0">User ID</span>
                <span className="truncate font-mono text-xs font-semibold text-slate-500">
                  {user?.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Role</span>
                <span className="font-semibold text-slate-900">{displayRole}</span>
              </div>
              {token && (
                <div className="flex justify-between">
                  <span>Session</span>
                  <span className="truncate text-emerald-700" title={token}>Active</span>
                </div>
              )}
            </div>
            
            {/* Review Stats Section */}
            {renderReviewStats()}
          </div>

          {/* Right Column - Role Specific Panel */}
          <div className="md:col-span-2">
            {displayRole === 'Farmer' && <FarmerPanel />}
            {displayRole === 'Distributor' && <DistributorPanel />}
            {displayRole === 'Transporter' && <TransporterPanel />}
            {displayRole !== 'Farmer' && displayRole !== 'Distributor' && displayRole !== 'Transporter' && (
              <MemberPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard