import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Homepage from './pages/homePage.jsx'
import AuthPage from './pages/Auth/AuthPage.jsx'
// AuthProvider eka import karaganna
import { AuthProvider } from './context/AuthContext.jsx' 
import Dashboard from './pages/Auth/Dashboard.jsx'
import AdminDashboard from './pages/Auth/AdminDashboard.jsx'
import AdminUsers from './pages/Auth/AdminUsers.jsx'
import AdminNotifications from './pages/Auth/AdminNotifications.jsx'
import UserNotifications from './pages/Auth/UserNotifications.jsx'
import VerifyEmail from './pages/Auth/VerifyEmail.jsx'
import ForgotPassword from './pages/Auth/ForgotPassword.jsx'
import ResetPassword from './pages/Auth/ResetPassword.jsx'
import ProfilePage from './pages/Auth/ProfilePage.jsx'

function App() {
  return (
    // AuthProvider eken mulu app ekama wrap karanawa
    <AuthProvider>
      <BrowserRouter>
        {/* Toaster eka methana thiyena eka hondai, ethakota app eke onama thanaka indan toast calls wada karanawa */}
        <Toaster position="top-right" />
        
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/notifications" element={<UserNotifications />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/register" element={<AuthPage initialMode="register" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App