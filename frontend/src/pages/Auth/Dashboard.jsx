import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { fetchConversationList } from '../../api/messages'
import FarmerPanel from './components/FarmerPanel'
import DistributorPanel from './components/DistributorPanel'
import TransporterPanel from './components/TransporterPanel'
import MemberPanel from './components/MemberPanel'

const CHAT_ROLES = ['Farmer', 'Distributor', 'Transporter']

function Dashboard() {
  const { user, token, isAuthReady, logout } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [requestingOtp, setRequestingOtp] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const navigate = useNavigate()

  const displayName = profile?.fullName || user?.fullName || 'Guest User'
  const displayRole = profile?.role || user?.role || 'Member'
  const initial = (displayName?.[0] || 'U').toUpperCase()

  // You asked: active green dot / inactive red dot
  // Using verification state as the status source for now
  const isActive = Boolean(profile?.isVerified ?? user?.isVerified)

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

    const fetchProfile = async () => {
      setLoadingProfile(true)
      try {
        const res = await fetch('http://localhost:3000/api/users/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

    fetchProfile()
  }, [token])

  useEffect(() => {
    if (!token) return

    const role = profile?.role || user?.role
    if (!CHAT_ROLES.includes(role)) return

    const loadUnreadMessages = async ({ silent = false } = {}) => {
      try {
        const response = await fetchConversationList(token)
        const conversations = response?.data || []
        const totalUnread = conversations.reduce((sum, item) => sum + Number(item?.unreadCount || 0), 0)
        setUnreadMessages(totalUnread)
      } catch (error) {
        if (!silent) {
          toast.error(error?.message || 'Failed to load unread messages')
        }
      }
    }

    void loadUnreadMessages()

    const intervalId = setInterval(() => {
      void loadUnreadMessages({ silent: true })
    }, 8000)

    return () => clearInterval(intervalId)
  }, [token, profile?.role, user?.role])

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

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-emerald-50 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {/* Top Header Card */}
        <div className="flex flex-col gap-4 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">
              {initial}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-slate-900">
                    {displayName}
                  </h1>

                  {/* Active / Inactive dot */}
                  <span className="relative flex h-3 w-3">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isActive ? 'bg-green-400' : 'bg-red-400'
                      } animate-ping`}
                    ></span>
                    <span
                      className={`relative inline-flex h-3 w-3 rounded-full ${
                        isActive ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></span>
                  </span>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                  {displayRole}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-sm text-slate-600">
                Securely manage your account, shortcuts, and role-based actions from your dashboard.
              </p>

              <p className="text-xs text-slate-500">
  Welcome back 👋
</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/notifications"
              className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
            >
              Notifications
            </Link>

            {!isActive && (
              <button
                onClick={handleVerify}
                className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loadingProfile || requestingOtp}
              >
                {loadingProfile || requestingOtp ? 'Sending OTP...' : `Verify ${displayRole}`}
              </button>
            )}

            <button
              onClick={handleLogout}
              type="button"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Full width role panel */}
        <div>
          {displayRole === 'Farmer' && <FarmerPanel unreadMessages={unreadMessages} />}
          {displayRole === 'Distributor' && <DistributorPanel unreadMessages={unreadMessages} />}
          {displayRole === 'Transporter' && <TransporterPanel unreadMessages={unreadMessages} />}
          {displayRole !== 'Farmer' &&
            displayRole !== 'Distributor' &&
            displayRole !== 'Transporter' && <MemberPanel unreadMessages={unreadMessages} />}
        </div>
      </div>
    </div>
  )
}

export default Dashboard