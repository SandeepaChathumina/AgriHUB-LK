import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Homepage from './pages/homePage.jsx'
import AuthPage from './pages/Auth/AuthPage.jsx'
// AuthProvider eka import karaganna
import { AuthProvider } from './context/AuthContext.jsx' 
import Dashboard from './pages/Auth/Dashboard.jsx'

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
          {/* Route dekenma yanne AuthPage ekata. Habai initialMode eka wenas */}
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/register" element={<AuthPage initialMode="register" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App