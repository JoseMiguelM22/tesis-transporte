import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";

// Vistas de Gineva
import GinevaStore from "./pages/GinevaStore/GinevaStore";
import GinevaAdmin from "./pages/GinevaAdmin/GinevaAdmin";

// Vistas de Transporte (Comentadas por ahora para que no interfieran)
/*
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
import ProtectedRoute from "./components/ProtectedRoute";
*/

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
          {/* 🔥 RUTA PRINCIPAL: GINEVA STORE 🔥 */}
          <Route path="/" element={<GinevaStore />} />
          <Route path="/gineva-admin" element={<GinevaAdmin />} />
          
          {/* --- RUTAS DE TRANSPORTE (COMENTADAS) --- */}
          {/*
          <Route path="/acceso-estudiante" element={<AccesoEstudiante />} />
          <Route path="/registro-estudiante" element={<RegistroEstudiante />} />
          <Route path="/reset-password" element={<ResetEstudiante />} />
          <Route path="/acceso-admin" element={<AccesoAdministracion />} />
          <Route path="/registro-chofer" element={<RegistroChofer />} />
          <Route path="/acceso-chofer" element={<AccesoChofer />} />
          <Route path="/registro-chequeador" element={<RegistroChequeador />} />
          <Route path="/acceso-chequeador" element={<AccesoChequeador />} />
          <Route path="/formulario" element={<EncuestaTransporte />} />
          
          <Route path="/dashboard-estudiante" element={<ProtectedRoute><EstudianteDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/dashboard-chofer" element={<ProtectedRoute><DriverDashboard /></ProtectedRoute>} />
          <Route path="/dashboard-chequeador" element={<ProtectedRoute><ChequeadorDashboard /></ProtectedRoute>} />
          */}

          {/* Si alguien intenta entrar a una ruta no existente, siempre vuelve a Gineva */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthListener>
    </Router>
  );
}