import React, { useState, useMemo } from "react";
import { 
  User, Mail, Lock, CreditCard, Phone, Eye, EyeOff, 
  ArrowLeft, AlertCircle, CheckCircle, XCircle, UserCheck, 
  ShieldCheck, Loader2, ArrowRight, LogIn
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '../../lib/supabase';

export default function RegisterChequeador() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // --- ESTADOS DE INTERFAZ Y VALIDACIÓN ---
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({ msg: "", type: "error" });

  // --- ESTADO DEL FORMULARIO ---
  const [formData, setFormData] = useState({ 
    nombre: '', 
    apellido: '', 
    cedula: '', 
    telefono: '', 
    email: '', 
    password: '' 
  });

  // --- FUNCIÓN PARA MOSTRAR ALERTAS ---
  const showMessage = (msg, type = "error") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert({ msg: "", type: "error" }), 4000);
  };

  // --- MANEJADOR DE CAMBIOS CON FILTRADO ESTRICTO EN CALIENTE ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    
    // 🎯 Limpiadores y Límites estrictos
    if (name === 'nombre' || name === 'apellido') val = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "").slice(0, 15);
    if (name === 'cedula') val = value.replace(/\D/g, "").slice(0, 10);
    if (name === 'telefono') val = value.replace(/\D/g, "").slice(0, 11);
    if (name === 'email') val = value.replace(/\s/g, "").slice(0, 40);
    
    // 🎯 RESTRICCIÓN DE CONTRASEÑA: Solo letras y números, sin espacios
    if (name === 'password') val = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
    
    setFormData({ ...formData, [name]: val });
  };

  // --- CHECKLIST DE VALIDACIONES AUTOMÁTICAS ---
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

  // --- LÓGICA DE REGISTRO BLINDADA ---
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Verificamos que todo el semáforo esté en verde
    if (!Object.values(validations).every(v => v)) {
      return showMessage("Revisa que todos los campos cumplan los requisitos");
    }

    setLoading(true);
    try {
      const { email, password, cedula, nombre, apellido, telefono } = formData;
      const query = `cedula.eq.${cedula},email.eq.${email.toLowerCase()},telefono.eq.${telefono}`;
      
      // 1. Evitar duplicados cruzados en TODO el sistema
      const [estCheck, chofCheck, cheqCheck] = await Promise.all([
        supabase.from('perfiles').select('cedula').or(query).maybeSingle(),
        supabase.from('choferes').select('cedula').or(query).maybeSingle(),
        supabase.from('chequeadores').select('cedula').or(query).maybeSingle()
      ]);

      if (estCheck.data || chofCheck.data || cheqCheck.data) {
        return showMessage("Estos datos (Cédula, Email o Teléfono) ya pertenecen a un usuario activo del circuito.");
      }

      // 2. Registro en Supabase Auth
      const { data: auth, error: aErr } = await supabase.auth.signUp({ 
        email: email.toLowerCase(), 
        password 
      });
      
      if (aErr) throw aErr;

      if (auth.user) {
        // 3. Inserción en la tabla de chequeadores
        const { error: pErr } = await supabase.from('chequeadores').insert([{
          id: auth.user.id, 
          nombre: nombre.trim(), 
          apellido: apellido.trim(),
          cedula: cedula, 
          telefono: telefono, 
          email: email.toLowerCase().trim()
        }]);

        if (pErr) throw pErr;
        
        // Transición a la pantalla de éxito
        setSuccess(true);
      }
    } catch (err) { 
      showMessage(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  // --- COMPONENTE VISUAL DEL CHECKLIST ---
  const CheckItem = ({ ok, text }) => (
    <div className="flex items-center gap-1 text-[11px] font-bold">
      {ok ? <CheckCircle className="text-green-400 w-3.5 h-3.5" /> : <XCircle className="text-red-400 w-3.5 h-3.5" />}
      <span className={ok ? "text-green-100" : "text-red-200"}>{text}</span>
    </div>
  );

  // --- VISTA DE ÉXITO (GLASSMORPHISM) ---
  if (success) {
    return (
      <div className="min-h-screen bg-[#1566D0] flex flex-col items-center justify-center p-6 text-white font-sans relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-white rounded-full blur-[120px]" />
        </div>

        <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-[35px] border border-white/20 shadow-2xl p-10 text-center relative z-10 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl mb-6">
            <ShieldCheck size={42} className="text-[#1566D0]" />
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-4">¡Perfil Creado!</h2>
          <p className="text-sm text-white/80 font-medium leading-relaxed mb-6">
            Tu cuenta de Chequeador ha sido registrada correctamente. Ya puedes acceder al sistema para gestionar el flujo de unidades en tu parada asignada.
          </p>
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 font-bold uppercase tracking-widest mb-6">
            ✔️ Credenciales Activas
          </div>
          
          <button 
            onClick={() => navigate("/acceso-chequeador")} 
            className="w-full bg-white text-[#1566D0] py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 hover:bg-blue-50"
          >
            <LogIn size={16} /> Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA DEL FORMULARIO PRINCIPAL ---
  return (
    <div className="min-h-screen bg-[#1566D0] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden text-white">
      
      {/* Fondo decorativo sutil */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-[120px]" />
      </div>
      
      {/* ALERTA FLOTANTE ESTILO ESTUDIANTE */}
      {alert.msg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 flex items-center gap-2 rounded-2xl border ${alert.type === "success" ? "bg-emerald-500/90 border-emerald-400 text-white" : "bg-red-500/90 border-red-400 text-white"} px-4 py-3 text-sm font-bold shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2`}>
          <AlertCircle className="w-5 h-5 shrink-0" /> <p>{alert.msg}</p>
        </div>
      )}

      {/* TARJETA ESTILO GLASSMORPHISM */}
      <div className="relative z-10 w-full max-w-md backdrop-blur-md bg-white/10 border border-white/20 rounded-[30px] p-6 sm:p-8 shadow-2xl my-8">
        
        {/* BOTÓN VOLVER */}
        <div className="mb-6">
          <Link 
            to="/acceso-chequeador" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-xs font-medium uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
        </div>

        {/* LOGOS / ICONOS SUPERIORES */}
        <div className="flex justify-center items-center gap-6 mb-6">
          <div className="w-20 h-20 flex items-center justify-center drop-shadow-xl">
            <img 
              src="/UniRoute.png" 
              alt="UniRoute Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="w-16 h-16 bg-white rounded-[1.2rem] flex items-center justify-center shadow-xl text-[#1566D0]">
            <UserCheck size={32} strokeWidth={2} />
          </div>
        </div>

        {/* ENCABEZADO */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1">Registro Chequeador</h2>
          <p className="text-xs text-white/70">Crea credenciales de operaciones en paradas.</p>
        </div>

        {/* FORMULARIO BLINDADO */}
        <form onSubmit={handleRegister} className="space-y-4 text-left">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-white/60" />
              <input 
                name="nombre" 
                placeholder="Nombre" 
                value={formData.nombre} 
                onChange={handleChange} 
                required 
                maxLength={15}
                className="w-full bg-transparent border border-white/30 rounded-xl pl-10 pr-3 py-3 text-sm outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all" 
              />
            </div>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-white/60" />
              <input 
                name="apellido" 
                placeholder="Apellido" 
                value={formData.apellido} 
                onChange={handleChange} 
                required 
                maxLength={15}
                className="w-full bg-transparent border border-white/30 rounded-xl pl-10 pr-3 py-3 text-sm outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all" 
              />
            </div>
          </div>
          
          <div className="relative">
            <CreditCard className="absolute left-3.5 top-3.5 w-5 h-5 text-white/60" />
            <input 
              name="cedula" 
              placeholder="Cédula de Identidad" 
              value={formData.cedula} 
              onChange={handleChange} 
              required 
              maxLength={10}
              className="w-full bg-transparent border border-white/30 rounded-xl pl-12 pr-4 py-3 text-sm outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all" 
            />
          </div>
          
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-white/60" />
            <input 
              name="telefono" 
              type="tel"
              placeholder="Número de Teléfono" 
              value={formData.telefono} 
              onChange={handleChange} 
              required 
              maxLength={11}
              className="w-full bg-transparent border border-white/30 rounded-xl pl-12 pr-4 py-3 text-sm outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all" 
            />
          </div>
          
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-white/60" />
            <input 
              name="email" 
              type="email" 
              placeholder="Correo Operativo (Máx 40)" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              maxLength={40}
              className="w-full bg-transparent border border-white/30 rounded-xl pl-12 pr-4 py-3 text-sm outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all" 
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="relative flex items-center bg-white/5 rounded-xl border border-white/30 focus-within:border-white focus-within:ring-1 focus-within:ring-white transition-all pr-4">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-white/60" />
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="Clave Maestra" 
                required 
                value={formData.password} 
                onChange={handleChange} 
                maxLength={20}
                className="w-full bg-transparent pl-12 py-3 text-sm outline-none text-white placeholder:text-white/60" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="text-white/60 hover:text-white transition-colors"
              >
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

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-white text-[#1566D0] py-3.5 rounded-xl font-bold mt-4 shadow-lg active:scale-[0.98] disabled:opacity-70 transition-all flex items-center justify-center gap-2 hover:bg-blue-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <><ShieldCheck size={18} /> REGISTRAR CHEQUEADOR <ArrowRight size={16}/></>}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-white/70">
          <p>
            ¿Ya posees una cuenta?{" "}
            <Link to="/acceso-chequeador" className="text-white font-bold hover:underline underline-offset-2 transition-all">
              Ingresar
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}