import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Login from './pages/Login'

function App() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="flex-1 flex flex-col overflow-hidden">

        <Routes>
          {/* Landing principal */}
          <Route path="/" element={<Landing />} />

          {/* Página principal de la app (mapa + pistas) */}
          <Route path="/home/:view?" element={<Home />} />

          {/* Login */}
          <Route path="/login" element={<Login />} />
        </Routes>

      </div>
    </div>
  )
}

export default App