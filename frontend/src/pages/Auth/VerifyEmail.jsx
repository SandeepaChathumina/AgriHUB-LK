import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import NavForVerify from '../../components/NavForVerify'

const VerifyEmail = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const initialEmail = location.state?.email || ''

  const [formValues, setFormValues] = useState({
    email: initialEmail,
    otp: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    setIsSubmitting(true)

    try {
      const res = await fetch('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formValues),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'Verification failed. Please try again.')
      }

      const body = await res.json().catch(() => ({}))
      setStatus({ type: 'success', message: body?.message || 'Email verified successfully.' })
      toast.success(body?.message || 'Email verified successfully')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const message = error?.message || 'Verification failed. Please try again.'
      setStatus({ type: 'error', message })
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <NavForVerify />
      <div className="mx-auto flex max-w-md flex-col gap-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 mt-20">
        <div className="space-y-1 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Verify your account</p>
          <h1 className="text-2xl font-semibold text-slate-900">Enter the OTP we emailed you</h1>
          <p className="text-sm text-slate-600">We sent a 6-digit code to your email. Enter it below to complete verification.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800" htmlFor="otp">OTP Code</label>
            <input
              id="otp"
              name="otp"
              type="text"
              value={formValues.otp}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="Enter 6-digit code"
            />
          </div>

          {status.message && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
            >
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-green-500 px-4 py-3 text-base font-bold text-white shadow-lg shadow-green-500/30 transition hover:bg-green-600 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default VerifyEmail
