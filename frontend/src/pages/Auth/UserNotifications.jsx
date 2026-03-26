import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

const statusFilters = ['All', 'Unread', 'Read']

const UserNotifications = () => {
  const { token, user, isAuthReady } = useAuth()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('All')
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    if (!isAuthReady) return
    if (!token) {
      navigate('/login')
      return
    }
    if (user?.role === 'Admin') {
      navigate('/admin/notifications')
    }
  }, [token, user?.role, isAuthReady, navigate])

  const authedFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    })
    return res
  }

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const res = await authedFetch('http://localhost:3000/api/notifications/my-notifications')
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to load notifications')
      setNotifications(body.notifications || [])
    } catch (err) {
      toast.error(err.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    loadNotifications()
  }, [token])

  const markAsRead = async (id) => {
    setMarking(true)
    try {
      const res = await authedFetch(`http://localhost:3000/api/notifications/${id}/read`, { method: 'PUT' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to mark as read')
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)))
      toast.success('Marked as read')
    } catch (err) {
      toast.error(err.message || 'Failed to mark as read')
    } finally {
      setMarking(false)
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'All') return notifications
    if (filter === 'Unread') return notifications.filter((n) => !n.isRead)
    if (filter === 'Read') return notifications.filter((n) => n.isRead)
    return notifications
  }, [filter, notifications])

  const formatDate = (d) => new Date(d).toLocaleString()

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">User</p>
            <h1 className="text-2xl font-semibold text-slate-900">My Notifications</h1>
            <p className="text-sm text-slate-600">View updates from admins and mark them as read.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Back to Dashboard
            </Link>
            <button
              type="button"
              onClick={loadNotifications}
              className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              Refresh
            </button>
          </div>
        </header>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <select
                className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {statusFilters.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="text-sm text-slate-600">Total: {notifications.length} | Unread: {notifications.filter((n) => !n.isRead).length}</div>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-600">Loading notifications...</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-600">No notifications found.</div>
            ) : (
              filtered.map((n) => (
                <div key={n._id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{n.title}</h3>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${n.isRead ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {n.isRead ? 'Read' : 'Unread'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{n.message}</p>
                      <div className="text-xs text-slate-500">
                        From: {n.sender?.fullName || 'Admin'} | {formatDate(n.createdAt)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!n.isRead && (
                        <button
                          type="button"
                          disabled={marking}
                          onClick={() => markAsRead(n._id)}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default UserNotifications
