import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";

import Home from "./pages/auth/Home";
import AccesoEstudiante from "./pages/auth/AccesoEstudiante";
import RegistroEstudiante from "./pages/auth/RegistroEstudiante";
import ResetEstudiante from "./pages/auth/ResetEstudiante";
import AccesoAdministracion from "./pages/auth/AccesoAdministracion";
import RegistroChofer from "./pages/auth/RegistroChofer";
import AccesoChofer from "./pages/auth/AccesoChofer";
import RegistroChequeador from "./pages/auth/RegistroChequeador";
import AccesoChequeador from "./pages/auth/AccesoChequeador";

import EstudianteDashboard from "./pages/student/EstudianteDashboard";
import AdminDashboard from "./pages/Admindashboard/AdminDashboard";
import DriverDashboard from "./pages/driver/DriverDashboard";
import ChequeadorDashboard from "./pages/Chequeador/ChequeadorDashboard";
import EncuestaTransporte from "./pages/formulario/formulario";
import Cump from "./pages/Cump/Cump";

import ProtectedRoute from "./components/ProtectedRoute";

function AuthListener({ children }) {
  const navigate = useNavigate();
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
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
          {/* RUTAS PÚBLICAS */}
          <Route path="/" element={<Home />} />
          <Route path="/acceso-estudiante" element={<AccesoEstudiante />} />
          <Route path="/registro-estudiante" element={<RegistroEstudiante />} />
          <Route path="/reset-password" element={<ResetEstudiante />} />
          <Route path="/acceso-admin" element={<AccesoAdministracion />} />
          <Route path="/registro-chofer" element={<RegistroChofer />} />
          <Route path="/acceso-chofer" element={<AccesoChofer />} />
          <Route path="/registro-chequeador" element={<RegistroChequeador />} />
          <Route path="/acceso-chequeador" element={<AccesoChequeador />} />
          <Route path="/formulario" element={<EncuestaTransporte />} />
          <Route path="/cump" element={<Cump />} />


          {/* --- RUTAS PRIVADAS (Protegidas) --- */}
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

          {/* 🎯 URL SINCRONIZADA EN MINÚSCULAS PARA EL OPERADOR */}
          <Route 
            path="/dashboard-chofer" 
            element={
              <ProtectedRoute>
                <DriverDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/dashboard-chequeador" 
            element={
              <ProtectedRoute>
                <ChequeadorDashboard />
              </ProtectedRoute>
            } 
          />

          {/* 🔥 EL SALVAVIDAS: Si escriben una ruta mala, los manda al Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthListener>
    </Router>
  );
}