import React, { useState, useMemo } from "react";
import { User, Mail, Lock, CreditCard, Phone, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle, XCircle } from "lucide-react";
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
      <span className={ok ? "text-green-300" : "text-red-300"}>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center px-4 py-8 text-white relative overflow-hidden">
      
      {alert.msg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 flex items-center gap-2 rounded-2xl border ${alert.type === "success" ? "bg-emerald-500 border-emerald-400" : "bg-red-500 border-red-400"} px-4 py-3 text-sm shadow-lg`}>
          <AlertCircle className="w-4 h-4" /> {alert.msg}
        </div>
      )}

      <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/15 rounded-[32px] p-8 shadow-2xl">
        <Link to="/acceso-chequeador" className="inline-flex items-center text-xs text-slate-300 hover:text-white mb-6"><ArrowLeft className="w-4 h-4 mr-1" /> Volver al Login</Link>
        <h2 className="text-3xl font-extrabold text-center mb-2">Registro</h2>
        <p className="text-center text-xs text-slate-300 mb-6 font-semibold">Crea credenciales de operaciones en paradas.</p>

        <form onSubmit={handleRegister} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center bg-white/5 rounded-2xl px-4 py-3 border border-white/10"><User className="w-5 h-5 mr-3 opacity-40" /><input name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required className="bg-transparent w-full outline-none text-sm placeholder:text-white/40" /></div>
            <div className="flex items-center bg-white/5 rounded-2xl px-4 py-3 border border-white/10"><User className="w-5 h-5 mr-3 opacity-40" /><input name="apellido" placeholder="Apellido" value={formData.apellido} onChange={handleChange} required className="bg-transparent w-full outline-none text-sm placeholder:text-white/40" /></div>
          </div>
          <div className="flex items-center bg-white/5 rounded-2xl px-4 py-3 border border-white/10"><CreditCard className="w-5 h-5 mr-3 opacity-40" /><input name="cedula" placeholder="Cédula de Identidad" value={formData.cedula} onChange={handleChange} required className="bg-transparent w-full outline-none text-sm placeholder:text-white/40" /></div>
          <div className="flex items-center bg-white/5 rounded-2xl px-4 py-3 border border-white/10"><Phone className="w-5 h-5 mr-3 opacity-40" /><input name="telefono" placeholder="Número de Teléfono" value={formData.telefono} onChange={handleChange} required className="bg-transparent w-full outline-none text-sm placeholder:text-white/40" /></div>
          <div className="flex items-center bg-white/5 rounded-2xl px-4 py-3 border border-white/10"><Mail className="w-5 h-5 mr-3 opacity-40" /><input name="email" type="email" placeholder="Correo Operativo (Máx 40)" value={formData.email} onChange={handleChange} required className="bg-transparent w-full outline-none text-sm placeholder:text-white/40" /></div>

          <div className="space-y-2">
            <div className="flex items-center bg-white/5 rounded-2xl px-4 py-3 border border-white/10 focus-within:border-white/40 transition-all">
              <Lock className="w-5 h-5 mr-3 opacity-40" />
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Clave Maestra" required value={formData.password} onChange={handleChange} className="bg-transparent w-full outline-none text-sm" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-1">
              <CheckItem ok={validations.passwordLength} text="8 caracteres" />
              <CheckItem ok={validations.passwordUpper} text="Mayúscula" />
              <CheckItem ok={validations.passwordLower} text="Minúscula" />
              <CheckItem ok={validations.passwordNumber} text="Número" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-white text-slate-800 py-3.5 rounded-2xl font-black mt-4 shadow-lg active:scale-[0.98] disabled:opacity-50">
            {loading ? "VALIDANDO CREDENCIALES..." : "INSCRIBIR CHEQUEADOR"}
          </button>
        </form>
      </div>
    </div>
  );
}