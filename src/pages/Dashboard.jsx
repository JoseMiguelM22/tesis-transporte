import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, User as UserIcon, Loader2, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getUsuario();
  }, []);

  async function getUsuario() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: perfil, error } = await supabase
          .from('perfiles')
          .select('nombre')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (perfil) setNombre(perfil.nombre);
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error:", error.message);
      navigate("/");
    } finally {
      setCargando(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Card de Bienvenida - Full Responsive */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-4">
            <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-200">
              <UserIcon className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-slate-800">
                ¡Hola, <span className="text-blue-600">{nombre || "Usuario"}</span>!
              </h1>
              <p className="text-slate-500 font-medium text-sm md:text-base">
                Panel de Gestión de Transporte
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full md:w-auto flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar Sesión
          </button>
        </div>

        {/* Stats Grid - Adaptable a 1 o 3 columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Estatus Cuenta</p>
              <p className="text-xl font-extrabold text-slate-800">Activa</p>
            </div>
            <CheckCircle className="text-green-500 w-8 h-8" />
          </div>
          
          {/* Espacio para futuras tarjetas (Rutas, Tickets, etc.) */}
          <div className="bg-slate-200/50 p-6 rounded-3xl border border-dashed border-slate-300 flex items-center justify-center">
            <p className="text-slate-400 text-xs font-bold italic">Próximos Módulos...</p>
          </div>
        </div>

      </div>
    </div>
  );
}