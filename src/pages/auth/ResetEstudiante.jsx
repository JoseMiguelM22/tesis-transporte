import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setMsg("");

    if (password !== confirmPassword) {
      setMsg("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      setMsg("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setMsg("Contraseña actualizada correctamente");

      setTimeout(() => {
        // ✅ RUTA CORREGIDA: Mandamos al estudiante a su login específico
        navigate("/acceso-estudiante");
      }, 2000);
    } catch (error) {
      setMsg("Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1566D0] flex items-center justify-center px-4 text-white relative overflow-hidden">
      
      {/* EFECTOS DE FONDO PARA MANTENER LA ESTÉTICA */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

      {/* CARD */}
      <div className="relative z-10 w-full max-w-sm backdrop-blur-md bg-white/10 border border-white/15 rounded-3xl shadow-2xl p-8">

        {/* ICONO */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* TITULO */}
        <h1 className="text-2xl font-extrabold text-center mb-2 italic tracking-tighter uppercase">
          Nueva contraseña
        </h1>

        <p className="text-center text-white/60 text-sm mb-6">
          Ingresa tu nueva contraseña segura para el sistema IMTT
        </p>

        {/* MENSAJE */}
        {msg && (
          <div className={`mb-4 text-center text-xs font-bold rounded-xl p-3 border ${
            msg.includes("correctamente") 
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" 
              : "bg-red-500/20 border-red-500/50 text-red-300"
          }`}>
            {msg}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleResetPassword} className="space-y-4">

          {/* PASSWORD */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-white/30 transition shadow-inner">
            <Lock className="w-5 h-5 mr-3 text-white/40" />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent outline-none text-white placeholder-white/35 text-sm font-bold"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-white/40 hover:text-white transition"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-white/30 transition shadow-inner">
            <CheckCircle className="w-5 h-5 mr-3 text-white/40" />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-transparent outline-none text-white placeholder-white/35 text-sm font-bold"
            />
          </div>

          {/* BOTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-[#1566D0] py-4 rounded-2xl font-black italic tracking-widest shadow-xl hover:bg-blue-50 transition active:scale-[0.98] disabled:opacity-60 uppercase"
          >
            {loading ? "Actualizando..." : "ACTUALIZAR CLAVE"}
          </button>
        </form>

        {/* FOOTER */}
        <p className="text-center text-[10px] font-bold uppercase text-white/40 mt-6 tracking-widest">
          Redirección automática al finalizar
        </p>
      </div>
    </div>
  );
}