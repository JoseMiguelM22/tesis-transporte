import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft, Shield } from "lucide-react";

export default function LoginCentral() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Intento de inicio de sesión con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const user = data.user;

      // --- LÓGICA DE DETECCIÓN DE ROLES ---

      // A. ¿ES EL ADMINISTRADOR MAESTRO? 
      const MASTER_ADMIN_EMAIL = "admin@gmail.com"; 

      if (user.email === MASTER_ADMIN_EMAIL) {
        console.log("⚡ Acceso Master Admin otorgado");
        navigate("/admin");
        return;
      }

      // B. ¿ES UN CHOFER? (Buscamos en la tabla choferes por su user_id)
      const { data: chofer } = await supabase
        .from("choferes")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (chofer) {
        console.log("🚛 Acceso Chofer detectado");
        navigate("/chofer");
        return;
      }

      // C. SI NO ES NINGUNO (Es un estudiante o intruso en la página errónea)
      setErrorMsg("Acceso denegado: Esta zona es exclusiva para personal autorizado.");
      await supabase.auth.signOut();

    } catch (error) {
      setErrorMsg("Error de acceso: Credenciales inválidas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1d3d] flex items-center justify-center p-6 lg:p-12 font-sans relative overflow-hidden">
      
      {/* Elementos decorativos de fondo principal */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* CONTENEDOR PRINCIPAL - SPLIT LAYOUT PARA DESKTOP */}
      <div className="w-full max-w-6xl bg-slate-900 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col lg:flex-row overflow-hidden min-h-[650px] relative z-10 border border-slate-800">
        
        {/* ================= COLUMNA IZQUIERDA: BRANDING ================= */}
        <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-[#0D47A1] to-[#1566D0] p-16 flex-col justify-between relative overflow-hidden text-white border-r border-blue-800/50">
          
          {/* Elementos decorativos internos */}
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
          
          {/* Logos Claros */}
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-32 h-32 flex items-center justify-center drop-shadow-2xl">
              <img src="/UniRoute.png" alt="UniRoute" className="w-full h-full object-contain" />
            </div>
            <div className="w-24 h-24 flex items-center justify-center drop-shadow-2xl">
              <img src="/logounefa.png" alt="UNEFA" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="relative z-10 mt-12 mb-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 shadow-xl">
              <Shield size={16} className="text-blue-200" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Zona Restringida</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-black uppercase tracking-tight leading-none mb-6 drop-shadow-md">
              Centro de<br/>
              <span className="font-light text-blue-200">Control Operativo</span>
            </h1>
            <p className="text-blue-100/90 text-sm font-medium leading-relaxed max-w-sm">
              Acceso exclusivo para el personal administrativo y el equipo de monitoreo logístico. Toda la actividad dentro de este panel está siendo registrada y auditada.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-2 opacity-50">
            <ShieldCheck size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Sistema Encriptado 2026</span>
          </div>
        </div>


        {/* ================= COLUMNA DERECHA: FORMULARIO OSCURO ================= */}
        <div className="w-full lg:w-7/12 p-8 sm:p-16 lg:px-24 flex flex-col justify-center relative">
          
          

          <div className="max-w-md w-full mx-auto mt-12 lg:mt-0">
            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Identificación</h2>
              <p className="text-sm font-medium text-slate-400">Ingresa tus credenciales maestras para continuar.</p>
            </div>

            {/* MENSAJE DE ERROR */}
            {errorMsg && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex gap-3 text-xs font-bold items-start animate-in shake duration-200">
                <Shield size={18} className="shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              
              {/* CORREO */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 ml-1">Correo Institucional</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input 
                    type="email" 
                    placeholder="admin@unefa.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-[#1566D0]/50 focus:border-[#1566D0] transition-all text-sm font-medium text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* CONTRASEÑA */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 ml-1">Clave Maestra</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-[#1566D0]/50 focus:border-[#1566D0] transition-all text-sm font-medium text-white placeholder:text-slate-500"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* BOTÓN */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-4 bg-[#1566D0] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-[#0D47A1] transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? "VERIFICANDO..." : "INGRESAR AL SISTEMA"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="mt-12 text-center border-t border-slate-800 pt-8">
              <p className="text-xs font-semibold text-slate-500">
                Al ingresar, aceptas someterte a las políticas de seguridad y auditoría de la institución.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}