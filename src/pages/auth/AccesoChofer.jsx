import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Loader2, ShieldAlert, Bus } from "lucide-react";

export default function AccesoChofer() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (authError) {
        throw new Error(
          "Credenciales inválidas. Revisa tu correo y contraseña."
        );
      }

      if (authData?.user) {
        const { data: chofer, error: dbError } = await supabase
          .from("choferes")
          .select("id")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (dbError) {
          console.error(dbError.message);
        }

        if (!chofer) {
          const { data: choferAlt } = await supabase
            .from("choferes")
            .select("id")
            .eq("email", formData.email)
            .maybeSingle();

          if (!choferAlt) {
            await supabase.auth.signOut();
            throw new Error(
              "No se encontró ningún perfil de chofer registrado para esta cuenta."
            );
          }
        }

        navigate("/dashboard-chofer");
      }
    } catch (err) {
      console.error(err.message);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1566D0] flex items-center justify-center p-5 relative overflow-hidden">

      {/* EFECTOS DE FONDO */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-blue-300/20 rounded-full blur-[140px]" />
      </div>

      {/* CARD PRINCIPAL */}
      <div className="relative z-10 w-full max-w-md">

        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-8 text-white">

          {/* VOLVER */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-all text-sm font-semibold"
            >
              ← Inicio
            </Link>
          </div>

          {/* HEADER */}
          <div className="flex flex-col items-center mb-8">

            {/* CONTENEDOR DE LOGOS LADO A LADO */}
            <div className="flex justify-center items-center gap-6 mb-6">
              
              {/* LOGO SIN FONDOS */}
              <div className="w-24 h-24 drop-shadow-2xl flex items-center justify-center">
                <img
                  src="/UniRoute.png"
                  alt="UniRoute"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* ICONO BUS SIN FONDO BLANCO */}
              <div className="w-20 h-20 rounded-[1.5rem] border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center shadow-xl">
                <Bus size={42} strokeWidth={2} className="text-white" />
              </div>

            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-center drop-shadow-lg">
              Acceso Chofer
            </h1>

            <p className="text-white/80 text-sm mt-2 text-center max-w-xs">
              Ingresa con tus credenciales para acceder al sistema de transporte.
            </p>
          </div>

          {/* ERROR */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border border-red-400/40 flex gap-3 items-start animate-in shake duration-200">
              <ShieldAlert
                size={20}
                className="text-red-300 shrink-0 mt-0.5"
              />
              <p className="text-red-100 text-sm font-medium leading-relaxed">
                {errorMsg}
              </p>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-4">

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />

              <input
                type="email"
                name="email"
                placeholder="Correo electrónico"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/50 outline-none focus:border-white/70 focus:bg-white/10 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />

              <input
                type="password"
                name="password"
                placeholder="Contraseña"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/50 outline-none focus:border-white/70 focus:bg-white/10 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-white text-[#1566D0] py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-[0_10px_30px_rgba(255,255,255,0.25)] hover:bg-blue-50 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Ingresando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          {/* FOOTER */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-white/75 text-sm">
              ¿No tienes cuenta?
            </p>

            <Link
              to="/registro-chofer"
              className="inline-block mt-2 text-white font-bold hover:underline underline-offset-4 transition-all"
            >
              Registrarse como Chofer
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}