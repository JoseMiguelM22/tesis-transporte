import React, { useState, useMemo } from "react";
import { 
  User, Mail, Lock, CreditCard, Phone, Eye, EyeOff, 
  ArrowLeft, AlertCircle, CheckCircle, XCircle, Briefcase, 
  Loader2, ShieldCheck, ArrowRight, LogIn
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '../../lib/supabase';
import { InputIcon } from "../../components/InputIcon";

export default function Register() {
  const navigate = useNavigate();

  // --- ESTADOS DE INTERFAZ Y VALIDACIÓN ---
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({ msg: "", type: "error" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // --- ESTADO DEL FORMULARIO ---
  const [formData, setFormData] = useState({ 
    nombre: '', apellido: '', cedula: '', telefono: '', email: '', password: '', rol: 'Estudiante' 
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
    if (!Object.values(validations).every(v => v))
      return showMessage("Revisa que todos los campos cumplan los requisitos");

    setLoading(true);
    try {
      const { email, password, cedula, nombre, apellido, telefono, rol } = formData;
      
      // 1. Evitar duplicados cruzados en las tablas principales
      const query = `cedula.eq.${cedula},email.eq.${email.toLowerCase()},telefono.eq.${telefono}`;
      const [estCheck, chofCheck] = await Promise.all([
        supabase.from('perfiles').select('cedula').or(query).maybeSingle(),
        supabase.from('choferes').select('cedula').or(query).maybeSingle()
      ]);

      if (estCheck.data || chofCheck.data) return showMessage("Estos datos ya están registrados.");

      // 2. Registro en Supabase Auth
      const { data: auth, error: aErr } = await supabase.auth.signUp({ email, password });
      if (aErr) throw aErr;

      if (auth.user) {
        // 3. Inserción en perfiles con el rol de la comunidad asignado
        const { error: pErr } = await supabase.from('perfiles').insert([{
          id: auth.user.id, 
          nombre: nombre.trim(), 
          apellido: apellido.trim(),
          cedula, 
          telefono, 
          email: email.toLowerCase().trim(), 
          rol: rol
        }]);

        if (pErr) throw pErr;

        setSuccess(true);
      }
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const CheckItem = ({ ok, text }) => (
    <div className="flex items-center gap-1 text-[11px] font-bold">
      {ok ? <CheckCircle className="text-green-400 w-3.5 h-3.5" /> : <XCircle className="text-red-400 w-3.5 h-3.5" />}
      <span className={ok ? "text-green-300" : "text-red-300"}>{text}</span>
    </div>
  );

  // --- VISTA DE ÉXITO (GLASSMORPHISM COHESIVA) ---
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
            Tu cuenta ha sido creada exitosamente dentro de la comunidad. Al ingresar al sistema, recuerda verificar tus datos para habilitar el uso de los tickets y rutas.
          </p>
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 font-bold uppercase tracking-widest mb-6">
            ✔️ Registro Completado: {formData.rol.toUpperCase()}
          </div>
          
          <button 
            onClick={() => navigate("/login")} 
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
    <div className="min-h-screen bg-[#1566D0] flex items-center justify-center px-4 py-8 text-white relative overflow-hidden">
      
      {/* EFECTOS DE FONDO */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

      {alert.msg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 flex items-center gap-2 rounded-2xl border ${alert.type === "success" ? "bg-emerald-500 border-emerald-400" : "bg-red-500 border-red-400"} px-4 py-3 text-sm shadow-lg animate-in slide-in-from-top-4`}>
          <AlertCircle className="w-4 h-4 shrink-0" /> {alert.msg}
        </div>
      )}

      <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/10 border border-white/15 rounded-[32px] p-8 shadow-2xl my-8">
        <Link to="/acceso-estudiante" className="inline-flex items-center text-xs text-white/70 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Link>
        
        {/* LOGO UNEFA FLOTANTE */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 flex items-center justify-center drop-shadow-2xl">
            <img src="/logounefa.png" alt="Logo UNEFA" className="w-full h-full object-contain" />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-center mb-1 tracking-tight">Registro</h2>
        <p className="text-center text-xs text-white/70 mb-6">Únete a la comunidad de transporte universitario.</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InputIcon icon={<User size={18}/>} name="nombre" placeholder="Nombre" val={formData.nombre} change={handleChange} maxLength={15} />
            <InputIcon icon={<User size={18}/>} name="apellido" placeholder="Apellido" val={formData.apellido} change={handleChange} maxLength={15} />
          </div>
          <InputIcon icon={<CreditCard size={18}/>} name="cedula" placeholder="Cédula" val={formData.cedula} change={handleChange} maxLength={10} />
          <InputIcon icon={<Phone size={18}/>} name="telefono" placeholder="Teléfono" val={formData.telefono} change={handleChange} maxLength={11} />

          {/* SELECTOR DE ROL UNIVERSITARIO */}
          <div className="flex items-center bg-white/5 rounded-2xl px-4 py-3 border border-white/10 focus-within:border-white/40 transition-all">
            <Briefcase className="w-5 h-5 mr-3 opacity-40 shrink-0" />
            <select 
              name="rol" 
              value={formData.rol} 
              onChange={handleChange} 
              className="bg-transparent w-full outline-none text-sm text-white appearance-none cursor-pointer focus:text-white [&>option]:text-slate-800"
            >
              <option value="Estudiante">Estudiante</option>
              <option value="Docente">Docente</option>
              <option value="Personal Administrativo">Personal Administrativo</option>
              <option value="Personal Obrero">Personal Obrero</option>
              <option value="Personal Militar">Personal Militar</option>
            </select>
          </div>

          <InputIcon icon={<Mail size={18}/>} name="email" placeholder="Correo (Máx 40)" val={formData.email} change={handleChange} maxLength={40} />

          <div className="space-y-2">
            <div className="flex items-center bg-white/5 rounded-2xl px-4 py-3 border border-white/10 focus-within:border-white/40 transition-all">
              <Lock className="w-5 h-5 mr-3 opacity-40 shrink-0" />
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Contraseña" required value={formData.password} onChange={handleChange} className="bg-transparent w-full outline-none text-sm placeholder:text-white/60" maxLength={20}/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2 text-white/40 hover:text-white transition-colors shrink-0">
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-1 bg-black/10 rounded-xl p-3 border border-white/5 mt-2">
              <CheckItem ok={validations.passwordLength} text="8 caracteres" />
              <CheckItem ok={validations.passwordUpper} text="Mayúscula" />
              <CheckItem ok={validations.passwordLower} text="Minúscula" />
              <CheckItem ok={validations.passwordNumber} text="Número" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-white text-[#1566D0] py-3.5 rounded-2xl font-bold mt-6 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-blue-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <>REGISTRARSE <ArrowRight size={16}/></>}
          </button>
        </form>
      </div>
    </div>
  );
}