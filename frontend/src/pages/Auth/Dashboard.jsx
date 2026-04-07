import React, { useEffect, useState,useRef } from 'react'
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
  const fileInputRef = useRef(null)
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState(null)
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

    console.log(user);
    console.log(user?.id);

  }, [user])

  useEffect(() => {
    // Get the reliable ID from either the user context or the fetched profile
    const userId = user?.id || profile?._id || profile?.id;

    if ((displayRole === 'Distributor' || displayRole === 'Transporter') && userId) {
      const fetchLogo = async () => {
        try {
          // As you correctly noted, NO TOKEN is needed for this public route!
          const res = await fetch(`http://localhost:3000/api/users/${userId}/logo`);

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.logoUrl) {
              setLogoUrl(data.logoUrl);
            } else {
              setLogoUrl(null); // Ensure it resets if URL is empty
            }
          } else {
            // If it returns 404 (No logo found), just set it to null silently
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

  // Trigger hidden file input
  const handleEditClick = () => {
    fileInputRef.current?.click();
  }

  // Handle uploading the new logo
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    setIsUpdatingLogo(true);
    try {
      // ---> HIT THE NEW DEDICATED LOGO ENDPOINT <---
      const res = await fetch('http://localhost:3000/api/users/profile/logo', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Failed to update logo');
      
      const data = await res.json();
      
      // ---> UPDATE STATE WITH THE NEW URL FROM BACKEND <---
      if (data.logoUrl) {
        setLogoUrl(data.logoUrl);
        toast.success('Logo updated successfully');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUpdatingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  }

  // Handle deleting the logo
  const handleDeleteLogo = async () => {
    if (!window.confirm('Are you sure you want to remove your logo?')) return;

    setIsUpdatingLogo(true);
    try {
      const res = await fetch('http://localhost:3000/api/users/profile/logo', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to delete logo');
      
      setLogoUrl(null); // This makes the UI switch back to the green letter
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
            
            {/* WRAPPER WITH GROUP FOR HOVER EFFECT */}
            <div className="relative group flex h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-full ring-2 ring-emerald-100">
              
              {/* IMAGE OR INITIAL */}
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

              {/* HIDDEN FILE INPUT */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden" 
              />

              {/* HOVER OVERLAY MENU */}
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

                  {/* Active / Inactive dot */}
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

        {/* Full width role panel */}
        <div>
          {displayRole === 'Farmer' && <FarmerPanel />}
          {displayRole === 'Distributor' && <DistributorPanel />}
          {displayRole === 'Transporter' && <TransporterPanel />}
          {displayRole !== 'Farmer' &&
            displayRole !== 'Distributor' &&
            displayRole !== 'Transporter' && <MemberPanel />}
        </div>
      </div>
    </div>
  )
}

export default Dashboard