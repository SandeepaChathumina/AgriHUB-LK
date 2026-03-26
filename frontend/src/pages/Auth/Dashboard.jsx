import React from 'react'
import { useAuth } from '../../context/AuthContext';

function Dashboard() {
    const { user, token, logout } = useAuth();
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.fullName}!</p>
        <p>Your role: {user?.role}</p>
        <p>{token}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

export default Dashboard
