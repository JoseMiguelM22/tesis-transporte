import React, { useState, useMemo } from "react";
import { User, Mail, Lock, CreditCard, Phone, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '../../lib/supabase';

export default function RegisterChequeador() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({ msg: "", type: "error" });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', apellido: '', cedula: '', telefono: '', email: '', password: '' });

  const showMessage = (msg, type = "error") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert({ msg: "", type: "error" }), 4000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (['nombre', 'apellido'].includes(name)) val = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "").slice(0, 15);
    if (name === 'cedula') val = value.replace(/\D/g, "").slice(0, 10);
    if (name === 'telefono') val = value.replace(/\D/g, "").slice(0, 11);
    if (name === 'email') val = value.replace(/\s/g, "").slice(0, 40);
    if (name === 'password') val = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
    setFormData({ ...formData, [name]: val });
  };

  const validations = useMemo(() => {
    const { nombre, apellido, email, password, cedula, telefono } = formData;
    return {
      nombre: nombre.length >= 3,
      apellido: apellido.length >= 3,
      cedula: cedula.length >= 7,
      telefono: telefono.length === 11,
      email: email.includes("@") && email.length >= 10,
      passwordLength: password.length >= 8,
      passwordUpper: /[A-Z]/.test(password),
      passwordLower: /[a-z]/.test(password),
      passwordNumber: /\d/.test(password)
    };
  }, [formData]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!Object.values(validations).every(v => v)) return showMessage("Completa los campos correctamente");

    setLoading(true);
    try {
      const { email, password, cedula, nombre, apellido, telefono } = formData;
      const query = `cedula.eq.${cedula},email.eq.${email.toLowerCase()},telefono.eq.${telefono}`;
      
      const [estCheck, chofCheck, cheqCheck] = await Promise.all([
        supabase.from('perfiles').select('cedula').or(query).maybeSingle(),
        supabase.from('choferes').select('cedula').or(query).maybeSingle(),
        supabase.from('chequeadores').select('cedula').or(query).maybeSingle()
      ]);

      if (estCheck.data || chofCheck.data || cheqCheck.data) {
        return showMessage("Estos datos de identidad ya pertenecen a un usuario activo del circuito.");
      }

      const { data: auth, error: aErr } = await supabase.auth.signUp({ email, password });
      if (aErr) throw aErr;

      if (auth.user) {
        const { error: pErr } = await supabase.from('chequeadores').insert([{
          id: auth.user.id, nombre: nombre.trim(), apellido: apellido.trim(),
          cedula, telefono, email: email.toLowerCase().trim()
        }]);

        if (pErr) throw pErr;
        showMessage("¡Registro de Chequeador exitoso!", "success");
        setTimeout(() => navigate("/acceso-chequeador"), 1500);
      }
    } catch (err) { showMessage(err.message); } finally { setLoading(false); }
  };

  const CheckItem = ({ ok, text }) => (
    <div className="flex items-center gap-1 text-[11px] font-bold">
      {ok ? <CheckCircle className="text-green-400 w-3.5 h-3.5" /> : <XCircle className="text-red-400 w-3.5 h-3.5" />}
      <span className={ok ? "text-green-100" : "text-red-200"}>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1566D0] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Fondo decorativo sutil */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-[120px]" />
      </div>
      
      {alert.msg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 flex items-center gap-2 rounded-2xl border ${alert.type === "success" ? "bg-emerald-500/90 border-emerald-400 text-white" : "bg-red-500/90 border-red-400 text-white"} px-4 py-3 text-sm font-bold shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2`}>
          <AlertCircle className="w-5 h-5 shrink-0" /> <p>{alert.msg}</p>
        </div>
      )}

      {/* TARJETA ESTILO GLASSMORPHISM */}
      <div className="relative z-10 w-full max-w-md backdrop-blur-md bg-white/10 border border-white/20 rounded-[30px] p-8 shadow-2xl text-white my-8">
        
        {/* BOTÓN VOLVER */}
        <div className="mb-6">
          <Link 
            to="/acceso-chequeador" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
        </div>

        {/* LOGOS / ICONOS SUPERIORES */}
        <div className="flex justify-center items-center gap-6 mb-6">
          {/* Logo UniRoute sin fondo blanco */}
          <div className="w-20 h-20 flex items-center justify-center drop-shadow-xl">
            <img 
              src="/UniRoute.png" 
              alt="UniRoute Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          {/* Icono de Chequeador */}
          <div className="w-16 h-16 bg-white rounded-[1.2rem] flex items-center justify-center shadow-xl text-[#1566D0]">
            <UserCheck size={32} strokeWidth={2} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-1">Registro</h2>
        <p className="text-center text-xs text-white/70 mb-6">Crea credenciales de operaciones en paradas.</p>

        <form onSubmit={handleRegister} className="space-y-4 text-left">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-4 h-4 text-white/60" />
              <input name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required className="w-full bg-transparent border border-white/30 rounded-xl pl-10 pr-3 py-3 text-sm outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all" />
            </div>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-4 h-4 text-white/60" />
              <input name="apellido" placeholder="Apellido" value={formData.apellido} onChange={handleChange} required className="w-full bg-transparent border border-white/30 rounded-xl pl-10 pr-3 py-3 text-sm outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all" />
            </div>
          </div>
          
          <div className="relative">
            <CreditCard className="absolute left-4 top-3.5 w-5 h-5 text-white/60" />
            <input name="cedula" placeholder="Cédula de Identidad" value={formData.cedula} onChange={handleChange} required className="w-full bg-transparent border border-white/30 rounded-xl pl-12 pr-4 py-3 text-sm outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all" />
          </div>
          
          <div className="relative">
            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-white/60" />
            <input name="telefono" placeholder="Número de Teléfono" value={formData.telefono} onChange={handleChange} required className="w-full bg-transparent border border-white/30 rounded-xl pl-12 pr-4 py-3 text-sm outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all" />
          </div>
          
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-white/60" />
            <input name="email" type="email" placeholder="Correo Operativo (Máx 40)" value={formData.email} onChange={handleChange} required className="w-full bg-transparent border border-white/30 rounded-xl pl-12 pr-4 py-3 text-sm outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all" />
          </div>

          <div className="space-y-3 pt-2">
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-white/60" />
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Clave Maestra" required value={formData.password} onChange={handleChange} className="w-full bg-transparent border border-white/30 rounded-xl pl-12 pr-12 py-3 text-sm outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-white/60 hover:text-white transition-colors">
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-1 bg-black/10 rounded-xl p-3 border border-white/5">
              <CheckItem ok={validations.passwordLength} text="8 caracteres" />
              <CheckItem ok={validations.passwordUpper} text="Mayúscula" />
              <CheckItem ok={validations.passwordLower} text="Minúscula" />
              <CheckItem ok={validations.passwordNumber} text="Número" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-white text-[#1566D0] py-3.5 rounded-xl font-bold mt-4 shadow-lg active:scale-[0.98] disabled:opacity-70 transition-all flex items-center justify-center gap-2 hover:bg-blue-50">
            {loading ? "VALIDANDO..." : "INSCRIBIR CHEQUEADOR"}
          </button>
        </form>
      </div>
    </div>
  );
}