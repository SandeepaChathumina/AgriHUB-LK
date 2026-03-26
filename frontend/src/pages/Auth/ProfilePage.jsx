import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const ProfilePage = () => {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [formValues, setFormValues] = useState({
    fullName: '',
    phone: '',
    location: {
      address: '',
      city: '',
      district: '',
    },
    email: '',
    role: '',
    isVerified: false,
    farmSize: '',
    mainCrops: '',
    nicNumber: '',
    businessName: '',
    businessRegNumber: '',
    warehouseCapacity: '',
    companyName: '',
    fleetSize: '',
  })

  const handleLocationChange = (field, value) => {
    setFormValues((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }))
  }

  useEffect(() => {
    if (!token) return
    const fetchProfile = async () => {
      setLoading(true)
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
        const u = data?.user || {}
        setFormValues({
          fullName: u.fullName || '',
          phone: u.phone || '',
          location: {
            address: u.location?.address || '',
            city: u.location?.city || '',
            district: u.location?.district || '',
          },
          email: u.email || '',
          role: u.role || '',
          isVerified: Boolean(u.isVerified),
          farmSize: u.farmSize ?? '',
          mainCrops: Array.isArray(u.mainCrops) ? u.mainCrops.join(', ') : (u.mainCrops || ''),
          nicNumber: u.nicNumber || '',
          businessName: u.businessName || '',
          businessRegNumber: u.businessRegNumber || '',
          warehouseCapacity: u.warehouseCapacity ?? '',
          companyName: u.companyName || '',
          fleetSize: u.fleetSize ?? '',
        })
      } catch (error) {
        toast.error(error?.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [token])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!token) {
      toast.error('Not authenticated')
      return
    }
    setStatus({ type: '', message: '' })
    setSaving(true)
    try {
      const base = {
        fullName: formValues.fullName,
        phone: formValues.phone,
        location: formValues.location,
      }

      let payload = base

      if (formValues.role === 'Farmer') {
        payload = {
          ...base,
          farmSize: formValues.farmSize === '' ? undefined : Number(formValues.farmSize),
          nicNumber: formValues.nicNumber || undefined,
          mainCrops: formValues.mainCrops
            ? formValues.mainCrops.split(',').map((c) => c.trim()).filter(Boolean)
            : [],
        }
      } else if (formValues.role === 'Distributor') {
        payload = {
          ...base,
          businessName: formValues.businessName || undefined,
          businessRegNumber: formValues.businessRegNumber || undefined,
          warehouseCapacity: formValues.warehouseCapacity === '' ? undefined : Number(formValues.warehouseCapacity),
        }
      } else if (formValues.role === 'Transporter') {
        payload = {
          ...base,
          companyName: formValues.companyName || undefined,
          businessRegNumber: formValues.businessRegNumber || undefined,
          fleetSize: formValues.fleetSize === '' ? undefined : Number(formValues.fleetSize),
        }
      }

      const res = await fetch('http://localhost:3000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'Failed to update profile')
      }

      const body = await res.json().catch(() => ({}))
      setStatus({ type: 'success', message: body?.message || 'Profile updated successfully.' })
      toast.success(body?.message || 'Profile updated successfully')
    } catch (error) {
      const message = error?.message || 'Failed to update profile'
      setStatus({ type: 'error', message })
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token) {
      toast.error('Not authenticated')
      return
    }
    const confirmed = window.confirm('Are you sure? This will delete your account permanently.')
    if (!confirmed) return

    setRemoving(true)
    try {
      const res = await fetch('http://localhost:3000/api/users/profile', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'Failed to delete account')
      }

      const body = await res.json().catch(() => ({}))
      toast.success(body?.message || 'Account deleted')
      logout()
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(error?.message || 'Failed to delete account')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-2 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Profile management</p>
          <h1 className="text-3xl font-semibold text-slate-900">Manage your account</h1>
          <p className="text-sm text-slate-600">View, update your contact details, or delete your account securely.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile details</p>
                <p className="text-lg font-semibold text-slate-900">Update your info</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${formValues.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {formValues.isVerified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800" htmlFor="fullName">Full name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formValues.fullName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800" htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formValues.phone}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  placeholder="07X XXX XXXX"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-800" htmlFor="address">Address</label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formValues.location.address}
                    onChange={(e) => handleLocationChange('address', e.target.value)}
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-800" htmlFor="city">City</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formValues.location.city}
                    onChange={(e) => handleLocationChange('city', e.target.value)}
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                    placeholder="Colombo"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800" htmlFor="district">District</label>
                <input
                  id="district"
                  name="district"
                  type="text"
                  value={formValues.location.district}
                  onChange={(e) => handleLocationChange('district', e.target.value)}
                  className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  placeholder="Gampaha"
                />
              </div>

              {/* Role-specific sections */}
              {formValues.role === 'Farmer' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-800" htmlFor="nicNumber">NIC Number</label>
                    <input
                      id="nicNumber"
                      name="nicNumber"
                      type="text"
                      value={formValues.nicNumber}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="e.g. 199012345678"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-800" htmlFor="farmSize">Farm Size (Acres)</label>
                    <input
                      id="farmSize"
                      name="farmSize"
                      type="number"
                      value={formValues.farmSize}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-semibold text-slate-800" htmlFor="mainCrops">Main Crops (comma separated)</label>
                    <input
                      id="mainCrops"
                      name="mainCrops"
                      type="text"
                      value={formValues.mainCrops}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="Rice, Vegetables"
                    />
                  </div>
                </div>
              )}

              {formValues.role === 'Distributor' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-800" htmlFor="businessName">Business Name</label>
                    <input
                      id="businessName"
                      name="businessName"
                      type="text"
                      value={formValues.businessName}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="Fresh Foods Pvt Ltd"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-800" htmlFor="businessRegNumber">Business Reg Number</label>
                    <input
                      id="businessRegNumber"
                      name="businessRegNumber"
                      type="text"
                      value={formValues.businessRegNumber}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="PV12345"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-800" htmlFor="warehouseCapacity">Warehouse Capacity (Sq Ft)</label>
                    <input
                      id="warehouseCapacity"
                      name="warehouseCapacity"
                      type="number"
                      value={formValues.warehouseCapacity}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="5000"
                    />
                  </div>
                </div>
              )}

              {formValues.role === 'Transporter' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-800" htmlFor="companyName">Company Name</label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={formValues.companyName}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="Speedy Logistics"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-800" htmlFor="businessRegNumber">Business Reg Number</label>
                    <input
                      id="businessRegNumber"
                      name="businessRegNumber"
                      type="text"
                      value={formValues.businessRegNumber}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="PV98765"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-800" htmlFor="fleetSize">Fleet Size (Vehicles)</label>
                    <input
                      id="fleetSize"
                      name="fleetSize"
                      type="number"
                      value={formValues.fleetSize}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="10"
                    />
                  </div>
                </div>
              )}

              {status.message && (
                <div
                  className={`rounded-lg px-4 py-3 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
                >
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || loading}
                className="w-full rounded-xl bg-green-500 px-4 py-3 text-base font-bold text-white shadow-lg shadow-green-500/30 transition hover:bg-green-600 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account summary</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">Basics</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>Email</span>
                  <span className="font-semibold text-slate-900">{formValues.email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Role</span>
                  <span className="font-semibold text-slate-900">{formValues.role || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className={`font-semibold ${formValues.isVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {formValues.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">Delete account</p>
              <p className="mt-1 text-xs text-red-600">This action is permanent and cannot be undone.</p>
              <button
                type="button"
                onClick={handleDelete}
                disabled={removing}
                className="mt-3 w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {removing ? 'Deleting...' : 'Delete my account'}
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-sm text-slate-500">Loading profile...</div>
        )}
      </div>
    </div>
  )
}

export default ProfilePage
