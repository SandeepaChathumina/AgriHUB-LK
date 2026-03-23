import Text from './components/text.jsx'
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

function App() {

  return (
    <BrowserRouter>
      <Routes path='/*'>
        <Route path="/" element={<Text />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
