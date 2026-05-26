import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bus,
  Clock3,
  ShieldCheck,
  MapPinned,
  User,
  UserCheck,
  ShieldAlert,
  ArrowRight
} from "lucide-react";

export default function Home() {
  // 🔥 ESTADO SENSIBLE AL ROL SELECCIONADO
  const [rolSeleccionado, setRolSeleccionado] = useState("estudiante");

  // Diccionario de configuración dinámica por cada rol
  const configRoles = {
    estudiante: {
      ruta: "/acceso-estudiante",
      textoBoton: "Ingresar al sistema",
      colorBoton: "bg-white text-[#1566D0] hover:bg-blue-50",
    },
    chofer: {
      ruta: "/acceso-chofer",
      textoBoton: "Ingresar como Chofer",
      colorBoton: "bg-emerald-500 text-white hover:bg-emerald-600",
    },
    chequeador: {
      ruta: "/acceso-chequeador",
      textoBoton: "Ingresar como Chequeador",
      colorBoton: "bg-slate-800 text-white hover:bg-slate-900",
    },
  };

  return (
    <div className="min-h-screen bg-[#1566D0] text-white overflow-hidden relative">
      
      {/* Fondo decorativo suave */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        
        {/* HERO */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
          
          {/* LOGO */}
          <div className="w-44 h-44 md:w-52 md:h-52 bg-white rounded-full flex items-center justify-center shadow-2xl overflow-hidden border border-white/20 mb-8">
            <img
              src="/logotrans.jpeg"
              alt="Logo Sistema de Transporte"
              className="w-full h-full object-cover"
            />
          </div>

          {/* TEXTO */}
          <div className="text-center max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-4 uppercase italic">
              RUTA<span className="font-light text-blue-200">UNEFA</span>
            </h1>
            <p className="text-white/85 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-8">
              Plataforma de Control Logístico y Reservas en Tiempo Real para los circuitos operativos de Punto Fijo.
            </p>
          </div>

          {/* 🔥 SELECTOR MULTIROL DE ALTO RENDIMIENTO */}
          <div className="w-full max-w-md bg-[#0D47A1]/60 backdrop-blur-md p-2 rounded-3xl border border-white/10 flex gap-1 mb-4 shadow-xl">
            <button 
              onClick={() => setRolSeleccionado("estudiante")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${rolSeleccionado === "estudiante" ? "bg-white text-[#0D47A1] shadow-lg scale-105" : "text-white/60 hover:text-white"}`}
            >
              <User size={16} /> Comunidad
            </button>

            <button 
              onClick={() => setRolSeleccionado("chofer")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${rolSeleccionado === "chofer" ? "bg-emerald-500 text-white shadow-lg scale-105" : "text-white/60 hover:text-white"}`}
            >
              <Bus size={16} /> Chofer
            </button>

            <button 
              onClick={() => setRolSeleccionado("chequeador")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${rolSeleccionado === "chequeador" ? "bg-slate-900 text-white shadow-lg scale-105" : "text-white/60 hover:text-white"}`}
            >
              <UserCheck size={16} /> Chequeador
            </button>

            
          </div>

          {/* BOTÓN DE ACCIÓN ACCESO DINÁMICO */}
          <div className="flex flex-col gap-3 w-full max-w-md">
            <Link
              to={configRoles[rolSeleccionado].ruta}
              className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${configRoles[rolSeleccionado].colorBoton}`}
            >
              {configRoles[rolSeleccionado].textoBoton} <ArrowRight size={16} />
            </Link>

            {/* Solo mostramos el registro rápido si el rol activo es Estudiante */}
            {rolSeleccionado === "estudiante" && (
              <Link
                to="/registro-estudiante"
                className="w-full bg-[#0D47A1]/40 hover:bg-[#0b3a85]/60 border border-white/5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center transition-all text-blue-200"
              >
                ¿Eres nuevo? Regístrate aquí
              </Link>
            )}
          </div>

          {/* INDICADOR */}
          <div className="mt-12 animate-bounce text-white/40 text-xs font-bold uppercase tracking-widest">
            Desliza para conocer más
          </div>
        </section>

        {/* SECCIÓN DE BENEFICIOS */}
        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            
            <div className="text-center mb-14">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">
                Todo en un solo sistema
              </h2>
              <p className="text-white/70 max-w-2xl mx-auto text-sm font-medium">
                Arquitectura integral diseñada para optimizar los tiempos de despacho y la comodidad en los puntos de control de Punto Fijo.
              </p>
            </div>

            {/* CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* CARD */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all text-left">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5 text-blue-300">
                  <Bus className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black italic uppercase tracking-tight mb-2">Vehículos Disponibles</h3>
                <p className="text-white/60 leading-relaxed text-xs font-medium">
                  Consulta las unidades activas y verifica cuáles están disponibles para tu ruta.
                </p>
              </div>

              {/* CARD */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all text-left">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5 text-emerald-400">
                  <Clock3 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black italic uppercase tracking-tight mb-2">Horarios Reales</h3>
                <p className="text-white/60 leading-relaxed text-xs font-medium">
                  Visualiza horarios de salida y disponibilidad actualizada de manera rápida.
                </p>
              </div>

              {/* CARD */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all text-left">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5 text-purple-400">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black italic uppercase tracking-tight mb-2">Reservas Seguras</h3>
                <p className="text-white/60 leading-relaxed text-xs font-medium">
                  Reserva tu puesto de manera segura mediante cifrado y evita desorganización en las colas.
                </p>
              </div>

              {/* CARD */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all text-left">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5 text-red-400">
                  <MapPinned className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black italic uppercase tracking-tight mb-2">Circuitos Maraven</h3>
                <p className="text-white/60 leading-relaxed text-xs font-medium">
                  Accede fácilmente a la información de rutas hacia el Centro y Punta Cardón de forma fluida.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/10 py-6 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] font-bold text-white/50 uppercase tracking-widest">
            <p>Sistema de Transporte Estudiantil - UNEFA Falcón</p>
            <p>Comunidad Universitaria e Investigación Tecnológica</p>
          </div>
        </footer>

      </div>
    </div>
  );
}