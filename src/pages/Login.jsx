import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"; 
import { supabase } from '../lib/supabase';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState(""); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(""); // Limpiamos errores previos al intentar entrar

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      if (data.user) {
        navigate("/dashboard"); 
      }
    } catch (error) {
      // En lugar de alert, guardamos el mensaje en el estado
      setErrorMsg(error.message === "Invalid login credentials" 
        ? "Correo o contraseña incorrectos" 
        : error.message);
      
      // Opcional: El error desaparece solo después de 4 segundos
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-500 p-4">
      
      <div className="w-full max-w-sm backdrop-blur-lg bg-white/20 rounded-2xl shadow-xl p-6 text-white border border-white/30 relative">
        
        {/* CUADRO ROJO DE ERROR */}
        {errorMsg && (
          <div className="absolute -top-16 left-0 right-0 bg-red-500/90 backdrop-blur-md border border-red-400 text-white text-sm py-3 px-4 rounded-xl shadow-lg flex items-center animate-bounce">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <h2 className="text-center text-3xl font-bold mb-6">
          Iniciar Sesión
        </h2>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <div className="flex items-center bg-white/30 rounded-xl px-3 py-2 border border-white/10">
              <Mail className="w-5 h-5 mr-2 opacity-80" />
              <input 
                type="email" 
                placeholder="Email" 
                className="bg-transparent outline-none w-full text-white placeholder-white/70 text-sm" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div className="mb-3">
            <div className="flex items-center bg-white/30 rounded-xl px-3 py-2 border border-white/10">
              <Lock className="w-5 h-5 mr-2 opacity-80" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Contraseña" 
                className="bg-transparent outline-none w-full text-white placeholder-white/70 text-sm"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                onClick={() => setShowPassword(!showPassword)} 
                type="button" 
                className="ml-2 hover:scale-110 transition-transform"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 opacity-80" />
                ) : (
                  <Eye className="w-5 h-5 opacity-80" />
                )}
              </button>
            </div>
          </div>

          <div className="text-right text-sm mb-5">
            <a href="#" className="text-white/80 hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all py-3 rounded-xl font-bold shadow-lg active:scale-95"
          >
            Iniciar Sesión
          </button>
        </form>

        <p className="text-center text-sm mt-5 text-white/80">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="font-bold text-white hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}