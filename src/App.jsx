import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Pantalla de inicio (Home) */}
        <Route path="/" element={<Home />} />

        {/* Pantalla de inicio (Login) */}
        <Route path="/login" element={<Login />} />
        
        {/* Pantalla para registrarse */}
        <Route path="/registro" element={<Register />} />
        
        {/* Pantalla del Dashboard (Panel de Control) */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

