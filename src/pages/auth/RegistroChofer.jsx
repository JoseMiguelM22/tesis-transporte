import React, { useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { 
  User, ShieldCheck, CreditCard, Phone, Car, 
  Lock, Loader2, ArrowRight, Mail, LogIn, Users, MapPin, Bus,
  Eye, EyeOff, AlertCircle, CheckCircle, XCircle
} from "lucide-react";
import { InputIcon } from "../../components/InputIcon";

export default function RegistroChofer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // --- ESTADOS DE INTERFAZ Y VALIDACIÓN ---
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({ msg: "", type: "error" });

  // --- ESTADO DEL FORMULARIO ---
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    placa: "", 
    capacidad: "4", 
    ruta: "Maraven - Centro", // 🎯 Defecto en la ruta principal
    email: "",
    password: "",
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
    
    // 🎯 Limpiadores y Límites estrictos (Igual al estudiante + placa)
    if (name === 'nombre' || name === 'apellido') val = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "").slice(0, 15);
    if (name === 'cedula') val = value.replace(/\D/g, "").slice(0, 10);
    if (name === 'telefono') val = value.replace(/\D/g, "").slice(0, 11);
    if (name === 'placa') val = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
    if (name === 'email') val = value.replace(/\s/g, "").slice(0, 40);
    
    // 🎯 RESTRICCIÓN DE CONTRASEÑA: Solo letras y números, sin espacios
    if (name === 'password') val = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);

    // Los selectores de capacidad y ruta pasan directo
    if (name === 'capacidad' || name === 'ruta') val = value;

    setFormData({ ...formData, [name]: val });
  };

  // --- CHECKLIST DE VALIDACIONES AUTOMÁTICAS ---
  const validations = useMemo(() => {
    const { nombre, apellido, email, password, cedula, telefono, placa } = formData;
    return {
      nombre: nombre.length >= 3,
      apellido: apellido.length >= 3,
      cedula: cedula.length >= 7,
      telefono: telefono.length === 11,
      placa: placa.length >= 6,
      email: email.includes("@") && email.length >= 10,
      passwordLength: password.length >= 8,
      passwordUpper: /[A-Z]/.test(password),
      passwordLower: /[a-z]/.test(password),
      passwordNumber: /\d/.test(password)
    };
  }, [formData]);

  // --- LÓGICA DE REGISTRO BLINDADA ---
  const handleRegistro = async (e) => {
    e.preventDefault();
    
    // Verificamos que todo el semáforo esté en verde
    if (!Object.values(validations).every(v => v)) {
      return showMessage("Revisa que todos los campos cumplan los requisitos");
    }

    setLoading(true);

    try {
      const { email, password, cedula, nombre, apellido, telefono, placa, capacidad, ruta } = formData;
      
      // 1. Evitar duplicados cruzados (Estudiantes o Choferes con los mismos datos)
      const query = `cedula.eq.${cedula},email.eq.${email.toLowerCase()},telefono.eq.${telefono}`;
      const [estCheck, chofCheck] = await Promise.all([
        supabase.from('perfiles').select('cedula').or(query).maybeSingle(),
        supabase.from('choferes').select('cedula').or(query).maybeSingle()
      ]);

      if (estCheck.data || chofCheck.data) {
        return showMessage("Estos datos (Cédula, Email o Teléfono) ya están registrados en el sistema.");
      }

      // 2. Registro en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        const capacidadNum = parseInt(capacidad, 10);

        // 3. Inserción en la tabla unificada de choferes
        const { error: dbError } = await supabase
          .from("choferes") 
          .insert([
            {
              id: authData.user.id,
              nombre: nombre.trim(),
              apellido: apellido.trim(),
              cedula: cedula,
              telefono: telefono,
              placa_vehiculo: placa,
              email: email.toLowerCase().trim(),
              ruta: ruta, 
              kyc_verificado: false, 
              capacidad_total: capacidadNum, 
              puestos_libres: capacidadNum, 
              estado: "disponible"
            }
          ]);

        if (dbError) throw dbError;
        
        setSuccess(true);
      }
    } catch (err) {
      console.error("Error en Registro:", err.message);
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- COMPONENTE VISUAL DEL CHECKLIST ---
  const CheckItem = ({ ok, text }) => (
    <div className="flex items-center gap-1 text-[11px] font-bold">
      {ok ? <CheckCircle className="text-green-400 w-3.5 h-3.5" /> : <XCircle className="text-red-400 w-3.5 h-3.5" />}
      <span className={ok ? "text-green-300" : "text-red-300"}>{text}</span>
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
            Tu cuenta ha sido registrada correctamente. Al ingresar al sistema, deberás completar tu auditoría digital (KYC) subiendo las fotos de tus documentos para habilitar los controles de ruta.
          </p>
          <div className="p-4 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-xs text-amber-200 font-bold uppercase tracking-widest mb-6">
            ⏳ Estatus: Pendiente por Documentación
          </div>
          
          <button 
            onClick={() => navigate("/acceso-chofer")} 
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
    <div className="min-h-screen bg-[#1566D0] flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden text-white">
      
      {/* Fondo decorativo sutil */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[120px]" />
      </div>

      {/* ALERTA FLOTANTE ESTILO ESTUDIANTE */}
      {alert.msg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 flex items-center gap-2 rounded-2xl border ${alert.type === "success" ? "bg-emerald-500 border-emerald-400" : "bg-red-500 border-red-400"} px-4 py-3 text-sm shadow-lg animate-in slide-in-from-top-4`}>
          <AlertCircle className="w-4 h-4 shrink-0" /> {alert.msg}
        </div>
      )}

      {/* TARJETA ESTILO GLASSMORPHISM */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-[35px] border border-white/20 shadow-2xl p-6 sm:p-8 relative z-10 animate-in fade-in duration-300 my-8">
        
        {/* BOTÓN VOLVER */}
        <div className="mb-6">
          <Link 
            to="/acceso-chofer" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-xs font-medium uppercase tracking-wider"
          >
            ← Volver
          </Link>
        </div>

        {/* LOGOS / ICONOS SUPERIORES */}
        <div className="flex justify-center items-center gap-5 mb-6">
          <div className="w-20 h-20 flex items-center justify-center drop-shadow-xl">
            <img 
              src="/UniRoute.png" 
              alt="UniRoute Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="w-16 h-16 bg-white rounded-[1.2rem] flex items-center justify-center shadow-xl text-[#1566D0]">
            <Bus size={32} strokeWidth={2} />
          </div>
        </div>

        {/* ENCABEZADO */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1">Registro Chofer</h2>
          <p className="text-white/70 text-xs">Completa tus datos operativos de ruta.</p>
        </div>

        {/* FORMULARIO BLINDADO */}
        <form onSubmit={handleRegistro} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            <InputIcon icon={<User size={18}/>} name="nombre" placeholder="Nombre" val={formData.nombre} change={handleChange} maxLength={15} />
            <InputIcon icon={<User size={18}/>} name="apellido" placeholder="Apellido" val={formData.apellido} change={handleChange} maxLength={15} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputIcon icon={<CreditCard size={18}/>} name="cedula" placeholder="Cédula" val={formData.cedula} change={handleChange} maxLength={10} />
            <InputIcon icon={<Phone size={18}/>} name="telefono" placeholder="Teléfono" val={formData.telefono} change={handleChange} maxLength={11} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputIcon icon={<Car size={18}/>} name="placa" placeholder="PLACA" val={formData.placa} change={handleChange} maxLength={8} />
            
            {/* SELECT DE CAPACIDAD */}
            <div className="relative">
              <Users className="absolute left-3.5 top-3.5 text-white/60 w-4 h-4" />
              <select
                name="capacidad"
                value={formData.capacidad}
                onChange={handleChange}
                className="w-full bg-transparent border border-white/30 rounded-xl pl-10 pr-3 py-3 text-xs outline-none text-white appearance-none cursor-pointer focus:border-white focus:ring-1 focus:ring-white transition-all h-full"
              >
                <option value="4" className="text-slate-800">4 PUESTOS</option>
                <option value="5" className="text-slate-800">5 PUESTOS</option>
              </select>
            </div>
          </div>

          {/* SELECT DE RUTA */}
          <div className="relative">
            <MapPin className="absolute left-4 top-3.5 text-white/60 w-4 h-4" />
            <select
              name="ruta"
              value={formData.ruta}
              onChange={handleChange}
              className="w-full bg-transparent border border-white/30 rounded-xl pl-11 pr-4 py-3 text-xs font-bold outline-none text-white appearance-none cursor-pointer uppercase tracking-wider focus:border-white focus:ring-1 focus:ring-white transition-all"
            >
              <option value="Maraven - Centro" className="text-slate-800">RUTA: MARAVEN - CENTRO</option>
              <option value="Maraven - Punta Cardón" className="text-slate-800">RUTA: MARAVEN - PUNTA CARDÓN</option>
            </select>
          </div>

          <div className="border-t border-white/20 pt-4 space-y-3">
            <InputIcon icon={<Mail size={18}/>} name="email" placeholder="Correo (Máx 40)" val={formData.email} change={handleChange} maxLength={40} />

            {/* SECTOR DE CONTRASEÑA BLINDADA */}
            <div className="space-y-2">
              <div className="flex items-center bg-white/5 rounded-2xl px-4 py-3 border border-white/10 focus-within:border-white/40 transition-all">
                <Lock className="w-5 h-5 mr-3 opacity-40 shrink-0" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  placeholder="Contraseña" 
                  required 
                  value={formData.password} 
                  onChange={handleChange} 
                  className="bg-transparent w-full outline-none text-sm placeholder:text-white/60" 
                  maxLength={20}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2 text-white/40 hover:text-white transition-colors shrink-0">
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              
              {/* Checklist visual idéntico al de estudiantes */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-1 bg-black/10 rounded-xl p-3 border border-white/5 mt-2">
                <CheckItem ok={validations.passwordLength} text="8 caracteres" />
                <CheckItem ok={validations.passwordUpper} text="Mayúscula" />
                <CheckItem ok={validations.passwordLower} text="Minúscula" />
                <CheckItem ok={validations.passwordNumber} text="Número" />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-6 bg-white text-[#1566D0] py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 hover:bg-blue-50 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <><ShieldCheck size={18} /> REGISTRAR OPERADOR <ArrowRight size={16}/></>}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-white/70">
          <p>
            ¿Ya posees una cuenta?{" "}
            <Link to="/acceso-chofer" className="text-white font-bold hover:underline underline-offset-2 transition-all">
              Ingresar
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}