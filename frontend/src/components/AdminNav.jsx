import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AdminNav = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="w-full   ">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/admin-dashboard" className="text-lg font-bold text-emerald-700">
          AgriHUB.LK
        </Link>
        <nav className="flex items-center gap-3 text-sm font-semibold">
          <Link to="/admin-dashboard" className="rounded-lg px-3 py-2 text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700">Dashboard</Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  )
}

export default AdminNav
