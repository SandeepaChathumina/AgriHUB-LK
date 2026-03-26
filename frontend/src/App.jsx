import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Homepage from './pages/homePage.jsx'
// Aluth page eka import karaganna
import AuthPage from './pages/Auth/AuthPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        
        {/* Route dekenma yanne AuthPage ekata. Habai initialMode eka wenas */}
        <Route path="/login" element={<AuthPage initialMode="login" />} />
        <Route path="/register" element={<AuthPage initialMode="register" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App