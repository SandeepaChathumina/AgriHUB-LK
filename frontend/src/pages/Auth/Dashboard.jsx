import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { fetchConversationList } from '../../api/messages'
import FarmerPanel from './components/FarmerPanel'
import DistributorPanel from './components/DistributorPanel'
import TransporterPanel from './components/TransporterPanel'
import MemberPanel from './components/MemberPanel'

const CHAT_ROLES = ['Farmer', 'Distributor', 'Transporter']

// Use environment variables for deployment, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function Dashboard() {
  const { user, token, isAuthReady, logout } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [requestingOtp, setRequestingOtp] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const fileInputRef = useRef(null)
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState(null)
  const navigate = useNavigate()

  const displayName = profile?.fullName || user?.fullName || 'Guest User'
  const displayRole = profile?.role || user?.role || 'Member'
  const initial = (displayName?.[0] || 'U').toUpperCase()

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
    let isMounted = true; // Cleanup flag to prevent state updates on unmounted component

    const fetchProfile = async () => {
      setLoadingProfile(true)
      try {
        const res = await fetch(`${API_BASE_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.message || 'Failed to load profile')
        }

        const data = await res.json()
        if (isMounted) setProfile(data?.user || null)
      } catch (error) {
        if (isMounted) toast.error(error?.message || 'Failed to load profile')
      } finally {
        if (isMounted) setLoadingProfile(false)
      }
    }

    fetchProfile()

    return () => { isMounted = false; }
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

  // Fixed the syntax error here by wrapping logs in a proper useEffect
  useEffect(() => {
    console.log(user);
    console.log(user?.id);
  }, [user])

  useEffect(() => {
    const userId = user?.id || profile?._id || profile?.id;

    if ((displayRole === 'Distributor' || displayRole === 'Transporter') && userId) {
      const fetchLogo = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/users/${userId}/logo`);

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.logoUrl) {
              setLogoUrl(data.logoUrl);
            } else {
              setLogoUrl(null);
            }
          } else {
            setLogoUrl(null);
          }
        } catch (error) {
          console.error('Failed to fetch distributor logo:', error);
          setLogoUrl(null);
        }
      }
      fetchLogo();
    }
  }, [displayRole, user?.id, profile?._id]);

  const handleEditClick = () => {
    fileInputRef.current?.click();
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    setIsUpdatingLogo(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/profile/logo`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Failed to update logo');

      const data = await res.json();

      if (data.logoUrl) {
        setLogoUrl(data.logoUrl);
        toast.success('Logo updated successfully');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdatingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const handleDeleteLogo = async () => {
    if (!window.confirm('Are you sure you want to remove your logo?')) return;

    setIsUpdatingLogo(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/profile/logo`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to delete logo');

      setLogoUrl(null);
      toast.success('Logo removed successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdatingLogo(false);
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
      const res = await fetch(`${API_BASE_URL}/auth/request-otp`, {
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
        <div className="flex flex-col gap-4 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">

            <div className="relative group flex h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-full ring-2 ring-emerald-100">

              {(displayRole === 'Distributor' || displayRole === 'Transporter') && logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Distributor Logo"
                  className={`h-full w-full object-cover ${isUpdatingLogo ? 'opacity-50' : ''}`}
                />
              ) : (
                <div className={`flex h-full w-full items-center justify-center bg-emerald-100 text-xl font-bold text-emerald-700 ${isUpdatingLogo ? 'opacity-50' : ''}`}>
                  {initial}
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {(displayRole === 'Distributor' || displayRole === 'Transporter') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={handleEditClick}
                    disabled={isUpdatingLogo}
                    className="w-full flex-1 text-[10px] font-semibold tracking-wide text-white transition hover:bg-emerald-500/80"
                  >
                    EDIT
                  </button>

                  {logoUrl && (
                    <button
                      onClick={handleDeleteLogo}
                      disabled={isUpdatingLogo}
                      className="w-full flex-1 border-t border-white/30 text-[10px] font-semibold tracking-wide text-white transition hover:bg-red-500/80"
                    >
                      DEL
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-slate-900">
                    {displayName}
                  </h1>

                  <span className="relative flex h-3 w-3">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? 'bg-green-400' : 'bg-red-400'
                        } animate-ping`}
                    ></span>
                    <span
                      className={`relative inline-flex h-3 w-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}
                    ></span>
                  </span>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                  {displayRole}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive
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