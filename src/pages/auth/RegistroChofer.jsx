import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { 
  User, ShieldCheck, CreditCard, Phone, Car, 
  Lock, Loader2, ArrowRight, Mail, LogIn, Users, MapPin, Bus
} from "lucide-react";

export default function RegistroChofer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  // --- MANEJADOR DE CAMBIOS CON FILTRADO EN CALIENTE ---
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "nombre" || name === "apellido") {
      const soloLetras = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
      setFormData({ ...formData, [name]: soloLetras });
    } 
    else if (name === "cedula" || name === "telefono") {
      const soloNumeros = value.replace(/[^0-9]/g, "");
      setFormData({ ...formData, [name]: soloNumeros });
    } 
    else if (name === "placa") {
      const alfanumericoMayus = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      setFormData({ ...formData, [name]: alfanumericoMayus });
    } 
    else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // --- LÓGICA DE REGISTRO UNIFICADA ---
  const handleRegistro = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Registro en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        const capacidadNum = parseInt(formData.capacidad, 10);

        // 2. Inserción en la tabla unificada de choferes
        const { error: dbError } = await supabase
          .from("choferes") 
          .insert([
            {
              id: authData.user.id,
              nombre: formData.nombre,
              apellido: formData.apellido,
              cedula: formData.cedula,
              telefono: formData.telefono,
              placa_vehiculo: formData.placa,
              email: formData.email,
              ruta: formData.ruta, 
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
      alert("Error al registrar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- VISTA DE ÉXITO (ADAPTADA AL GLASSMORPHISM) ---
  if (success) {
    return (
      <div className="min-h-screen bg-[#1566D0] flex flex-col items-center justify-center p-6 text-white font-sans relative overflow-hidden">
        
        {/* Fondo decorativo blur */}
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

  // --- VISTA DEL FORMULARIO ---
  return (
    <div className="min-h-screen bg-[#1566D0] flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden text-white">
      
      {/* Fondo decorativo sutil */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[120px]" />
      </div>

      {/* TARJETA ESTILO GLASSMORPHISM */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-[35px] border border-white/20 shadow-2xl p-6 sm:p-8 relative z-10 animate-in fade-in duration-300">
        
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

        {/* FORMULARIO */}
        <form onSubmit={handleRegistro} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 text-white/60 w-4 h-4" />
              <input 
                type="text" name="nombre" placeholder="Nombre" required
                maxLength={15}
                value={formData.nombre} onChange={handleChange}
                className="w-full bg-transparent border border-white/30 rounded-xl pl-10 pr-3 py-3 text-xs outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all"
              />
            </div>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 text-white/60 w-4 h-4" />
              <input 
                type="text" name="apellido" placeholder="Apellido" required
                maxLength={15}
                value={formData.apellido} onChange={handleChange}
                className="w-full bg-transparent border border-white/30 rounded-xl pl-10 pr-3 py-3 text-xs outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-3.5 text-white/60 w-4 h-4" />
              <input 
                type="text" name="cedula" placeholder="Cédula" required
                maxLength={10}
                value={formData.cedula} onChange={handleChange}
                className="w-full bg-transparent border border-white/30 rounded-xl pl-10 pr-3 py-3 text-xs outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 text-white/60 w-4 h-4" />
              <input 
                type="tel" name="telefono" placeholder="Teléfono" required
                maxLength={15}
                value={formData.telefono} onChange={handleChange}
                className="w-full bg-transparent border border-white/30 rounded-xl pl-10 pr-3 py-3 text-xs outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Car className="absolute left-3.5 top-3.5 text-white/60 w-4 h-4" />
              <input 
                type="text" name="placa" placeholder="PLACA" required
                maxLength={8}
                value={formData.placa} onChange={handleChange}
                className="w-full bg-transparent border border-white/30 rounded-xl pl-10 pr-3 py-3 text-xs outline-none text-white placeholder:text-white/60 uppercase tracking-widest focus:border-white focus:ring-1 focus:ring-white transition-all"
              />
            </div>
            
            <div className="relative">
              <Users className="absolute left-3.5 top-3.5 text-white/60 w-4 h-4" />
              <select
                name="capacidad"
                value={formData.capacidad}
                onChange={handleChange}
                className="w-full bg-transparent border border-white/30 rounded-xl pl-10 pr-3 py-3 text-xs outline-none text-white appearance-none cursor-pointer focus:border-white focus:ring-1 focus:ring-white transition-all"
              >
                {/* Nota: Se aplica color negro a las options para que se lean al abrir el selector */}
                <option value="4" className="text-slate-800">4 PUESTOS</option>
                <option value="5" className="text-slate-800">5 PUESTOS</option>
              </select>
            </div>
          </div>

          {/* 🎯 SELECCIÓN DE RUTA */}
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
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-white/60 w-5 h-5" />
              <input 
                type="email" name="email" placeholder="Correo electrónico" required
                maxLength={30}
                value={formData.email} onChange={handleChange}
                className="w-full bg-transparent border border-white/30 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-white/60 w-5 h-5" />
              <input 
                type="password" name="password" placeholder="Contraseña (mín. 6)" required
                minLength={6}
                maxLength={20}
                value={formData.password} onChange={handleChange}
                className="w-full bg-transparent border border-white/30 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none text-white placeholder:text-white/60 focus:border-white focus:ring-1 focus:ring-white transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-white text-[#1566D0] py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 hover:bg-blue-50 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <><ShieldCheck size={18} /> Registrarse <ArrowRight size={16}/></>}
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