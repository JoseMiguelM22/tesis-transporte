import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verificar si hay una sesión activa al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Escuchar cambios (por si el usuario cierra sesión en otra pestaña)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Mientras Supabase responde, mostramos una pantalla de carga bonita
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1566D0] flex items-center justify-center">
        <Loader2 className="animate-spin text-white w-12 h-12" />
      </div>
    );
  }

  // Si no hay sesión (el intruso), lo redirigimos al login principal
  if (!session) {
    return <Navigate to="/" replace />; 
  }

  // Si está logueado, lo dejamos pasar a la ruta que pidió (children)
  return children;
}