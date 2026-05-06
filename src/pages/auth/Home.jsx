import React from "react";
import { Link } from "react-router-dom";
import {
  Bus,
  Clock3,
  ShieldCheck,
  MapPinned,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1566D0] text-white overflow-hidden">
      
      {/* Fondo decorativo suave */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        
        {/* HERO */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
          
          {/* LOGO */}
          <div className="w-56 h-56 md:w-72 md:h-72 bg-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden border border-white/20 mb-10">
            <img
              src="/logotrans.jpeg"
              alt="Logo Sistema de Transporte"
              className="w-full h-full object-cover"
            />
          </div>

          {/* TEXTO */}
          <div className="text-center max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-6">
              Transporte estudiantil
              <span className="block text-blue-100">
                rápido, seguro y organizado
              </span>
            </h1>

            <p className="text-white/85 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
              Consulta vehículos disponibles, verifica horarios de salida,
              revisa cupos en tiempo real y gestiona tus reservas desde una
              plataforma sencilla y moderna.
            </p>
          </div>

          {/* BOTONES */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-10">
            <Link
              to="/acceso-estudiante"
              className="flex-1 bg-white text-[#1566D0] hover:bg-blue-50 py-4 rounded-2xl font-bold text-center transition-all active:scale-[0.98] shadow-xl"
            >
              Iniciar sesión
            </Link>

            <Link
              to="/registro-estudiante"
              className="flex-1 bg-[#0D47A1] hover:bg-[#0b3a85] border border-white/10 py-4 rounded-2xl font-bold text-center transition-all active:scale-[0.98] shadow-xl"
            >
              Registrarse
            </Link>
          </div>

          {/* INDICADOR */}
          <div className="mt-16 animate-bounce text-white/50 text-sm">
            Desliza para conocer más
          </div>
        </section>

        {/* SECCIÓN DE BENEFICIOS */}
        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold mb-4">
                Todo en un solo sistema
              </h2>

              <p className="text-white/70 max-w-2xl mx-auto">
                Diseñado para mejorar la experiencia del estudiante al momento
                de utilizar el transporte universitario.
              </p>
            </div>

            {/* CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* CARD */}
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
                  <Bus className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-bold mb-3">
                  Vehículos disponibles
                </h3>

                <p className="text-white/70 leading-relaxed text-sm">
                  Consulta las unidades activas y verifica cuáles están
                  disponibles para tu ruta.
                </p>
              </div>

              {/* CARD */}
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
                  <Clock3 className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-bold mb-3">
                  Horarios en tiempo real
                </h3>

                <p className="text-white/70 leading-relaxed text-sm">
                  Visualiza horarios de salida y disponibilidad actualizada de
                  manera rápida.
                </p>
              </div>

              {/* CARD */}
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
                  <ShieldCheck className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-bold mb-3">
                  Reservas seguras
                </h3>

                <p className="text-white/70 leading-relaxed text-sm">
                  Reserva tu puesto de manera segura y evita largas esperas o
                  desorganización.
                </p>
              </div>

              {/* CARD */}
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/15 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
                  <MapPinned className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-bold mb-3">
                  Gestión de rutas
                </h3>

                <p className="text-white/70 leading-relaxed text-sm">
                  Accede fácilmente a la información de rutas y puntos de salida
                  establecidos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/10 py-6 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-white/60">
            
            <p>
              Sistema de Transporte Estudiantil
            </p>

            <p>
              Plataforma desarrollada para la comunidad universitaria
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}