import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { 
  Car, MapPin, Clock, Users, Power, Navigation, 
  MinusCircle, PlusCircle, CheckCircle, AlertCircle 
} from "lucide-react";

export default function DriverDashboard() {
  const [unidad, setUnidad] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- LÓGICA DE CARGA ---
  // Aquí suponemos que el chofer ya inició sesión y buscamos la unidad que tiene su ID
  const fetchUnidadAsignada = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // 1. Buscamos el ID del chofer en la tabla 'choferes' usando su user_id de Auth
      const { data: chofer } = await supabase
        .from('choferes')
        .select('id, nombre')
        .eq('user_id', user.id)
        .single();

      if (chofer) {
        // 2. Buscamos la unidad que tiene vinculado este chofer
        const { data: unit } = await supabase
          .from('unidades')
          .select('*')
          .eq('chofer_id', chofer.id)
          .single();
        
        setUnidad(unit);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchUnidadAsignada(); }, []);

  // --- FUNCIONES DE CONTROL ---
  const updatePuestos = async (nuevoValor) => {
    if (nuevoValor < 0 || nuevoValor > unidad.capacidad_total) return;
    const { error } = await supabase.from('unidades').update({ puestos_libres: nuevoValor }).eq('id', unidad.id);
    if (!error) setUnidad({ ...unidad, puestos_libres: nuevoValor });
  };

  const toggleRuta = async () => {
    const nuevoEstado = unidad.estado === 'disponible' ? 'en ruta' : 'disponible';
    const nuevaHora = nuevoEstado === 'en ruta' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
    
    const { error } = await supabase.from('unidades')
      .update({ estado: nuevoEstado, hora_salida: nuevaHora })
      .eq('id', unidad.id);
      
    if (!error) setUnidad({ ...unidad, estado: nuevoEstado, hora_salida: nuevaHora });
  };

  if (loading) return <div className="min-h-screen bg-[#0D47A1] flex items-center justify-center text-white font-black italic">CARGANDO SISTEMA...</div>;

  if (!unidad) return (
    <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
      <AlertCircle size={64} className="text-slate-300 mb-4" />
      <h2 className="text-2xl font-black italic text-slate-800 uppercase">Sin Unidad Asignada</h2>
      <p className="text-slate-500 font-bold mt-2">Contacta con el administrador para vincular tu cuenta a un vehículo.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col">
      
      {/* HEADER DE ESTADO */}
      <header className={`p-8 pb-12 transition-colors duration-500 ${unidad.estado === 'en ruta' ? 'bg-orange-500' : 'bg-[#0D47A1]'} text-white rounded-b-[50px] shadow-2xl relative overflow-hidden`}>
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Panel del Operador</p>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">UNIDAD {unidad.numero_unidad}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-3 h-3 rounded-full animate-ping ${unidad.estado === 'en ruta' ? 'bg-white' : 'bg-green-400'}`}></span>
            <p className="font-bold italic uppercase text-sm tracking-widest">{unidad.estado}</p>
          </div>
        </div>
        <Car size={150} className="absolute -right-10 -bottom-10 text-white/10 rotate-12" />
      </header>

      {/* CONTROLES PRINCIPALES */}
      <main className="flex-1 px-6 -mt-8 z-20 space-y-6">
        
        {/* CARD DE PUESTOS (EL CORAZÓN DEL PANEL) */}
        <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 flex flex-col items-center">
          <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-6">Gestión de Pasajeros</p>
          
          <div className="flex items-center gap-8 mb-6">
            <button onClick={() => updatePuestos(unidad.puestos_libres - 1)} className="text-slate-200 hover:text-red-500 transition-colors">
              <MinusCircle size={60} strokeWidth={1.5} />
            </button>
            
            <div className="text-center">
              <span className="text-7xl font-black italic text-[#0D47A1]">{unidad.puestos_libres}</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Puestos Libres</p>
            </div>

            <button onClick={() => updatePuestos(unidad.puestos_libres + 1)} className="text-slate-200 hover:text-green-500 transition-colors">
              <PlusCircle size={60} strokeWidth={1.5} />
            </button>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
             <div 
               className="h-full bg-[#0D47A1] transition-all duration-500" 
               style={{ width: `${(unidad.puestos_libres / unidad.capacidad_total) * 100}%` }}
             ></div>
          </div>
        </div>

        {/* INFO DE RUTA */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm">
            <Clock size={20} className="text-[#0D47A1] mb-2" />
            <p className="text-[10px] font-black uppercase text-slate-400 italic">Salida</p>
            <p className="font-black text-lg text-slate-800">{unidad.hora_salida || '--:--'}</p>
          </div>
          <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm">
            <Users size={20} className="text-[#0D47A1] mb-2" />
            <p className="text-[10px] font-black uppercase text-slate-400 italic">Capacidad</p>
            <p className="font-black text-lg text-slate-800">{unidad.capacidad_total} Pers.</p>
          </div>
        </div>

        {/* BOTÓN DE ACCIÓN GRANDE */}
        <button 
          onClick={toggleRuta}
          className={`w-full py-6 rounded-[30px] font-black text-xl italic uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
            unidad.estado === 'disponible' 
            ? 'bg-[#0D47A1] text-white' 
            : 'bg-white border-4 border-orange-500 text-orange-500'
          }`}
        >
          {unidad.estado === 'disponible' ? <Navigation size={24} /> : <CheckCircle size={24} />}
          {unidad.estado === 'disponible' ? "Iniciar Ruta" : "Finalizar Ruta"}
        </button>

      </main>

      {/* FOOTER DE NAVEGACIÓN */}
      <footer className="p-8 mt-auto flex justify-center items-center gap-10 text-slate-400">
          <button className="flex flex-col items-center gap-1">
            <Car size={24} className="text-[#0D47A1]" />
            <span className="text-[9px] font-black uppercase tracking-tighter">Mi Unidad</span>
          </button>
          <button className="flex flex-col items-center gap-1 opacity-40">
            <Power size={24} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Salir</span>
          </button>
      </footer>
    </div>
  );
}