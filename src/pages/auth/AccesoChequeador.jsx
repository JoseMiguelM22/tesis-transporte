import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, UserCheck } from "lucide-react";
import { supabase } from "../../lib/supabase.js";

export default function LoginChequeador() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const showMessage = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data?.user) {
        // 🛡️ REVISIÓN EN CADENA DE ROLES EXPULSIVA: Evita intrusiones cruzadas
        const [estCheck, chofCheck] = await Promise.all([
          supabase.from("perfiles").select("id").eq("id", data.user.id).maybeSingle(),
          supabase.from("choferes").select("id").eq("id", data.user.id).maybeSingle()
        ]);

        // Si pertenece a estudiantes o choferes, lo sacamos de esta interfaz silenciosamente
        if (estCheck.data || chofCheck.data) {
          await supabase.auth.signOut({ scope: 'local' });
          throw new Error("Credenciales incorrectas"); 
        }

        // Si pasó el control silencioso, redirige al panel de control de paradas
        navigate("/dashboard-chequeador");
      }
    } catch (error) {
      showMessage("Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1566D0] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Fondo decorativo sutil para darle profundidad */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-[120px]" />
      </div>

      {/* TARJETA ESTILO GLASSMORPHISM */}
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-[30px] border border-white/20 shadow-2xl p-8 relative z-10 animate-in fade-in duration-300 text-white">
        
        {/* BOTÓN VOLVER */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Inicio
          </Link>
        </div>

        {/* LOGOS / ICONOS SUPERIORES MÁS GRANDES */}
        <div className="flex justify-center items-center gap-6 mb-8">
          
          {/* Logo UniRoute sin fondo blanco */}
          <div className="w-24 h-24 flex items-center justify-center drop-shadow-xl">
            <img 
              src="/UniRoute.png" 
              alt="UniRoute Logo" 
              className="w-full h-full object-contain"
            />
          </div>

          {/* Icono de Chequeador con fondo tipo cristal (igual que chofer) */}
          <div className="w-20 h-20 rounded-[1.5rem] border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center shadow-xl">
            <UserCheck size={42} strokeWidth={2} className="text-white" />
          </div>

        </div>

        {/* ENCABEZADO */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-1">Iniciar sesión</h2>
          <p className="text-white/70 text-xs">Accede como chequeador de línea.</p>
        </div>

        {/* MENSAJE DE ERROR */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-100 rounded-xl flex gap-3 text-xs font-bold items-center animate-in shake duration-200">
            <AlertCircle size={18} className="shrink-0 text-red-300" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* FORMULARIO DE INGRESO */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-white/60 w-5 h-5" />
            <input 
              type="email" 
              placeholder="Correo operativo" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full bg-transparent border border-white/30 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-white/60 w-5 h-5" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Clave Maestra" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full bg-transparent border border-white/30 rounded-xl pl-12 pr-12 py-3.5 text-sm outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-4 top-3.5 text-white/60 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* BOTÓN DE ACCIÓN BLANCO */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-white text-[#1566D0] py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:bg-blue-50 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? "Autenticando..." : "Ingresar a Parada"}
          </button>
        </form>

        {/* ENLACES EN PIE */}
        <div className="mt-6 text-center text-xs text-white/70">
          <p>
            ¿No estás inscrito?{" "}
            <Link to="/registro-chequeador" className="text-white font-bold hover:underline underline-offset-2">
              Inscribirse
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}