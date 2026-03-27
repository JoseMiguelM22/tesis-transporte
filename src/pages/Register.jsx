import React, { useState } from "react";
import { User, Mail, Lock, CreditCard, Phone, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom"; // Importamos useNavigate para redirigir
import { supabase } from '../lib/supabase'; // Importamos la conexión que creamos

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // 1. Estado para capturar los datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
    email: '',
    password: ''
  });

  // 2. Función para actualizar el estado cuando escribes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 3. Función principal de registro
  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      // Paso A: Crear el usuario en la Autenticación (Caja Fuerte)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // Paso B: Guardar los datos adicionales en la tabla 'perfiles'
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('perfiles')
          .insert([
            {
              id: authData.user.id, // Vinculamos con el ID de la cuenta creada
              nombre: formData.nombre,
              apellido: formData.apellido,
              cedula: formData.cedula,
              telefono: formData.telefono,
              email: formData.email,
              rol: 'estudiante' // Valor por defecto
            }
          ]);

        if (profileError) throw profileError;

        alert("¡Registro exitoso, José! Bienvenido al sistema.");
        navigate("/"); // Redirigir al login después de registrarse
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-500 p-4">
      <div className="w-full max-w-sm backdrop-blur-lg bg-white/20 rounded-3xl shadow-2xl p-6 text-white border border-white/30">
        
        <Link to="/" className="inline-flex items-center text-sm text-white/80 hover:text-white mb-4 transition-all">
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver al Login
        </Link>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold">Registro</h2>
          <p className="text-white/70 text-sm mt-1">Crea tu cuenta de Estudiante</p>
        </div>

        {/* 4. Conectamos el formulario a la función */}
        <form className="space-y-4" onSubmit={handleRegister}>
          
          {/* Nombre */}
          <div className="flex items-center bg-white/20 rounded-xl px-3 py-2 border border-white/10">
            <User className="w-5 h-5 mr-2 opacity-80" />
            <input 
              name="nombre"
              type="text" 
              placeholder="Nombre" 
              className="bg-transparent outline-none w-full text-white placeholder-white/60 text-sm" 
              required
              value={formData.nombre}
              onChange={handleChange}
            />
          </div>

          {/* Apellido */}
          <div className="flex items-center bg-white/20 rounded-xl px-3 py-2 border border-white/10">
            <User className="w-5 h-5 mr-2 opacity-80" />
            <input 
              name="apellido"
              type="text" 
              placeholder="Apellido" 
              className="bg-transparent outline-none w-full text-white placeholder-white/60 text-sm" 
              required
              value={formData.apellido}
              onChange={handleChange}
            />
          </div>

          {/* Cédula */}
          <div className="flex items-center bg-white/20 rounded-xl px-3 py-2 border border-white/10">
            <CreditCard className="w-5 h-5 mr-2 opacity-80" />
            <input
              name="cedula"
              type="text"
              placeholder="Cédula de Identidad"
              className="bg-transparent outline-none w-full text-white placeholder-white/60 text-sm" 
              required 
              value={formData.cedula}
              onChange={handleChange}
            />
          </div>

          {/* Teléfono */}
          <div className="flex items-center bg-white/20 rounded-xl px-3 py-2 border border-white/10">
            <Phone className="w-5 h-5 mr-2 opacity-80" />
            <input 
              name="telefono"
              type="tel" 
              placeholder="Número de Teléfono" 
              className="bg-transparent outline-none w-full text-white placeholder-white/60 text-sm" 
              required
              value={formData.telefono}
              onChange={handleChange}
            />
          </div>

          {/* Correo Electrónico */}
          <div className="flex items-center bg-white/20 rounded-xl px-3 py-2 border border-white/10">
            <Mail className="w-5 h-5 mr-2 opacity-80" />
            <input 
              name="email"
              type="email" 
              placeholder="Correo Electrónico" 
              className="bg-transparent outline-none w-full text-white placeholder-white/60 text-sm" 
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Contraseña */}
          <div className="flex items-center bg-white/20 rounded-xl px-3 py-2 border border-white/10">
            <Lock className="w-5 h-5 mr-2 opacity-80" />
            <input name="password" type={showPassword ? "text" : "password"} placeholder="Contraseña" 
              className="bg-transparent outline-none w-full text-white placeholder-white/60 text-sm" 
              required
              value={formData.password}
              onChange={handleChange}
            />
            <button
              onClick={() => setShowPassword(!showPassword)} 
              type="button" 
              className="ml-2 hover:scale-110 transition-transform"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button 
            type="submit"
            className="w-full bg-white text-blue-600 hover:bg-blue-50 transition-all py-3 rounded-xl font-bold shadow-lg mt-2 active:scale-95"
          >
            CREAR CUENTA
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-white/80">¿Ya tienes cuenta?{" "}
          <Link to="/" className="font-bold text-white hover:underline">Inicia Sesión</Link>
        </p>
      </div>
    </div>
  );
}