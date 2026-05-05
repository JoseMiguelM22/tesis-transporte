import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
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

    if (password.length < 6) {
      setMsg("La contraseña debe tener al menos 6 caracteres");
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
        navigate("/login");
      }, 2000);
    } catch (error) {
      setMsg("Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1566D0] flex items-center justify-center px-4 text-white">

      {/* CARD */}
      <div className="w-full max-w-sm backdrop-blur-md bg-white/10 border border-white/15 rounded-3xl shadow-2xl p-8">

        {/* ICONO */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* TITULO */}
        <h1 className="text-2xl font-extrabold text-center mb-2">
          Nueva contraseña
        </h1>

        <p className="text-center text-white/60 text-sm mb-6">
          Ingresa tu nueva contraseña segura
        </p>

        {/* MENSAJE */}
        {msg && (
          <div className="mb-4 text-center text-sm text-white/90 bg-white/10 border border-white/10 rounded-xl p-2">
            {msg}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleResetPassword} className="space-y-4">

          {/* PASSWORD */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-white/30 transition">
            <Lock className="w-5 h-5 mr-3 text-white/40" />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent outline-none text-white placeholder-white/40 text-sm"
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
          <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-white/30 transition">
            <CheckCircle className="w-5 h-5 mr-3 text-white/40" />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-transparent outline-none text-white placeholder-white/40 text-sm"
            />
          </div>

          {/* BOTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-[#1566D0] py-3 rounded-2xl font-bold shadow-lg hover:bg-blue-50 transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>

        {/* FOOTER */}
        <p className="text-center text-xs text-white/60 mt-6">
          Serás redirigido al login automáticamente
        </p>
      </div>
    </div>
  );
}