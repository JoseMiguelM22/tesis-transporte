import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from "./pages/AdminDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import LoginCentral from "./pages/LoginCentral"; 
import ResetPassword from "./pages/ResetPassword"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Pantalla de inicio (Home) */}
        <Route path="/" element={<Home />} />

        {/* Pantalla de inicio (Login) */}
        <Route path="/login" element={<Login />} />

        {/* Ruta especial para ti y tus choferes */}
         <Route path="/auth-central" element={<LoginCentral />} />
        
        {/* Pantalla para registrarse */}
        <Route path="/registro" element={<Register />} />
        
        {/* Pantalla del Dashboard (Panel de Control) */}
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/admin" element={<AdminDashboard />} />

        <Route path="/driver" element={<DriverDashboard />} />

        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

