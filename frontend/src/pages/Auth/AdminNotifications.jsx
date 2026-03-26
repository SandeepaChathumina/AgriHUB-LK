import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import AdminNav from '../../components/AdminNav'

const roleOptions = ['All', 'Farmer', 'Distributor', 'Transporter', 'Member']
const verifyOptions = ['All', 'Verified', 'Unverified']
const readOptions = ['All', 'true', 'false']

const AdminNotifications = () => {
  const { token } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ role: 'All', isRead: 'All' })

  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [form, setForm] = useState({
    targetType: 'Single',
    userId: '',
    role: 'All',
    verificationStatus: 'All',
    title: '',
    message: '',
  })

  const [editId, setEditId] = useState(null)
  const [editDraft, setEditDraft] = useState({ title: '', message: '' })
  const canSubmit = useMemo(() => form.title.trim() && form.message.trim(), [form])

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
      const params = new URLSearchParams()
      if (filters.role) params.set('role', filters.role)
      if (filters.isRead) params.set('isRead', filters.isRead)
      const res = await authedFetch(`http://localhost:3000/api/notifications/admin/manage?${params.toString()}`)
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to load notifications')
      setNotifications(body.notifications || [])
    } catch (err) {
      toast.error(err.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const params = new URLSearchParams()
      params.set('role', form.role || 'All')
      params.set('status', form.verificationStatus || 'All')
      const res = await authedFetch(`http://localhost:3000/api/notifications/admin/users?${params.toString()}`)
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to load users')
      setUsers(body.users || [])
    } catch (err) {
      toast.error(err.message || 'Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (!token) return
    loadNotifications()
  }, [token, filters.role, filters.isRead])

  useEffect(() => {
    if (!token) return
    if (form.targetType === 'Single') loadUsers()
  }, [token, form.role, form.verificationStatus, form.targetType])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    try {
      const payload = {
        targetType: form.targetType,
        userId: form.targetType === 'Single' ? form.userId : undefined,
        role: form.targetType === 'Bulk' ? form.role : undefined,
        verificationStatus: form.targetType === 'Bulk' ? form.verificationStatus : undefined,
        title: form.title,
        message: form.message,
      }
      const res = await authedFetch('http://localhost:3000/api/notifications/admin/send', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to send notification')
      toast.success(body?.message || 'Notification sent')
      setForm({ targetType: 'Single', userId: '', role: 'All', verificationStatus: 'All', title: '', message: '' })
      loadNotifications()
    } catch (err) {
      toast.error(err.message || 'Failed to send notification')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return
    try {
      const res = await authedFetch(`http://localhost:3000/api/notifications/admin/manage/${id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to delete')
      toast.success(body?.message || 'Deleted')
      setNotifications((prev) => prev.filter((n) => n._id !== id))
    } catch (err) {
      toast.error(err.message || 'Failed to delete')
    }
  }

  const startEdit = (n) => {
    setEditId(n._id)
    setEditDraft({ title: n.title, message: n.message })
  }

  const handleEditSave = async () => {
    try {
      const res = await authedFetch(`http://localhost:3000/api/notifications/admin/manage/${editId}`, {
        method: 'PUT',
        body: JSON.stringify(editDraft),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to update')
      toast.success(body?.message || 'Updated')
      setNotifications((prev) => prev.map((n) => (n._id === editId ? { ...n, ...editDraft } : n)))
      setEditId(null)
    } catch (err) {
      toast.error(err.message || 'Failed to update')
    }
  }

  const resetEdit = () => {
    setEditId(null)
    setEditDraft({ title: '', message: '' })
  }

  const formatDate = (d) => new Date(d).toLocaleString()

  return (

    <>

    <AdminNav />

    <div className="min-h-screen  px-4 py-8">
        
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Admin</p>
            <h1 className="text-2xl font-semibold text-slate-900">Manage Notifications</h1>
            <p className="text-sm text-slate-600">Create, edit (unread only), delete, and filter notifications.</p>
          </div>
        </header>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <label className="text-sm font-semibold text-slate-800">Target Type</label>
                <div className="flex items-center gap-3">
                  {['Single', 'Bulk'].map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="targetType"
                        value={type}
                        checked={form.targetType === type}
                        onChange={(e) => setForm((p) => ({ ...p, targetType: e.target.value }))}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              {form.targetType === 'Single' ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-800">Role</label>
                    <select
                      className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
                      value={form.role}
                      onChange={(e) => setForm((p) => ({ ...p, role: e.target.value, userId: '' }))}
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-800">Verification</label>
                    <select
                      className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
                      value={form.verificationStatus}
                      onChange={(e) => setForm((p) => ({ ...p, verificationStatus: e.target.value, userId: '' }))}
                    >
                      {verifyOptions.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-800">Select User</label>
                    <select
                      className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
                      value={form.userId}
                      onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))}
                      disabled={loadingUsers}
                    >
                      <option value="">{loadingUsers ? 'Loading users...' : 'Choose user'}</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.fullName} ({u.role}) - {u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-800">Role</label>
                    <select
                      className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
                      value={form.role}
                      onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-800">Verification</label>
                    <select
                      className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
                      value={form.verificationStatus}
                      onChange={(e) => setForm((p) => ({ ...p, verificationStatus: e.target.value }))}
                    >
                      {verifyOptions.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800">Title</label>
                <input
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800">Message</label>
                <textarea
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Send Notification
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-3">
              <label className="text-sm font-semibold text-slate-700">Role</label>
              <select
                className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
                value={filters.role}
                onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <label className="text-sm font-semibold text-slate-700">Read</label>
              <select
                className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
                value={filters.isRead}
                onChange={(e) => setFilters((p) => ({ ...p, isRead: e.target.value }))}
              >
                {readOptions.map((r) => (
                  <option key={r} value={r}>{r === 'true' ? 'Read' : r === 'false' ? 'Unread' : 'All'}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={loadNotifications}
              className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Title</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Message</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Recipient</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Sender</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Created</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="7" className="px-3 py-4 text-center text-slate-500">Loading...</td></tr>
                ) : notifications.length === 0 ? (
                  <tr><td colSpan="7" className="px-3 py-4 text-center text-slate-500">No notifications found.</td></tr>
                ) : (
                  notifications.map((n) => (
                    <tr key={n._id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-semibold text-slate-900">{n.title}</td>
                      <td className="px-3 py-2 text-slate-700">{n.message}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {n.recipient?.fullName || '—'}
                        <div className="text-xs text-slate-500">{n.recipient?.role} {n.recipient?.email ? `• ${n.recipient.email}` : ''}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{n.sender?.fullName || '—'}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${n.isRead ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {n.isRead ? 'Read' : 'Unread'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{formatDate(n.createdAt)}</td>
                      <td className="px-3 py-2 text-right space-x-2">
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={() => startEdit(n)}
                            className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(n._id)}
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {editId && (
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Edit Notification</h2>
                <p className="text-sm text-slate-600">Allowed only while unread.</p>
              </div>
              <button onClick={resetEdit} className="text-sm font-semibold text-slate-500 hover:text-slate-700">Close</button>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-800">Title</label>
                <input
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
                  value={editDraft.title}
                  onChange={(e) => setEditDraft((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-semibold text-slate-800">Message</label>
                <textarea
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm"
                  rows={3}
                  value={editDraft.message}
                  onChange={(e) => setEditDraft((p) => ({ ...p, message: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={resetEdit} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button
                onClick={handleEditSave}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Save
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
    </>
  )
}

export default AdminNotifications
