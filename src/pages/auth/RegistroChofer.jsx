import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { 
  User, ShieldCheck, CreditCard, Phone, Car, 
  Lock, Loader2, ArrowRight, CheckCircle2, Mail, LogIn, Users
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
    capacidad: "4", // 🎯 Defecto en 4 puestos
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
              // 🎯 CORRECCIÓN CLAVE: Nace en FALSE para forzar la triple verificación interna
              kyc_verificado: false, 
              capacidad_total: capacidadNum,  // El valor que eligió (4 o 5)
              puestos_libres: capacidadNum,   // Inicia completamente libre
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

  // --- VISTA DE ÉXITO (MODIFICADA PARA OBLIGAR AL ENTORNO KYC) ---
  if (success) {
    return (
      <div className="min-h-screen bg-[#1566D0] flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="bg-[#0D47A1] p-10 rounded-[45px] w-full max-w-md shadow-2xl border border-white/10 text-center space-y-6 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck size={42} className="text-white" />
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">¡Perfil Creado!</h2>
          <p className="text-sm text-blue-200 font-medium leading-relaxed">
            Tu cuenta ha sido registrada correctamente. Al ingresar al sistema, deberás **completar tu auditoría digital (KYC)** subiendo las fotos de tus documentos para habilitar los controles de ruta.
          </p>
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-amber-400 font-bold uppercase tracking-widest">
            ⏳ Estatus: Pendiente por Documentación
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={() => navigate("/acceso-chofer")} 
              className="w-full bg-emerald-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 hover:bg-emerald-600"
            >
              <LogIn size={16} /> Iniciar Sesión para Verificar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1566D0] flex flex-col items-center justify-center p-6 text-white font-sans relative overflow-hidden text-left">
      
      {/* Fondo decorativo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-[#0D47A1]/80 backdrop-blur-md p-10 rounded-[45px] shadow-2xl border border-white/10 relative z-10">
        
        {/* ENCABEZADO */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest mb-1">
            <Car size={14} /> Flota Institucional
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Registro de Chofer</h2>
          <p className="text-blue-200 text-xs mt-1 font-medium">Completa tus datos operativos para el circuito.</p>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleRegistro} className="space-y-4 text-slate-800">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <User className="absolute left-4 top-4 text-slate-400 w-4 h-4" />
              <input 
                type="text" name="nombre" placeholder="NOMBRE" required
                maxLength={15}
                value={formData.nombre} onChange={handleChange}
                className="w-full bg-white rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold outline-none text-slate-800"
              />
            </div>
            <div className="relative">
              <User className="absolute left-4 top-4 text-slate-400 w-4 h-4" />
              <input 
                type="text" name="apellido" placeholder="APELLIDO" required
                maxLength={15}
                value={formData.apellido} onChange={handleChange}
                className="w-full bg-white rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold outline-none text-slate-800"
              />
            </div>
          </div>

          <div className="relative">
            <CreditCard className="absolute left-4 top-4 text-slate-400 w-4 h-4" />
            <input 
              type="text" name="cedula" placeholder="CÉDULA DE IDENTIDAD" required
              maxLength={10}
              value={formData.cedula} onChange={handleChange}
              className="w-full bg-white rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold outline-none text-slate-800"
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-4 text-slate-400 w-4 h-4" />
            <input 
              type="tel" name="telefono" placeholder="TELÉFONO DE CONTACTO" required
              maxLength={15}
              value={formData.telefono} onChange={handleChange}
              className="w-full bg-white rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold outline-none text-slate-800"
            />
          </div>

          {/* PLACA Y PUESTOS EN LA MISMA FILA */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Car className="absolute left-4 top-4 text-slate-400 w-4 h-4" />
              <input 
                type="text" name="placa" placeholder="PLACA" required
                maxLength={8}
                value={formData.placa} onChange={handleChange}
                className="w-full bg-white rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold outline-none text-slate-800 uppercase tracking-widest"
              />
            </div>
            
            {/* SELECCIÓN DE PUESTOS OPERATIVOS (4 O 5) */}
            <div className="relative">
              <Users className="absolute left-4 top-4 text-slate-400 w-4 h-4" />
              <select
                name="capacidad"
                value={formData.capacidad}
                onChange={handleChange}
                className="w-full bg-white rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold outline-none text-slate-800 appearance-none cursor-pointer"
              >
                <option value="4">4 PUESTOS</option>
                <option value="5">5 PUESTOS</option>
              </select>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-4 text-slate-400 w-4 h-4" />
              <input 
                type="email" name="email" placeholder="CORREO ELECTRÓNICO" required
                maxLength={30}
                value={formData.email} onChange={handleChange}
                className="w-full bg-white rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold outline-none text-slate-800"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-4 text-slate-400 w-4 h-4" />
              <input 
                type="password" name="password" placeholder="CONTRASEÑA (6 A 20 CARACTERES)" required
                minLength={6}
                maxLength={20}
                value={formData.password} onChange={handleChange}
                className="w-full bg-white rounded-xl pl-11 pr-4 py-3.5 text-xs font-bold outline-none text-slate-800 focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-emerald-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <><ShieldCheck size={16} /> REGISTRARSE <ArrowRight size={14}/></>}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-blue-200 font-bold uppercase tracking-wider">
          ¿Ya posees una cuenta?{" "}
          <Link to="/acceso-chofer" className="text-white border-b border-white hover:text-blue-100">
            Ingresar
          </Link>
        </div>

      </div>
    </div>
  );
}