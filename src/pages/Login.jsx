// src/pages/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react"; 
import { supabase } from '../lib/supabase';
import { InputIcon } from "../components/InputIcon.jsx"; // Reutilizamos el componente

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState(""); 
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) navigate("/dashboard"); 
    } catch (error) {
      setErrorMsg(error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos" : error.message);
      setTimeout(() => setErrorMsg(""), 4000);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1566D0] p-4 font-sans text-white">
      <div className="w-full max-w-sm backdrop-blur-md bg-white/10 rounded-[32px] shadow-2xl p-8 border border-white/20 relative">
        
        {/* Notificaciones */}
        {errorMsg && <div className="absolute -top-12 left-0 right-0 bg-red-600 text-white text-[11px] py-2 px-4 rounded-xl flex items-center shadow-lg animate-bounce border border-red-400 font-bold"><AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {errorMsg}</div>}

        <Link to="/" className="inline-flex items-center text-[10px] text-white/70 hover:text-white mb-6 transition-all font-bold uppercase tracking-widest">
          <ArrowLeft className="w-3 h-3 mr-1" /> Inicio
        </Link>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-tighter italic uppercase">Ingresar</h2>
          <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1">Acceso Estudiantil</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          {/* Input de Email usando el componente modular */}
          <InputIcon icon={<Mail size={20}/>} name="email" type="email" placeholder="Email" val={email} change={(e) => setEmail(e.target.value)} max={50} />
          
          {/* Input de Password (Especial por el ojo) */}
          <div className="flex items-center bg-white/5 rounded-2xl px-4 py-3 border border-white/10 focus-within:border-white/40 transition-all">
            <Lock className="w-5 h-5 mr-3 opacity-40" />
            <input name="password" type={showPassword ? "text" : "password"} placeholder="Contraseña" className="bg-transparent outline-none w-full text-white placeholder-white/30 text-sm" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={() => setShowPassword(!showPassword)} type="button" className="ml-2 opacity-40 hover:opacity-100 transition-opacity">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="text-right">
            <a href="#" className="text-[10px] font-bold text-white/60 hover:text-white uppercase tracking-tighter transition-colors">¿Olvidaste tu clave?</a>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-white text-[#1566D0] hover:bg-blue-50 transition-all py-4 rounded-2xl font-black shadow-xl mt-2 active:scale-95 disabled:opacity-50 uppercase tracking-wider">
            {loading ? "Entrando..." : "Iniciar Sesión"}
          </button>
        </form>

        <p className="text-center text-[11px] mt-8 text-white/60 font-bold uppercase tracking-wider">
          ¿No tienes cuenta? <Link to="/registro" className="text-white hover:underline decoration-2 underline-offset-4">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}