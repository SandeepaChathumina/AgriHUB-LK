import React from 'react'
import { Link } from 'react-router-dom'

const AuthNav = () => {
  return (
    <header className="w-full ">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" className="text-lg font-bold text-emerald-700">
          AgriHub
        </Link>
        <nav className="flex items-center gap-3 text-sm font-semibold">
          <Link
            to="/"
            className="rounded-lg px-8 py-2 text-lg text-slate-700 transition hover:text-emerald-700 hover:bg-emerald-50"
          >
            Home
          </Link>
          <Link
            to="/login"
            className="rounded-lg px-8 py-2 text-lg text-emerald-50 bg-emerald-600 shadow-sm transition hover:bg-emerald-700"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default AuthNav
