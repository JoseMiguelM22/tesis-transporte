import React, { useState, useEffect, useRef } from "react";
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

// 🔥 COMPONENTE DE ANIMACIÓN AL HACER SCROLL (INTERSECTION OBSERVER) 🔥
const FadeInSection = ({ children, delay = 0 }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setVisible(true), delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 } 
    );

    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [delay]);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-[1000ms] ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
    >
      {children}
    </div>
  );
};

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

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#1566D0] text-white overflow-hidden relative flex flex-col">
      
      {/* NAVBAR NAVEGABLE Y RESPONSIVO CON LOGO OFICIAL */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D47A1]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-3 shadow-md transition-all">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="cursor-pointer flex items-center gap-2 sm:gap-3"
          >
            <img 
              src="/UniRoute.png" 
              alt="Logo UniRoute" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-lg" 
            />
            <h2 className="text-lg sm:text-xl font-black italic tracking-tighter uppercase drop-shadow-md">
              UNI<span className="font-light text-blue-200">ROUTE</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-6 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/80">
            <button 
              onClick={() => scrollToSection("caracteristicas")} 
              className="hover:text-white transition-colors p-2"
            >
              <span className="hidden sm:inline">Características</span>
              <span className="sm:hidden">Info</span>
            </button>
            <button 
              onClick={() => scrollToSection("contacto")} 
              className="hover:text-white transition-colors bg-white/10 px-3 py-2 sm:px-4 sm:py-2 rounded-xl border border-white/20 hover:bg-white/20"
            >
              Contacto
            </button>
          </div>
        </div>
      </nav>

      {/* Fondos difuminados abstractos */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 pt-20 sm:pt-16">
        
        {/* SECCIÓN HERO */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12">
          
          <FadeInSection delay={0}>
            <div className="w-56 h-56 md:w-72 md:h-72 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.15)] border-2 border-white/30 mb-8 overflow-hidden mx-auto">
              <img
                src="/UniRoute.png"
                alt="Logo Sistema de Transporte"
                className="w-[85%] h-[85%] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
              />
            </div>
          </FadeInSection>

          <FadeInSection delay={150}>
            <div className="text-center max-w-2xl mb-8">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 uppercase italic text-white drop-shadow-lg">
                RUTA<span className="font-light text-blue-200">UNEFA</span>
              </h1>
              <p className="text-white/90 font-medium text-base md:text-lg leading-relaxed max-w-xl mx-auto drop-shadow-md px-2">
                Plataforma de Control Logístico y Reservas en Tiempo Real para los
                circuitos operativos de Punto Fijo.
              </p>
            </div>
          </FadeInSection>

          {/* 🔥 SELECTOR DE ROLES MÁS AMPLIO, ALTO Y ESPACIADO 🔥 */}
          <FadeInSection delay={300}>
            <div className="w-[95vw] sm:w-full max-w-lg mx-auto bg-[#0D47A1]/80 backdrop-blur-xl p-2 sm:p-3 rounded-[32px] border border-white/20 flex justify-between gap-2 sm:gap-4 mb-8 shadow-2xl">
              
              <button
                onClick={() => setRolSeleccionado("estudiante")}
                className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 px-1 sm:px-3 rounded-[24px] text-[10px] sm:text-xs font-black uppercase tracking-wide sm:tracking-widest transition-all duration-300 ${
                  rolSeleccionado === "estudiante"
                    ? "bg-white text-[#0D47A1] shadow-xl scale-100 sm:scale-105"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
              >
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="whitespace-nowrap">Comunidad</span>
              </button>

              <button
                onClick={() => setRolSeleccionado("chofer")}
                className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 px-1 sm:px-3 rounded-[24px] text-[10px] sm:text-xs font-black uppercase tracking-wide sm:tracking-widest transition-all duration-300 ${
                  rolSeleccionado === "chofer"
                    ? "bg-emerald-500 text-white shadow-xl scale-100 sm:scale-105"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
              >
                <Bus className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="whitespace-nowrap">Chofer</span>
              </button>

              <button
                onClick={() => setRolSeleccionado("chequeador")}
                className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 px-1 sm:px-3 rounded-[24px] text-[10px] sm:text-xs font-black uppercase tracking-wide sm:tracking-widest transition-all duration-300 ${
                  rolSeleccionado === "chequeador"
                    ? "bg-slate-900 text-white shadow-xl scale-100 sm:scale-105"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
              >
                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="whitespace-nowrap">Chequeador</span>
              </button>

            </div>
          </FadeInSection>

          {/* 🔥 BOTONES DE ACCIÓN ADAPTADOS AL NUEVO ANCHO 🔥 */}
          <FadeInSection delay={450}>
            <div className="flex flex-col gap-4 w-[95vw] sm:w-full max-w-lg mx-auto">
              <Link
                to={configRoles[rolSeleccionado].ruta}
                className={`w-full py-5 rounded-[24px] font-black text-sm sm:text-base uppercase tracking-widest text-center shadow-[0_10px_25px_rgba(0,0,0,0.25)] flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${configRoles[rolSeleccionado].colorBoton}`}
              >
                {configRoles[rolSeleccionado].textoBoton}
                <ArrowRight size={20} />
              </Link>

              {rolSeleccionado === "estudiante" && (
                <Link
                  to="/registro-estudiante"
                  className="w-full bg-[#0D47A1]/50 hover:bg-[#0b3a85]/70 border border-white/20 py-4.5 rounded-[24px] font-black text-xs sm:text-sm uppercase tracking-widest text-center transition-all text-white/90 shadow-lg p-4"
                >
                  ¿Eres nuevo? Regístrate aquí
                </Link>
              )}
            </div>
          </FadeInSection>

          <FadeInSection delay={600}>
            <div 
              onClick={() => scrollToSection("caracteristicas")}
              className="mt-16 animate-bounce text-white/80 text-xs font-bold uppercase tracking-widest drop-shadow-lg flex flex-col items-center gap-2 cursor-pointer hover:text-white"
            >
              Desliza para conocer más
              <ArrowRight size={16} className="rotate-90" />
            </div>
          </FadeInSection>
        </section>

        {/* SECCIÓN DE CARACTERÍSTICAS */}
        <section id="caracteristicas" className="px-6 pb-24 pt-12">
          <div className="max-w-6xl mx-auto">
            
            <FadeInSection delay={0}>
              <div className="text-center mb-14">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4 text-white drop-shadow-lg">
                  Todo en un solo sistema
                </h2>
                <p className="text-white/90 max-w-2xl mx-auto text-base font-medium drop-shadow-md">
                  Arquitectura integral diseñada para optimizar los tiempos de
                  despacho y la comodidad en los puntos de control.
                </p>
              </div>
            </FadeInSection>

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
                <FadeInSection key={index} delay={index * 150}>
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 hover:bg-white/15 hover:scale-105 transition-all duration-300 text-left shadow-xl h-full">
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
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER / SECCIÓN DE CONTACTO Y CRÉDITOS */}
      <footer id="contacto" className="bg-[#0A367A]/80 backdrop-blur-xl border-t border-white/10 pt-16 pb-8 px-6 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          <FadeInSection delay={0}>
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-3 drop-shadow-md">
                RUTA<span className="font-light text-blue-300">UNEFA</span>
              </h3>
              <p className="text-sm font-medium text-white/70 max-w-xs leading-relaxed">
                Plataforma de Control Logístico y Reservas. Diseñada para modernizar el transporte universitario en Falcón.
              </p>
            </div>
          </FadeInSection>

          <FadeInSection delay={200}>
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
          </FadeInSection>

          <FadeInSection delay={400}>
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
          </FadeInSection>

        </div>

        <FadeInSection delay={600}>
          <div className="max-w-6xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold text-white/50 uppercase tracking-widest text-center">
            <p>© 2026 Sistema UniRoute. Todos los derechos reservados.</p>
            <p>Comunidad Universitaria e Investigación Tecnológica</p>
          </div>
        </FadeInSection>
      </footer>
    </div>
  );
}