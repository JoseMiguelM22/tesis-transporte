import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Loader2, ArrowRight, Car, ShieldAlert } from "lucide-react";

export default function AccesoChofer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true); // Activa el spinner de carga de inmediato

    try {
      // 1. Iniciar sesión directamente en el sistema de autenticación de Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        throw new Error("Credenciales inválidas. Revisa tu correo y contraseña.");
      }

      if (authData?.user) {
        // 2. Verificar de forma rápida si el usuario existe en la tabla operativa de choferes
        const { data: chofer, error: dbError } = await supabase
          .from("choferes")
          .select("id")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (dbError) {
          console.error("Error consultando tabla choferes:", dbError.message);
        }

        // Si por alguna razón de asincronía el ID no empareja al instante, hacemos un fallback por Email
        if (!chofer) {
          const { data: choferAlt } = await supabase
            .from("choferes")
            .select("id")
            .eq("email", formData.email)
            .maybeSingle();

          if (!choferAlt) {
            // Si de verdad no existe el registro en la tabla de choferes, limpiamos sesión y rebotamos
            await supabase.auth.signOut();
            throw new Error("No se encontró ningún perfil de chofer registrado para esta cuenta.");
          }
        }

        // 🎯 REDIRECCIÓN CONFIGURADA: Cambiado a la ruta exacta en minúsculas de tu App.jsx
        navigate("/dashboard-chofer");
      }
    } catch (err) {
      console.error("Error en Login de Chofer:", err.message);
      setErrorMsg(err.message);
    } finally {
      setLoading(false); // Apaga el estado de carga pase lo que pase
    }
  };

  return (
    <div className="min-h-screen bg-[#1566D0] flex flex-col items-center justify-center p-6 text-white font-sans text-left relative overflow-hidden">
      
      {/* Fondo decorativo blur */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-[#0D47A1]/80 backdrop-blur-md p-10 rounded-[45px] shadow-2xl border border-white/10 relative z-10 animate-in fade-in duration-300">
        
        {/* ENCABEZADO */}
        <div className="mb-8 text-center sm:text-left">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-1 justify-center sm:justify-start">
            <Car size={14} /> Módulo de Operadores
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Ingreso Choferes</h2>
          <p className="text-blue-200 text-xs mt-1 font-medium">Inicia sesión para gestionar el estado de tu unidad en la ruta.</p>
        </div>

        {/* MENSAJE DE ERROR */}
        {errorMsg && (
          <div className="mb-5 p-4 bg-red-500/20 border border-red-500/40 text-red-200 rounded-2xl flex gap-3 text-xs font-bold items-center animate-in shake duration-200">
            <ShieldAlert size={20} className="shrink-0 text-red-400" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* FORMULARIO DE INGRESO */}
        <form onSubmit={handleLogin} className="space-y-4 text-slate-800">
          
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-slate-400 w-4 h-4" />
            <input 
              type="email" 
              name="email" 
              placeholder="CORREO ELECTRÓNICO" 
              required
              value={formData.email} 
              onChange={handleChange}
              className="w-full bg-white rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold outline-none text-slate-800 focus:ring-2 focus:ring-emerald-500/30 shadow-inner"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-slate-400 w-4 h-4" />
            <input 
              type="password" 
              name="password" 
              placeholder="CONTRASEÑA" 
              required
              value={formData.password} 
              onChange={handleChange}
              className="w-full bg-white rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold outline-none text-slate-800 focus:ring-2 focus:ring-emerald-500/30 shadow-inner"
            />
          </div>

          {/* BOTÓN DE ACCIÓN */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-emerald-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <><Car size={16} /> INICIAR TRAYECTO <ArrowRight size={14}/></>
            )}
          </button>
        </form>

        {/* ENLACES EN PIE */}
        <div className="mt-8 pt-4 border-t border-white/5 flex justify-between text-xs text-blue-200 font-bold uppercase tracking-wider">
          <Link to="/" className="hover:text-white transition-colors">← Volver</Link>
          <Link to="/registro-chofer" className="text-white border-b border-white/20 hover:border-white transition-all">Registrar Unidad</Link>
        </div>

      </div>
    </div>
  );
}