import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

import { supabase } from "../../lib/supabase.js";
import { InputIcon } from "../../components/InputIcon.jsx";

export default function Login() {
  const navigate = useNavigate();

  // Estados
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper para mensajes temporales
  const showMessage = (msg, duration = 4000) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), duration);
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        navigate("/dashboard");
      }
    } catch (error) {
      const message =
        error?.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos"
          : "Ocurrió un error al iniciar sesión";

      showMessage(message);
    } finally {
      setLoading(false);
    }
  };

  // Recuperar contraseña
  const handleForgotPassword = async () => {
    if (!email) {
      showMessage("Ingresa tu correo primero", 3000);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // 🔥 MAGIA AQUÍ: window.location.origin detecta automáticamente tu dominio de Vercel
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      // Mensaje seguro
      showMessage(
        "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña"
      );
    } catch (error) {
      showMessage("No se pudo procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1566D0] flex items-center justify-center px-4 py-8 text-white overflow-hidden relative">
      
      {/* EFECTOS DE FONDO */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

      {/* LOGOS DECORATIVOS */}
      <div className="hidden xl:flex absolute left-12 top-1/2 -translate-y-1/2 opacity-[0.08]">
        <div className="w-80 h-80 rounded-full overflow-hidden border border-white/10 shadow-2xl">
          <img src="/logotrans.jpeg" alt="Logo" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="hidden xl:flex absolute right-12 top-1/2 -translate-y-1/2 opacity-[0.08]">
        <div className="w-80 h-80 rounded-full overflow-hidden border border-white/10 shadow-2xl">
          <img src="/logotrans.jpeg" alt="Logo" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="relative z-10 w-full max-w-md">

        {/* ALERTA */}
        {errorMsg && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 flex items-center gap-2 rounded-2xl border border-red-400 bg-red-500 px-4 py-3 text-sm font-medium shadow-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CARD */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-[32px] shadow-2xl p-8">

          {/* LOGOS SUPERIORES */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/10 shadow-xl bg-white">
              <img src="/logotrans.jpeg" alt="Logo Transporte" className="w-full h-full object-cover" />
            </div>

            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white/10 shadow-xl bg-white p-2">
              <img src="/imtt.jpeg" alt="IMTT" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* VOLVER */}
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors font-semibold tracking-wide mb-7"
          >
            <ArrowLeft className="w-4 h-4" />
            Inicio
          </Link>

          {/* HEADER */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Iniciar sesión
            </h1>

            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              Accede con tu correo institucional para consultar rutas,
              horarios y disponibilidad de transporte.
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-5">

            <InputIcon
              icon={<Mail size={18} />}
              name="email"
              type="email"
              placeholder="Correo electrónico"
              val={email}
              change={(e) => setEmail(e.target.value)}
              max={50}
            />

            <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-white/30 transition-all">
              <Lock className="w-5 h-5 mr-3 text-white/40" />

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Contraseña"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/35"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* RECUPERAR */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-white/65 hover:text-white transition-colors font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-white py-3.5 text-[#1566D0] font-bold shadow-lg transition-all hover:bg-blue-50 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-center text-sm text-white/65 mt-8">
            ¿No tienes cuenta?{" "}
            <Link
              to="/registro"
              className="font-semibold text-white hover:underline underline-offset-4"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}