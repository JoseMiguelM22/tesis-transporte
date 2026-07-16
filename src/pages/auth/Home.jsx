import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bus,
  Clock3,
  ShieldCheck,
  MapPinned,
  User,
  UserCheck,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Code
} from "lucide-react";

export default function Home() {
  const [rolSeleccionado, setRolSeleccionado] = useState("estudiante");

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
    <div className="min-h-screen bg-[#1566D0] text-white overflow-hidden relative flex flex-col">
      {/* Fondos difuminados */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="relative z-10 flex-1">
        {/* SECCIÓN HERO (Roles y Logo) */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center px-6 py-12">
          <div className="w-56 h-56 md:w-72 md:h-72 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.15)] border-2 border-white/30 mb-8 overflow-hidden">
            <img
              src="/UniRoute.png"
              alt="Logo Sistema de Transporte"
              className="w-[85%] h-[85%] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="text-center max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 uppercase italic text-white drop-shadow-lg">
              RUTA<span className="font-light text-blue-200">UNEFA</span>
            </h1>

            <p className="text-white/90 font-medium text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-8 drop-shadow-md">
              Plataforma de Control Logístico y Reservas en Tiempo Real para los
              circuitos operativos de Punto Fijo.
            </p>
          </div>

          {/* Selector de Roles */}
          <div className="w-full max-w-md bg-[#0D47A1]/80 backdrop-blur-xl p-2 rounded-3xl border border-white/20 flex gap-1 mb-6 shadow-2xl">
            <button
              onClick={() => setRolSeleccionado("estudiante")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                rolSeleccionado === "estudiante"
                  ? "bg-white text-[#0D47A1] shadow-lg scale-105"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <User size={18} />
              Comunidad
            </button>

            <button
              onClick={() => setRolSeleccionado("chofer")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                rolSeleccionado === "chofer"
                  ? "bg-emerald-500 text-white shadow-lg scale-105"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <Bus size={18} />
              Chofer
            </button>

            <button
              onClick={() => setRolSeleccionado("chequeador")}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                rolSeleccionado === "chequeador"
                  ? "bg-slate-900 text-white shadow-lg scale-105"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <UserCheck size={18} />
              Chequeador
            </button>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-col gap-3 w-full max-w-md">
            <Link
              to={configRoles[rolSeleccionado].ruta}
              className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-center shadow-[0_10px_25px_rgba(0,0,0,0.25)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${configRoles[rolSeleccionado].colorBoton}`}
            >
              {configRoles[rolSeleccionado].textoBoton}
              <ArrowRight size={18} />
            </Link>

            {rolSeleccionado === "estudiante" && (
              <Link
                to="/registro-estudiante"
                className="w-full bg-[#0D47A1]/50 hover:bg-[#0b3a85]/70 border border-white/20 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-center transition-all text-white/90 shadow-lg"
              >
                ¿Eres nuevo? Regístrate aquí
              </Link>
            )}
          </div>

          <div className="mt-16 animate-bounce text-white/80 text-xs font-bold uppercase tracking-widest drop-shadow-lg flex flex-col items-center gap-2">
            Desliza para conocer más
            <ArrowRight size={16} className="rotate-90" />
          </div>
        </section>

        {/* SECCIÓN DE CARACTERÍSTICAS */}
        <section className="px-6 pb-24 pt-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4 text-white drop-shadow-lg">
                Todo en un solo sistema
              </h2>
              <p className="text-white/90 max-w-2xl mx-auto text-base font-medium drop-shadow-md">
                Arquitectura integral diseñada para optimizar los tiempos de
                despacho y la comodidad en los puntos de control.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Bus className="w-7 h-7" />,
                  color: "text-blue-300",
                  title: "Vehículos Disponibles",
                  text: "Consulta las unidades activas y verifica cuáles están disponibles para tu ruta.",
                },
                {
                  icon: <Clock3 className="w-7 h-7" />,
                  color: "text-emerald-400",
                  title: "Horarios Reales",
                  text: "Visualiza horarios de salida y disponibilidad actualizada de manera rápida.",
                },
                {
                  icon: <ShieldCheck className="w-7 h-7" />,
                  color: "text-purple-400",
                  title: "Reservas Seguras",
                  text: "Reserva tu puesto de manera segura y evita desorganización en las colas.",
                },
                {
                  icon: <MapPinned className="w-7 h-7" />,
                  color: "text-red-400",
                  title: "Monitoreo GPS",
                  text: "Accede al mapa interactivo para ver por dónde viene tu unidad en tiempo real.",
                },
              ].map((card, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 hover:bg-white/15 hover:scale-105 transition-all duration-300 text-left shadow-xl"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5 ${card.color}`}>
                    {card.icon}
                  </div>
                  <h3 className="text-lg font-black italic uppercase tracking-tight mb-2 text-white drop-shadow-md">
                    {card.title}
                  </h3>
                  <p className="text-white/80 leading-relaxed text-sm font-medium">
                    {card.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER / SECCIÓN DE CONTACTO Y CRÉDITOS */}
      <footer className="bg-[#0A367A]/80 backdrop-blur-xl border-t border-white/10 pt-16 pb-8 px-6 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Columna 1: Marca */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-3 drop-shadow-md">
              RUTA<span className="font-light text-blue-300">UNEFA</span>
            </h3>
            <p className="text-sm font-medium text-white/70 max-w-xs leading-relaxed">
              Plataforma de Control Logístico y Reservas. Diseñada para modernizar el transporte universitario en Falcón.
            </p>
          </div>

          {/* Columna 2: Contacto y Soporte */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-sm font-black tracking-widest uppercase text-blue-300 mb-5 flex items-center gap-2">
              <Phone size={16} /> Contacto & Soporte
            </h4>
            <div className="space-y-4 text-sm font-medium text-white/80">
              <p className="flex items-center gap-3 justify-center md:justify-start hover:text-white transition-colors cursor-pointer">
                <Mail size={18} className="text-white/50"/> soporte@uniroute.com
              </p>
              <p className="flex items-center gap-3 justify-center md:justify-start hover:text-white transition-colors cursor-pointer">
                <Phone size={18} className="text-white/50"/> +58 424-6818250
              </p>
              <p className="flex items-center gap-3 justify-center md:justify-start hover:text-white transition-colors cursor-pointer">
                <MapPin size={18} className="text-white/50"/> UNEFA - Punto Fijo
              </p>
            </div>
          </div>

          {/* Columna 3: Desarrolladores */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-sm font-black tracking-widest uppercase text-emerald-400 mb-5 flex items-center gap-2">
              <Code size={16} /> Ingeniería y Desarrollo
            </h4>
            <div className="space-y-2 text-sm font-black uppercase text-white/90 tracking-wide">
              <p className="bg-white/5 py-2 px-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-default">José Miguel Medina</p>
              <p className="bg-white/5 py-2 px-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-default">Starling Chirino</p>
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-4 font-bold">
              Ingeniería de Sistemas • 2026
            </p>
          </div>

        </div>

        {/* Línea de Copyright */}
        <div className="max-w-6xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold text-white/50 uppercase tracking-widest text-center">
          <p>© 2026 Sistema UniRoute. Todos los derechos reservados.</p>
          <p>Comunidad Universitaria e Investigación Tecnológica</p>
        </div>
      </footer>
    </div>
  );
}