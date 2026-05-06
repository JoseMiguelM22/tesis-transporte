import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";

// --- IMPORTAR TUS VISTAS ---
import Home from "./pages/auth/Home";
import AccesoEstudiante from "./pages/auth/AccesoEstudiante";
import RegistroEstudiante from "./pages/auth/RegistroEstudiante";
import ResetEstudiante from "./pages/auth/ResetEstudiante";
import AccesoAdministracion from "./pages/auth/AccesoAdministracion";

import EstudianteDashboard from "./pages/student/EstudianteDashboard";
import AdminDashboard from "./pages/Admindashboard/AdminDashboard";
import DriverDashboard from "./pages/driver/DriverDashboard";

// --- IMPORTAR EL GUARDAESPALDAS ---
import ProtectedRoute from "./components/ProtectedRoute";

function AuthListener({ children }) {
  const navigate = useNavigate();
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password'); // Ajusta a la ruta que uses para el reset
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, [navigate]);
  return children;
}

export default function App() {
  return (
    <Router>
      <AuthListener>
        <Routes>
          {/* --- RUTAS PÚBLICAS (Cualquiera entra) --- */}
          <Route path="/" element={<Home />} />
          <Route path="/acceso-estudiante" element={<AccesoEstudiante />} />
          <Route path="/registro-estudiante" element={<RegistroEstudiante />} />
          <Route path="/reset-password" element={<ResetEstudiante />} />
          <Route path="/acceso-admin" element={<AccesoAdministracion />} />

          {/* --- RUTAS PRIVADAS (Solo logueados) --- */}
          <Route 
            path="/dashboard-estudiante" 
            element={
              <ProtectedRoute>
                <EstudianteDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/chofer" 
            element={
              <ProtectedRoute>
                <DriverDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthListener>
    </Router>
  );
}