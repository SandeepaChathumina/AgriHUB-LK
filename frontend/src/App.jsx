import Text from './components/text.jsx'
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Homepage from './pages/homePage.jsx'

function App() {

  return (
    <BrowserRouter>
      <Routes path='/*'>
        <Route path="/" element={<Homepage />} />
        
      </Routes>
    </BrowserRouter>
  )
}

export default App
