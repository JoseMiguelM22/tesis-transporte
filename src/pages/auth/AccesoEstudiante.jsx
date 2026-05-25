import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
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

  const showMessage = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // 1. Intentamos el login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        // 2. 🛡️ FILTRO DE SEGURIDAD SILENCIOSO
        // Buscamos si el usuario es un chofer registrado
        const { data: esChofer } = await supabase
          .from("choferes")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle();

        // 🚨 SI ES CHOFER: Cerramos sesión y forzamos error genérico
        if (esChofer) {
          await supabase.auth.signOut({ scope: 'local' });
          throw new Error("Credenciales inválidas"); // Mensaje genérico para no dar pistas
        }

        // 3. Si no es chofer, permitimos el acceso al dashboard de estudiante
        navigate("/dashboard-estudiante");
      }
    } catch (error) {
      // Mensaje siempre genérico para no revelar existencia de cuentas en otros roles
      showMessage("Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showMessage("Ingresa tu correo primero");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      showMessage("Si el correo está registrado, recibirás un enlace de recuperación");
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

      <div className="relative z-10 w-full max-w-md">
        {errorMsg && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 flex items-center gap-2 rounded-2xl border border-red-400 bg-red-500 px-4 py-3 text-sm font-medium shadow-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-[32px] shadow-2xl p-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/10 shadow-xl bg-white">
              <img src="/logotrans.jpeg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white/10 shadow-xl bg-white p-2">
              <img src="/imtt.jpeg" alt="IMTT" className="w-full h-full object-contain" />
            </div>
          </div>

          <Link to="/" className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors font-semibold tracking-wide mb-7">
            <ArrowLeft className="w-4 h-4" /> Inicio
          </Link>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">Iniciar sesión</h1>
            <p className="text-sm text-white/60 mt-2">Accede con tu cuenta institucional.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <InputIcon icon={<Mail size={18} />} name="email" type="email" placeholder="Correo electrónico" val={email} change={(e) => setEmail(e.target.value)} max={50} />

            <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-white/30 transition-all">
              <Lock className="w-5 h-5 mr-3 text-white/40" />
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Contraseña" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/35" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2 text-white/40 hover:text-white transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={handleForgotPassword} className="text-xs text-white/65 hover:text-white transition-colors font-medium">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-white py-3.5 text-[#1566D0] font-bold shadow-lg transition-all hover:bg-blue-50 active:scale-[0.98] disabled:opacity-60">
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="text-center text-sm text-white/65 mt-8">
            ¿No tienes cuenta? <Link to="/registro-estudiante" className="font-semibold text-white hover:underline underline-offset-4">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}