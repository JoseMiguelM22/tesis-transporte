import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
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
    // 🎨 CORRECCIÓN DE COLOR: bg-slate-800 y eliminación de círculos de fondo
    <div className="min-h-screen bg-slate-800 flex items-center justify-center px-4 py-8 text-white relative overflow-hidden">
      
      <div className="relative z-10 w-full max-w-md">
        {errorMsg && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 flex items-center gap-2 rounded-2xl border border-red-400 bg-red-500 px-4 py-3 text-sm font-medium shadow-lg">
            <AlertCircle className="w-4 h-4" /> <span>{errorMsg}</span>
          </div>
        )}

        <div className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-[32px] shadow-2xl p-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/10 shadow-xl bg-white flex items-center justify-center">
              <img src="/logotrans.jpeg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white/10 shadow-xl bg-white p-2">
              <img src="/imtt.jpeg" alt="IMTT" className="w-full h-full object-contain" />
            </div>
          </div>

          <Link to="/" className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white font-semibold mb-7">
            <ArrowLeft className="w-4 h-4" /> Inicio del Sistema
          </Link>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">Acceso Operador</h1>
            <p className="text-sm text-slate-300 mt-2 font-medium">Punto de Control y Despacho de Línea.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 text-left">
            <div className="flex items-center bg-white/5 rounded-2xl px-4 py-3 border border-white/10">
              <Mail className="w-5 h-5 mr-3 text-white/40" />
              <input type="email" placeholder="Correo operativo" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent outline-none text-sm placeholder:text-white/30" />
            </div>

            <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-white/30 transition-all">
              <Lock className="w-5 h-5 mr-3 text-white/40" />
              <input type={showPassword ? "text" : "password"} placeholder="Clave Maestra" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent outline-none text-sm" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2 text-white/40 hover:text-white">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* 🎨 Ajuste de color del botón a Slate en lugar de Púrpura */}
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-white py-3.5 text-slate-800 font-black shadow-lg transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60 text-xs uppercase tracking-widest">
              {loading ? "Autenticando..." : "Ingresar a Parada"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-300 mt-8 font-medium">
            ¿No estás inscrito?{" "}
            <Link to="/registro-chequeador" className="font-black text-white hover:underline underline-offset-4">Inscribirse</Link>
          </p>
        </div>
      </div>
    </div>
  );
}