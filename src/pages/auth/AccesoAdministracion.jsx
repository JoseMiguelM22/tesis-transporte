import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { Car, Lock, Mail, Eye, EyeOff, ShieldCheck, Settings, ArrowRight, UserCheck } from "lucide-react";

export default function LoginCentral() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

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
      // Aquí pones el correo que acabas de crear en Supabase
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
        navigate("/driver");
        return;
      }

      // C. SI NO ES NINGUNO (Es un estudiante o intruso en la página errónea)
      alert("Acceso denegado: Esta zona es exclusiva para personal autorizado.");
      await supabase.auth.signOut();

    } catch (error) {
      alert("Error de acceso: Credenciales inválidas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1d3d] flex items-center justify-center p-6 font-sans relative overflow-hidden text-slate-900">
      
      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[50px] p-12 shadow-2xl z-10 border border-white/20 animate-in fade-in zoom-in duration-500">
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#0D47A1] rounded-[28px] flex items-center justify-center shadow-xl mb-6 text-white transform -rotate-3 transition-transform hover:rotate-0">
            <UserCheck size={40} />
          </div>
          <h1 className="text-3xl font-black italic text-[#0D47A1] tracking-tighter uppercase leading-none text-center">
            ACCESO<br/><span className="text-blue-500 font-light">PERSONAL</span>
          </h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-4">Administración y Operadores</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* INPUT EMAIL */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest text-left block">Correo Institucional</label>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email" 
                placeholder="usuario@unefa.com"
                required
                className="w-full pl-14 pr-6 py-5 bg-slate-100/50 border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-bold text-slate-700 italic placeholder:text-slate-300"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* INPUT PASSWORD */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-6 tracking-widest text-left block">Clave Maestra</label>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                required
                className="w-full pl-14 pr-16 py-5 bg-slate-100/50 border border-slate-200 rounded-3xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-bold text-slate-700 italic placeholder:text-slate-300"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#0D47A1] text-white py-6 rounded-3xl font-black italic text-xl shadow-xl shadow-blue-900/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? "VERIFICANDO..." : "IDENTIFICARSE"}
            {!loading && <ArrowRight size={22} />}
          </button>
        </form>

        {/* PIE DE PÁGINA */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
           <button 
            onClick={() => navigate("/login")} 
            className="text-[9px] font-black text-slate-300 hover:text-[#0D47A1] uppercase tracking-[0.3em] transition-all"
           >
             Portal de Estudiantes
           </button>
           <div className="flex items-center gap-2 opacity-30">
              <ShieldCheck size={12} />
              <span className="text-[8px] font-bold uppercase">Sistema Encriptado 2026</span>
           </div>
        </div>

      </div>
    </div>
  );
}