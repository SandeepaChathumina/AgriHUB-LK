import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Accept a links array so pages can add/override nav items; Dashboard stays permanent
const ProfileNav = ({ active, links }) => {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const navLinks = links && links.length > 0
    ? links
    : [
        // { key: 'notifications', label: 'Notifications', to: '/notifications' },
        // { key: 'profile', label: 'Profile', to: '/profile' },
      ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const linkClass = (key) => (
    key === active
      ? 'rounded-lg px-3 py-2 bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700'
      : 'rounded-lg px-3 py-2 text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700'
  )

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/dashboard" className="text-lg font-bold text-emerald-700">AgriHUB.LK</Link>
        <nav className="flex items-center gap-3 text-sm font-semibold">
          <Link to="/dashboard" className={linkClass('dashboard')}>Dashboard</Link>
          {navLinks.map(({ key, label, to }) => (
            <Link key={key} to={to} className={linkClass(key)}>{label}</Link>
          ))}
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

export default ProfileNav
