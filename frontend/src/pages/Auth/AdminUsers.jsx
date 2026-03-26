import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

function AdminUsers() {
  const { token, user, isAuthReady, logout } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Protect route for admins
  useEffect(() => {
    if (!isAuthReady) return
    if (!token) {
      navigate('/login')
      return
    }
    if (user?.role && user.role !== 'Admin') {
      navigate('/dashboard')
    }
  }, [token, user?.role, navigate, isAuthReady])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/api/auth/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'Failed to load users')
      }

      const data = await res.json()
      setUsers(data?.users || [])
    } catch (err) {
      toast.error(err?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token && isAuthReady) {
      fetchUsers()
    }
  }, [token, isAuthReady])

  const handleDelete = async (id) => {
    if (!id) return
    const confirm = window.confirm('Are you sure you want to delete this user?')
    if (!confirm) return

    setDeletingId(id)
    try {
      const res = await fetch(`http://localhost:3000/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || 'Failed to delete user')
      }

      toast.success('User removed successfully')
      setUsers((prev) => prev.filter((u) => u._id !== id))
    } catch (err) {
      toast.error(err?.message || 'Failed to delete user')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin</p>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-sm text-slate-600">View and remove users. Admin token required.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              Back to Admin Dashboard
            </button>
            <button
              onClick={() => { logout(); navigate('/') }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-900">All Users</p>
              <p className="text-xs text-slate-500">Total: {users.length}</p>
            </div>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" className="px-4 py-4 text-center text-slate-500">No users found.</td>
                  </tr>
                )}
                {users.map((u) => (
                  <tr key={u._id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-900">{u.fullName}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.role}</td>
                    <td className="px-4 py-3">{u.isVerified ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(u._id)}
                        disabled={deletingId === u._id}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-60"
                      >
                        {deletingId === u._id ? 'Removing...' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUsers
