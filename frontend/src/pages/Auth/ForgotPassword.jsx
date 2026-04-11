import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import AuthNav from '../../components/AuthNav'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    setIsSubmitting(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'Failed to send reset code')
      }

      const body = await res.json().catch(() => ({}))
      setStatus({ type: 'success', message: body?.message || 'Reset code sent to your email.' })
      toast.success(body?.message || 'Reset code sent to your email')
      navigate('/reset-password', { state: { email } })
    } catch (error) {
      const message = error?.message || 'Failed to send reset code'
      setStatus({ type: 'error', message })
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 ">
      <AuthNav />
      <div className="px-4 py-10 mt-20">
        <div className="mx-auto flex max-w-md flex-col gap-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="space-y-1 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Password reset</p>
          <h1 className="text-2xl font-semibold text-slate-900">Request a reset code</h1>
          <p className="text-sm text-slate-600">Enter your account email. We'll send a 6-digit OTP to reset your password.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-800" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              placeholder="you@example.com"
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
            {isSubmitting ? 'Sending code...' : 'Send reset code'}
          </button>
        </form>
      </div>
      </div>
    </div>
  )
}

export default ForgotPassword
