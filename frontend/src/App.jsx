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

// NEW IMPORTS - Product Management
import ProductList from './pages/products/ProductList.jsx'
import AddProduct from './pages/products/AddProduct.jsx'
import EditProduct from './pages/products/EditProduct.jsx'

// NEW IMPORTS - Review Management
import ProductReviews from './pages/reviews/ProductReviews.jsx'
import PendingReviews from './pages/reviews/PendingReviews.jsx'

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
          
          {/* NEW - Product Routes */}
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/add" element={<AddProduct />} />
          <Route path="/products/edit/:id" element={<EditProduct />} />
          
          {/* NEW - Review Routes */}
          <Route path="/reviews/:targetType/:targetId" element={<ProductReviews />} />
          <Route path="/pending-reviews" element={<PendingReviews />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App