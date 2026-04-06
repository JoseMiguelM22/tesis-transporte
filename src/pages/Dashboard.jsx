import React, { useState, useEffect } from "react";
import { Navigation, LogOut, MapPin, Bell, Car, Menu, X, User, Settings, Info } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { VehicleCard } from "../components/VehicleCard";

export default function Dashboard() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState({ nombre: "Cargando...", apellido: "" }); // Estado para el usuario
  
  const [unidades] = useState([
    { id: 1, nombre: "Unidad 01", puestos: 5, salida: "12:30 PM" },
    { id: 2, nombre: "Unidad 04", puestos: 4, salida: "12:45 PM" },
  ]);

  // --- LÓGICA PARA OBTENER EL USUARIO REAL ---
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Buscamos los detalles en la tabla 'perfiles' que creamos en el registro
        const { data, error } = await supabase
          .from('perfiles')
          .select('nombre, apellido')
          .eq('id', user.id)
          .single();

        if (data) {
          setUserData({ nombre: data.nombre, apellido: data.apellido });
        }
      } else {
        navigate("/login"); // Si no hay sesión, pal' login
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#1566D0] font-sans text-white flex flex-col relative overflow-hidden">
      
      {/* --- PANEL LATERAL (MENÚ) --- */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-[#0D47A1]/95 backdrop-blur-xl z-50 transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out shadow-2xl border-r border-white/10`}>
        <div className="p-8 flex flex-col h-full">
          <button onClick={() => setIsMenuOpen(false)} className="self-end p-2 bg-white/10 rounded-full mb-8">
            <X size={20} />
          </button>

          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 mb-4 shadow-xl">
              <User size={40} className="text-white" />
            </div>
            {/* NOMBRE DINÁMICO AQUÍ */}
            <h3 className="text-xl font-black italic capitalize">{userData.nombre} {userData.apellido}</h3>
            <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">Estudiante Universitario</p>
          </div>

          <nav className="flex-1 space-y-4">
            <button className="flex items-center gap-4 w-full p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all font-bold italic tracking-tight">
              <User size={20} className="text-blue-300" /> Perfil
            </button>
            <button className="flex items-center gap-4 w-full p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all font-bold italic tracking-tight">
              <Info size={20} /> Ayuda
            </button>
          </nav>

          <button onClick={handleLogout} className="flex items-center gap-4 w-full p-4 bg-red-500/20 rounded-2xl hover:bg-red-500/40 transition-all font-black text-red-300 italic mt-auto">
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"></div>}

      {/* --- HEADER --- */}
      <header className="bg-[#0D47A1] pt-12 pb-8 px-8 rounded-b-[45px] shadow-2xl flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMenuOpen(true)} className="bg-white/10 p-2.5 rounded-xl border border-white/10 hover:bg-white/20 transition-all">
            <Menu size={22} />
          </button>
          <div className="space-y-0.5">
            {/* SALUDO DINÁMICO AQUÍ */}
            <h1 className="text-3xl font-black italic tracking-tighter capitalize">¡Hola, {userData.nombre}!</h1>
            <p className="text-blue-300 text-[9px] font-bold uppercase tracking-[0.2em] opacity-80">Ruta: Punto Fijo - Maraven</p>
          </div>
        </div>

        <button className="bg-white/5 p-2.5 rounded-xl border border-white/10 relative">
          <Bell size={18}/>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#0D47A1]"></span>
        </button>
      </header>

      {/* --- CONTENIDO PRINCIPAL (MAPA Y LISTA IGUALES) --- */}
      <main className="flex-1 px-6 pt-6 pb-32 overflow-y-auto no-scrollbar">
        <div className="flex justify-center mb-6">
           <div className="bg-[#2979FF] py-2 px-6 rounded-full shadow-lg border border-white/10 flex items-center gap-2">
             <Navigation size={14} className="animate-pulse text-white" />
             <h2 className="font-black text-[10px] uppercase tracking-widest text-white">Vehículos Disponibles</h2>
           </div>
        </div>

        {/* Mapa (Mismo código anterior) */}
        <div className="relative w-full h-56 bg-[#0a1d3d] rounded-[35px] border-4 border-white/10 shadow-inner overflow-hidden mb-8">
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
           <svg className="absolute inset-0 w-full h-full opacity-40"><path d="M 50 160 Q 150 80 250 160 T 420 100" fill="transparent" stroke="white" strokeWidth="3" strokeDasharray="8 4" className="animate-dash" /></svg>
           <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
              <MapPin size={35} className="text-white drop-shadow-lg" />
              <span className="text-[9px] font-black uppercase mt-1 bg-blue-600 px-3 py-0.5 rounded-full text-white">Maraven</span>
           </div>
        </div>

        <div className="space-y-3">
          {unidades.map(u => (
            <VehicleCard key={u.id} nombre={u.nombre} puestos={u.puestos} horaSalida={u.salida} />
          ))}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1566D0] via-[#1566D0]/90 to-transparent pt-10">
        <button className="w-full bg-[#0D47A1] hover:bg-[#0a3981] text-white py-5 rounded-[28px] font-black text-xl shadow-2xl transition-all active:scale-95 uppercase tracking-[0.1em] italic">
          Reservar Ahora
        </button>
      </div>
    </div>
  );
}