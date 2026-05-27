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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans text-left relative overflow-hidden">
      
      {/* Fondo decorativo muy sutil para no perder la elegancia */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-slate-800 p-10 rounded-[45px] shadow-2xl border border-slate-700 relative z-10 animate-in fade-in duration-300">
        
        {/* ENCABEZADO */}
        <div className="mb-8 text-center sm:text-left">
          <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-widest mb-2 justify-center sm:justify-start">
            <Car size={14} /> Módulo de Operadores
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-white">Ingreso Choferes</h2>
          <p className="text-slate-400 text-xs mt-2 font-medium">Inicia sesión para gestionar el estado de tu unidad en la ruta.</p>
        </div>

        {/* MENSAJE DE ERROR */}
        {errorMsg && (
          <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex gap-3 text-xs font-bold items-center animate-in shake duration-200">
            <ShieldAlert size={20} className="shrink-0" />
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
              className="w-full bg-white rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold outline-none text-slate-800 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
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
              className="w-full bg-white rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold outline-none text-slate-800 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
            />
          </div>

          {/* BOTÓN DE ACCIÓN */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <><Car size={16} /> INICIAR TRAYECTO <ArrowRight size={14}/></>
            )}
          </button>
        </form>

        {/* ENLACES EN PIE */}
        <div className="mt-8 pt-4 border-t border-slate-700 flex justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
          <Link to="/" className="hover:text-slate-300 transition-colors">← Volver</Link>
          <Link to="/registro-chofer" className="text-blue-400 hover:text-blue-300 transition-colors">Registrar Unidad</Link>
        </div>

      </div>
    </div>
  );
}