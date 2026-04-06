import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1566D0] flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Contenedor del Logo (Círculo Blanco) */}
      <div className="w-64 h-64 md:w-80 md:h-80 bg-white rounded-full flex items-center justify-center shadow-2xl mb-12 overflow-hidden border-4 border-white/20">
        <img 
          src="/logotrans.jpeg" // Recuerda guardar tu logo en la carpeta 'public' con este nombre
          alt="Logo Sistema de Transporte" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Texto Principal */}
      <div className="text-center max-w-sm mb-12">
        <h1 className="text-white text-3xl md:text-4xl font-black mb-6 leading-tight">
          ¿Eres estudiante y necesitas moverte?
        </h1>
        <p className="text-white/90 text-base md:text-lg leading-relaxed font-medium">
          Consulta en tiempo real qué vehículos están disponibles para tu ruta. 
          Regístrate ahora para verificar cupos, ver horarios de salida y reservar tu puesto de forma rápida y segura.
        </p>
      </div>

      {/* Botones de Acción */}
      <div className="flex gap-4 w-full max-w-xs">
        <Link 
          to="/login" 
          className="flex-1 bg-[#0D47A1] hover:bg-[#0a3981] text-white py-4 rounded-2xl font-bold text-center transition-all active:scale-95 shadow-lg"
        >
          Iniciar sesión
        </Link>
        <Link 
          to="/registro" 
          className="flex-1 bg-[#0D47A1] hover:bg-[#0a3981] text-white py-4 rounded-2xl font-bold text-center transition-all active:scale-95 shadow-lg"
        >
          Registrarse
        </Link>
      </div>
    </div>
  );
}