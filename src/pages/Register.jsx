import React, { useState } from "react";
import { User, Mail, Lock, CreditCard, Phone, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '../lib/supabase';
import { InputIcon } from "../components/InputIcon";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    nombre: '', apellido: '', cedula: '', telefono: '', email: '', password: '' 
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    
    if (name === 'nombre' || name === 'apellido') val = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    if (name === 'cedula' || name === 'telefono') val = value.replace(/\D/g, "");
    // Contraseña: Solo números y letras (Alfanumérico)
    if (name === 'password') val = value.replace(/[^a-zA-Z0-9]/g, "");
    
    setFormData({ ...formData, [name]: val });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const { email, password, cedula, nombre, apellido, telefono } = formData;

    if (email.length < 10) return setErrorMsg("Email inválido (mín 10 carac.)");
    const tieneSeguridad = /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
    if (password.length < 8 || !tieneSeguridad) return setErrorMsg("Clave débil: requiere 8 carac, Mayús, Minús y Núm.");

    setLoading(true);
    try {
      // 1. Verificar duplicados (Cédula, Correo o Teléfono)
      const { data: existe, error: eCheck } = await supabase
        .from('perfiles')
        .select('cedula, email, telefono')
        .or(`cedula.eq.${cedula},email.eq.${email.toLowerCase()},telefono.eq.${telefono}`)
        .maybeSingle();

      if (eCheck) throw eCheck;
      
      if (existe) {
        setLoading(false);
        if (existe.cedula === cedula) return setErrorMsg("La cédula ya está registrada.");
        if (existe.email === email.toLowerCase()) return setErrorMsg("El correo ya está en uso.");
        if (existe.telefono === telefono) return setErrorMsg("El teléfono ya está registrado.");
      }

      // 2. Auth y Perfil
      const { data: auth, error: aErr } = await supabase.auth.signUp({ email, password });
      if (aErr) throw aErr;
      
      if (auth.user) {
        const { error: pErr } = await supabase.from('perfiles').insert([{ 
            id: auth.user.id, 
            nombre: nombre.trim(), 
            apellido: apellido.trim(), 
            cedula, 
            telefono, 
            email: email.toLowerCase().trim(), 
            rol: 'estudiante' 
        }]);
        
        if (pErr) throw pErr;
        alert("¡Registro exitoso!");
        navigate("/login");
      }
    } catch (err) { setErrorMsg(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1566D0] p-4 font-sans text-white">
      <div className="w-full max-w-sm backdrop-blur-md bg-white/10 rounded-[32px] shadow-2xl p-8 border border-white/20 relative">
        
        {errorMsg && <div className="absolute -top-12 left-0 right-0 bg-red-600 text-white text-[11px] py-2 px-4 rounded-xl flex items-center shadow-lg animate-bounce border border-red-400 font-bold"><AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {errorMsg}</div>}
        
        <Link to="/login" className="inline-flex items-center text-[10px] text-white/70 hover:text-white mb-6 transition-all font-bold uppercase tracking-widest"><ArrowLeft className="w-3 h-3 mr-1" /> Volver</Link>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-tighter italic">REGISTRO</h2>
          <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1">Portal Estudiantil</p>
        </div>

        <form className="space-y-3" onSubmit={handleRegister}>
          <div className="grid grid-cols-2 gap-3">
            <InputIcon icon={<User size={18}/>} name="nombre" placeholder="Nombre" val={formData.nombre} change={handleChange} max={20}/>
            <InputIcon icon={<User size={18}/>} name="apellido" placeholder="Apellido" val={formData.apellido} change={handleChange} max={20}/>
          </div>

          <InputIcon icon={<CreditCard size={18}/>} name="cedula" placeholder="Cédula" val={formData.cedula} change={handleChange} max={9}/>
          <InputIcon icon={<Phone size={18}/>} name="telefono" placeholder="Teléfono" val={formData.telefono} change={handleChange} max={11}/>
          <InputIcon icon={<Mail size={18}/>} name="email" type="email" placeholder="Correo" val={formData.email} change={handleChange} max={30}/>

          <div className="flex items-center bg-white/5 rounded-2xl px-4 py-3 border border-white/10 focus-within:border-white/40 transition-all">
            <Lock className="w-5 h-5 mr-3 opacity-40" />
            <input 
               name="password" type={showPassword ? "text" : "password"} placeholder="Contraseña" 
               className="bg-transparent outline-none w-full text-white placeholder-white/30 text-sm" 
               required value={formData.password} onChange={handleChange} maxLength={20} 
            />
            <button onClick={() => setShowPassword(!showPassword)} type="button" className="ml-2 opacity-40 hover:opacity-100 transition-opacity">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button 
             type="submit" disabled={loading} 
             className="w-full bg-white text-[#1566D0] hover:bg-blue-50 transition-all py-4 rounded-2xl font-black shadow-xl mt-4 active:scale-95 disabled:opacity-50 uppercase tracking-wider"
          >
            {loading ? "VALIDANDO..." : "CREAR CUENTA"}
          </button>
        </form>
        <p className="text-center text-[11px] mt-8 text-white/60 font-bold uppercase tracking-wider">
           ¿tienes cuenta? <Link to="/login" className="text-white hover:underline decoration-2 underline-offset-4">Inicia Sesión</Link>
        </p>
      </div>
    </div>
  );
}