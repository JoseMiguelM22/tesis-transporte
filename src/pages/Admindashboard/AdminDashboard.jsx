import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Car, Users, Power, RefreshCw, CheckCircle2, 
  X, ShieldCheck, Trash2, Loader2, ListOrdered, UserCog,
  Eye, AlertTriangle, Send, ShieldAlert, Search, FileText, Smile, Check, MapPin, Menu, Wrench, Clock
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  
  // --- ESTADOS DE CONTROL DE INTERFAZ ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("flota"); 
  const [subTabKyc, setSubTabKyc] = useState("usuarios"); 
  const [filtroChoferEstatus, setFiltroChoferEstatus] = useState("pendientes"); 
  const [filtroChequeadorEstatus, setFiltroChequeadorEstatus] = useState("pendientes"); 
  const [filtroRutaFlota, setFiltroRutaFlota] = useState("todas"); 
  const [loading, setLoading] = useState(true);
  const [selectedKycDoc, setSelectedKycDoc] = useState(null); 
  const [dispatchTarget, setDispatchTarget] = useState(null); 
  const [searchTerm, setSearchTerm] = useState(""); 
  const [searchChofer, setSearchChofer] = useState(""); 
  const [searchChequeador, setSearchChequeador] = useState(""); 

  // --- ESTADOS DE DATA ---
  const [choferes, setChoferes] = useState([]); 
  const [usuarios, setUsuarios] = useState([]); 
  const [chequeadores, setChequeadores] = useState([]); 
  const [alertasParadas, setAlertasParadas] = useState([]); 
  const [reportesChoferes, setReportesChoferes] = useState([]); 
  const [historialGlobal, setHistorialGlobal] = useState([]); 

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [chRes, usuRes, repRes, cheqRes, opRes, histRes] = await Promise.all([
        supabase.from("choferes").select("*").order("apellido", { ascending: true }),
        supabase.from("perfiles").select("*").order("apellido", { ascending: true }),
        supabase.from("alertas_paradas").select("id, parada_nombre, creado_at, chequeadores(nombre, apellido, cedula)").eq("estado", "activa").order("creado_at", { ascending: false }),
        supabase.from("chequeadores").select("*").order("apellido", { ascending: true }),
        supabase.from("reportes_operativos").select("*").order("created_at", { ascending: false }),
        supabase.from("historial_recorridos").select("*") 
      ]);
      
      setChoferes(chRes.data || []);
      setUsuarios(usuRes.data || []);
      setAlertasParadas(repRes.data || []);
      setChequeadores(cheqRes.data || []);
      setReportesChoferes(opRes.data || []);

      let dataHistorial = histRes.data || [];
      dataHistorial.sort((a, b) => {
        const fechaA = new Date(a.fecha || 0).getTime();
        const fechaB = new Date(b.fecha || 0).getTime();
        return fechaB - fechaA; 
      });
      setHistorialGlobal(dataHistorial);

    } catch (e) { console.error("Error de sincronización:", e.message); }
    setLoading(false);
  };

  useEffect(() => { 
    cargarDatos(); 
    const intervalo = setInterval(() => { cargarDatos(); }, 15000);

    const channelReportes = supabase
      .channel('admin-sync-reportes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reportes_operativos' }, 
        (payload) => setReportesChoferes(prev => [payload.new, ...prev])
      ).subscribe();
      
    const channelHistorial = supabase
      .channel('admin-sync-historial')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'historial_recorridos' }, 
        (payload) => setHistorialGlobal(prev => [payload.new, ...prev])
      ).subscribe();

    return () => {
      clearInterval(intervalo);
      supabase.removeChannel(channelReportes);
      supabase.removeChannel(channelHistorial);
    };
  }, []);

  // --- CONTROLADORES ACCIONES LOGÍSTICAS ---
  const handleConfirmarDespacho = async (unit) => {
    if (!dispatchTarget) return;
    try {
      const mensajeAlerta = `Atención, su vehículo ha sido asignado para el apoyo de la ruta ${unit.ruta}, por saturación de parada en ${dispatchTarget.parada_nombre}.`;

      const { error: uErr } = await supabase.from("choferes").update({ alerta_admin: mensajeAlerta }).eq("id", unit.id);
      const { error: rErr } = await supabase.from("alertas_paradas").update({ estado: "atendida" }).eq("id", dispatchTarget.id);
      
      if (uErr || rErr) throw uErr || rErr;
      
      alert("¡Alerta de despacho enviada a la pantalla del operador!");
      setDispatchTarget(null);
      await cargarDatos();
    } catch (err) { alert(err.message); }
  };

  const handleEstatusKYC = async (tabla, id, verificado, camposReset = {}) => {
    try {
      const { error } = await supabase.from(tabla).update({ kyc_verificado: verificado, ...camposReset }).eq("id", id);
      if (error) throw error;
      alert("Dictamen de validación KYC guardado.");
      await cargarDatos();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteChofer = async (id) => {
    if (window.confirm("¿Eliminar operador permanentemente de la bitácora?")) {
      await supabase.from("choferes").delete().eq("id", id);
      await cargarDatos();
    }
  };

  const handleMarcarReporteResuelto = async (id) => {
    try {
      await supabase.from('reportes_operativos').delete().eq('id', id);
      setReportesChoferes(prev => prev.filter(r => r.id !== id));
      alert("Reporte marcado como solucionado y archivado.");
    } catch (error) {
      alert("Error gestionando el reporte: " + error.message);
    }
  };

  // --- FILTRADOS EN CALIENTE ---
  const usuariosFiltrados = usuarios.filter(e => {
    const s = searchTerm.toLowerCase();
    // 🔥 Ahora el administrador puede filtrar directamente por Rol (ej. "Docente")
    return e.nombre?.toLowerCase().includes(s) || e.apellido?.toLowerCase().includes(s) || e.cedula?.toLowerCase().includes(s) || e.rol?.toLowerCase().includes(s);
  });

  const choferesFiltrados = choferes.filter(c => {
    const s = searchChofer.toLowerCase();
    const match = c.nombre?.toLowerCase().includes(s) || c.apellido?.toLowerCase().includes(s) || c.placa_vehiculo?.toLowerCase().includes(s) || c.cedula?.toLowerCase().includes(s);
    return filtroChoferEstatus === "pendientes" ? match && !c.kyc_verificado && (c.kyc_cedula_url || c.kyc_vehiculo_url || c.kyc_rostro_url) : match;
  });

  const chequeadoresFiltrados = chequeadores.filter(c => {
    const s = searchChequeador.toLowerCase();
    const match = c.nombre?.toLowerCase().includes(s) || c.apellido?.toLowerCase().includes(s) || c.cedula?.toLowerCase().includes(s);
    return filtroChequeadorEstatus === "pendientes" ? match && !c.kyc_verificado && (c.kyc_cedula_url || c.kyc_rostro_url) : match;
  });

  const flotaFiltradaPorRuta = choferes.filter(c => {
    if (filtroRutaFlota === "todas") return true;
    return c.ruta === filtroRutaFlota;
  });

  const usuariosPorValidar = usuarios.filter(e => !e.kyc_verificado && e.carnet_url).length;
  const pendientesChof = choferes.filter(c => !c.kyc_verificado && (c.kyc_cedula_url || c.kyc_vehiculo_url || c.kyc_rostro_url)).length;
  const pendientesCheq = chequeadores.filter(c => !c.kyc_verificado && (c.kyc_cedula_url || c.kyc_rostro_url)).length; 
  const totalNotificacionesKyc = usuariosPorValidar + pendientesChof + pendientesCheq;

  const safeTime = (dateStr) => {
    if (!dateStr) return "--:--";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "--:--" : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#E8EEF5] flex font-sans text-slate-900 overflow-hidden text-left relative">
      
      {/* 🎯 SIDEBAR DESPLEGABLE FLOTANTE */}
      <div className={`transition-all duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'w-72 ml-4 my-4 mr-2' : 'w-0 m-0'}`}>
        <aside className={`flex-1 bg-[#0D47A1] text-white shadow-2xl rounded-[30px] overflow-hidden flex flex-col transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="p-8 flex justify-center items-center select-none border-b border-white/5">
            { <img src="/UniRoute.png" alt="UniRoute Logo" className="h-16 w-auto object-contain" />}
            <div className="flex items-center gap-3 italic">
              <h2 className="text-2xl font-black uppercase tracking-tighter">RUTA<span className="font-light text-blue-300">UNEFA</span></h2>
            </div>
          </div>
          
          <nav className="flex-1 px-6 space-y-3 mt-6">
            <button onClick={() => setActiveTab("flota")} className={`flex items-center gap-4 w-full p-4 rounded-2xl font-black italic transition-all ${activeTab === "flota" ? 'bg-white/10 shadow-lg border-l-4 border-blue-400' : 'opacity-60 hover:opacity-100'}`}><LayoutDashboard size={20}/> Monitoreo de Línea</button>
            <button onClick={() => setActiveTab("kyc")} className={`flex items-center justify-between w-full p-4 rounded-2xl font-black italic transition-all ${activeTab === "kyc" ? 'bg-white/10 shadow-lg border-l-4 border-blue-400' : 'opacity-60 hover:opacity-100'}`}>
              <div className="flex items-center gap-4"><Users size={20}/> Auditoría KYC</div>
              {totalNotificacionesKyc > 0 && <span className="bg-orange-500 text-white font-bold text-xs px-2.5 py-1 rounded-full">{totalNotificacionesKyc}</span>}
            </button>
            <button onClick={() => setActiveTab("alertas")} className={`flex items-center justify-between w-full p-4 rounded-2xl font-black italic transition-all ${activeTab === "alertas" ? 'bg-white/10 shadow-lg border-l-4 border-red-400' : 'opacity-60 hover:opacity-100'}`}>
              <div className="flex items-center gap-4"><AlertTriangle size={20} className={alertasParadas.length > 0 ? "text-red-400" : ""} /> Alertas Chequeador</div>
              {alertasParadas.length > 0 && <span className="bg-red-500 text-white font-bold text-xs px-2.5 py-1 rounded-full animate-pulse">{alertasParadas.length}</span>}
            </button>
            <button onClick={() => setActiveTab("reportes")} className={`flex items-center justify-between w-full p-4 rounded-2xl font-black italic transition-all ${activeTab === "reportes" ? 'bg-white/10 shadow-lg border-l-4 border-orange-400' : 'opacity-60 hover:opacity-100'}`}>
              <div className="flex items-center gap-4"><Wrench size={20} className={reportesChoferes.length > 0 ? "text-orange-400" : ""} /> Reportes Operativos</div>
              {reportesChoferes.length > 0 && <span className="bg-orange-500 text-white font-bold text-xs px-2.5 py-1 rounded-full">{reportesChoferes.length}</span>}
            </button>
            <button onClick={() => setActiveTab("historial")} className={`flex items-center justify-between w-full p-4 rounded-2xl font-black italic transition-all ${activeTab === "historial" ? 'bg-white/10 shadow-lg border-l-4 border-emerald-400' : 'opacity-60 hover:opacity-100'}`}>
              <div className="flex items-center gap-4"><ListOrdered size={20} /> Bitácora de Viajes</div>
            </button>
          </nav>
          
          <div className="p-10 border-t border-white/5">
            <button onClick={() => { supabase.auth.signOut(); navigate("/acceso-admin"); }} className="flex items-center gap-3 text-white/50 hover:text-white font-bold italic uppercase text-xs transition-all"><Power size={16}/> Cerrar Sesión</button>
          </div>
        </aside>
      </div>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-24 bg-transparent px-6 lg:px-10 flex items-center justify-between shrink-0 gap-4 mt-2">
          <div className="flex items-center gap-4 overflow-hidden">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-white rounded-xl text-[#0D47A1] shadow-sm hover:shadow-md transition-all shrink-0 active:scale-95"><Menu size={20}/></button>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-black italic uppercase tracking-tighter truncate text-[#0D47A1]">
              {activeTab === "flota" ? "Tablero Control de Vehículos" : activeTab === "kyc" ? "Centro de Validación Digital (KYC)" : activeTab === "alertas" ? "🚨 Alertas de Paradas" : activeTab === "reportes" ? "🔧 Reportes de Conductores" : "📊 Bitácora Global de Viajes"}
            </h1>
          </div>
          <button onClick={cargarDatos} className="p-3 bg-white rounded-xl text-[#0D47A1] shadow-sm hover:shadow-md transition-all shrink-0 active:scale-95">
            {loading ? <Loader2 size={20} className="animate-spin"/> : <RefreshCw size={20}/>}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10">
          
          {/* VISTA A: MONITOREO FLOTA */}
          {activeTab === "flota" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-[24px] shadow-sm border border-slate-100 gap-4">
                <div className="flex items-center gap-3 px-4 w-full sm:w-auto">
                  <MapPin size={20} className="text-[#0D47A1] shrink-0" />
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider shrink-0">Filtrar por Ruta:</span>
                  <select value={filtroRutaFlota} onChange={(e) => setFiltroRutaFlota(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-bold p-2.5 rounded-xl uppercase text-[#0D47A1] outline-none cursor-pointer w-full sm:w-auto truncate">
                    <option value="todas">TODAS LAS RUTAS ({choferes.length})</option>
                    <option value="Maraven - Centro">MARAVEN - CENTRO</option>
                    <option value="Maraven - Punta Cardón">MARAVEN - PUNTA CARDÓN</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-[30px] lg:rounded-[40px] shadow-xl border border-slate-100 overflow-x-auto w-full">
                <table className="w-full text-left min-w-max">
                  <thead className="bg-slate-50/50">
                    <tr className="text-xs uppercase font-black tracking-[0.1em] text-slate-400">
                      <th className="px-6 lg:px-10 py-6">Vehículo</th>
                      <th className="px-6 lg:px-10 py-6">Ruta Asignada</th>
                      <th className="px-6 lg:px-10 py-6">Operador Encargado</th>
                      <th className="px-6 lg:px-10 py-6">Estado en Tiempo Real</th>
                      <th className="px-6 lg:px-10 py-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {flotaFiltradaPorRuta.map(u => {
                      const reporteActivo = reportesChoferes.find(r => r.placa_vehiculo === u.placa_vehiculo);
                      let textoEstado = u.estado?.toUpperCase() || "DISPONIBLE";
                      let colorBadge = "bg-slate-100 text-slate-600 border-slate-200";

                      if (reporteActivo) {
                        if (reporteActivo.tipo_reporte.includes("Gasolina") || reporteActivo.tipo_reporte.includes("Falla")) textoEstado = `FUERA DE SERVICIO (${reporteActivo.tipo_reporte.toUpperCase()})`;
                        else textoEstado = `INCIDENCIA (${reporteActivo.tipo_reporte.toUpperCase()})`;
                        colorBadge = "bg-red-100 text-red-700 border-red-300 animate-pulse";
                      } else if (textoEstado === "EN RUTA") colorBadge = "bg-orange-100 text-orange-700 border-orange-200";
                      else colorBadge = "bg-emerald-100 text-emerald-700 border-emerald-200";

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 lg:px-10 py-5 font-black italic text-[#0D47A1] text-lg uppercase">{u.placa_vehiculo || "SIN PLACA"}</td>
                          <td className="px-6 lg:px-10 py-5"><span className={`px-3 py-1.5 rounded-lg text-[10px] lg:text-xs font-black uppercase tracking-wider whitespace-nowrap ${u.ruta === 'Maraven - Centro' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>{u.ruta || "SIN RUTA"}</span></td>
                          <td className="px-6 lg:px-10 py-5 font-black italic uppercase text-slate-700">{u.nombre} {u.apellido}</td>
                          <td className="px-6 lg:px-10 py-5"><span className={`px-3 py-1.5 rounded-lg text-[10px] lg:text-xs font-black uppercase tracking-wider whitespace-nowrap border inline-flex items-center gap-2 ${colorBadge}`}>{reporteActivo && <AlertTriangle size={14} />} {textoEstado}</span></td>
                          <td className="px-6 lg:px-10 py-5 text-right"><div className="flex justify-end gap-2"><button title="Eliminar Unidad" onClick={() => handleDeleteChofer(u.id)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button></div></td>
                        </tr>
                      );
                    })}
                    {flotaFiltradaPorRuta.length === 0 && <tr><td colSpan="5" className="text-center py-12 text-slate-400 font-bold uppercase text-sm tracking-widest">No hay vehículos registrados.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA B: AUDITORÍA KYC */}
          {activeTab === "kyc" && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex bg-white p-2 rounded-[20px] w-full max-w-2xl shadow-sm border border-slate-100">
                  <button onClick={() => { setSubTabKyc("usuarios"); setSearchTerm(""); }} className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase transition-all ${subTabKyc === "usuarios" ? "bg-[#0D47A1] text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>👥 Usuarios ({usuarios.length})</button>
                  <button onClick={() => { setSubTabKyc("choferes"); setSearchChofer(""); }} className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase transition-all ${subTabKyc === "choferes" ? "bg-[#0D47A1] text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>🚍 Conductores ({choferes.length})</button>
                  <button onClick={() => { setSubTabKyc("chequeadores"); setSearchChequeador(""); }} className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase transition-all ${subTabKyc === "chequeadores" ? "bg-[#0D47A1] text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>📋 Chequeadores ({chequeadores.length})</button>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                  {subTabKyc === "choferes" && <select value={filtroChoferEstatus} onChange={(e) => setFiltroChoferEstatus(e.target.value)} className="bg-white border text-xs font-black p-3 rounded-xl uppercase tracking-wider text-[#0D47A1] shadow-sm outline-none cursor-pointer"><option value="pendientes">Pendientes ({pendientesChof})</option><option value="todos">Historial Completo</option></select>}
                  {subTabKyc === "chequeadores" && <select value={filtroChequeadorEstatus} onChange={(e) => setFiltroChequeadorEstatus(e.target.value)} className="bg-white border text-xs font-black p-3 rounded-xl uppercase tracking-wider text-[#0D47A1] shadow-sm outline-none cursor-pointer"><option value="pendientes">Pendientes ({pendientesCheq})</option><option value="todos">Historial Completo</option></select>}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 w-4 h-4 text-[#0D47A1]" />
                    <input type="text" placeholder="Buscar usuario o rol..." value={subTabKyc === "usuarios" ? searchTerm : subTabKyc === "choferes" ? searchChofer : searchChequeador} onChange={(e) => { if (subTabKyc === "usuarios") setSearchTerm(e.target.value); else if (subTabKyc === "choferes") setSearchChofer(e.target.value); else setSearchChequeador(e.target.value); }} className="w-full bg-white border rounded-xl pl-9 pr-4 py-3 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-[#0D47A1] transition-all" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[30px] lg:rounded-[40px] shadow-xl border border-slate-100 overflow-x-auto w-full">
                <table className="w-full text-left min-w-max">
                  <thead className="bg-slate-50/50"><tr className="text-xs uppercase font-black tracking-[0.1em] text-slate-400"><th className="px-6 lg:px-10 py-6">Nombre Completo y Rol</th><th className="px-6 lg:px-10 py-6">Cédula</th><th className="px-6 lg:px-10 py-6">{subTabKyc === "usuarios" ? "Estatus" : subTabKyc === "choferes" ? "Inspección (3 Fotos)" : "Inspección (2 Fotos)"}</th><th className="px-6 lg:px-10 py-6 text-right">Dictamen</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    
                    {/* Renderizado de Usuarios Generales (CON SU ROL) */}
                    {subTabKyc === "usuarios" && usuariosFiltrados.map(usu => (
                      <tr key={usu.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 lg:px-10 py-5 text-slate-700">
                          <p className="font-black uppercase leading-none">{usu.nombre} {usu.apellido}</p>
                          {/* 🔥 AQUÍ APARECE EL ROL DE LA PERSONA DE FORMA ELEGANTE 🔥 */}
                          <span className="text-[10px] text-[#0D47A1] font-black uppercase block mt-1 tracking-wider">
                            {usu.rol || 'Estudiante'}
                          </span>
                        </td>
                        <td className="px-6 lg:px-10 py-5 font-bold text-slate-400 tracking-wider">V-{usu.cedula}</td>
                        <td className="px-6 lg:px-10 py-5"><span className={`text-[10px] lg:text-xs font-black uppercase px-3 py-1.5 rounded-full ${usu.kyc_verificado ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>{usu.kyc_verificado ? "✔ Validado" : "⏳ Por Validar"}</span></td>
                        <td className="px-6 lg:px-10 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            {usu.carnet_url && <button onClick={() => setSelectedKycDoc({ titulo: `Documento Usuario: ${usu.nombre}`, url: usu.carnet_url })} className="bg-blue-50 text-[#0D47A1] px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-[#0D47A1] hover:text-white transition-all"><Eye size={16}/></button>}
                            {!usu.kyc_verificado ? <button onClick={() => handleEstatusKYC("perfiles", usu.id, true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase shadow-sm transition-all">Validar</button> : <button onClick={() => handleEstatusKYC("perfiles", usu.id, false, { carnet_url: null })} className="text-xs font-black uppercase bg-red-50 text-red-600 px-5 py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all">Revocar</button>}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Renderizado Choferes */}
                    {subTabKyc === "choferes" && choferesFiltrados.map(chof => (
                      <tr key={chof.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 lg:px-10 py-5 text-slate-800"><p className="font-black uppercase leading-none">{chof.nombre} {chof.apellido}</p><span className="text-[10px] text-orange-600 font-black uppercase block mt-1 tracking-wider">Placa: {chof.placa_vehiculo}</span></td>
                        <td className="px-6 lg:px-10 py-5 font-bold text-slate-500 tracking-wider">V-{chof.cedula}</td>
                        <td className="px-6 lg:px-10 py-5">
                          <div className="flex gap-2">
                            <button disabled={!chof.kyc_cedula_url} onClick={() => setSelectedKycDoc({ titulo: `Cédula: ${chof.nombre}`, url: chof.kyc_cedula_url })} className={`p-2 rounded-xl text-xs font-black uppercase border transition-colors ${chof.kyc_cedula_url ? 'bg-blue-50 text-[#0D47A1] border-blue-100 hover:bg-[#0D47A1] hover:text-white' : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'}`}><FileText size={16} /></button>
                            <button disabled={!chof.kyc_vehiculo_url} onClick={() => setSelectedKycDoc({ titulo: `Vehículo Placa [${chof.placa_vehiculo}]`, url: chof.kyc_vehiculo_url })} className={`p-2 rounded-xl text-xs font-black uppercase border transition-colors ${chof.kyc_vehiculo_url ? 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-600 hover:text-white' : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'}`}><Car size={16} /></button>
                            <button disabled={!chof.kyc_rostro_url} onClick={() => setSelectedKycDoc({ titulo: `Rostro Conductor: ${chof.nombre}`, url: chof.kyc_rostro_url })} className={`p-2 rounded-xl text-xs font-black uppercase border transition-colors ${chof.kyc_rostro_url ? 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-600 hover:text-white' : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'}`}><Smile size={16} /></button>
                          </div>
                        </td>
                        <td className="px-6 lg:px-10 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            {!chof.kyc_verificado ? <button disabled={!(chof.kyc_cedula_url || chof.kyc_vehiculo_url || chof.kyc_rostro_url)} onClick={() => handleEstatusKYC("choferes", chof.id, true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase shadow-sm disabled:opacity-30 transition-all">Validar</button> : <button onClick={() => handleEstatusKYC("choferes", chof.id, false, { kyc_cedula_url: null, kyc_vehiculo_url: null, kyc_rostro_url: null })} className="text-xs font-black uppercase bg-red-50 text-red-600 px-5 py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all">Revocar</button>}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Renderizado Chequeadores */}
                    {subTabKyc === "chequeadores" && chequeadoresFiltrados.map(cheq => (
                      <tr key={cheq.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 lg:px-10 py-5 text-slate-800"><p className="font-black uppercase leading-none">{cheq.nombre} {cheq.apellido}</p></td>
                        <td className="px-6 lg:px-10 py-5 font-bold text-slate-500 tracking-wider">V-{cheq.cedula}</td>
                        <td className="px-6 lg:px-10 py-5">
                          <div className="flex gap-2">
                            <button disabled={!cheq.kyc_cedula_url} onClick={() => setSelectedKycDoc({ titulo: `Cédula: ${cheq.nombre}`, url: cheq.kyc_cedula_url })} className={`p-2 rounded-xl text-xs font-black uppercase border transition-colors ${cheq.kyc_cedula_url ? 'bg-blue-50 text-[#0D47A1] border-blue-100 hover:bg-[#0D47A1] hover:text-white' : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'}`}><FileText size={16} /></button>
                            <button disabled={!cheq.kyc_rostro_url} onClick={() => setSelectedKycDoc({ titulo: `Rostro Chequeador: ${cheq.nombre}`, url: cheq.kyc_rostro_url })} className={`p-2 rounded-xl text-xs font-black uppercase border transition-colors ${cheq.kyc_rostro_url ? 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-600 hover:text-white' : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'}`}><Smile size={16} /></button>
                          </div>
                        </td>
                        <td className="px-6 lg:px-10 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            {!cheq.kyc_verificado ? (
                              <button disabled={!(cheq.kyc_cedula_url || cheq.kyc_rostro_url)} onClick={() => handleEstatusKYC("chequeadores", cheq.id, true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase shadow-sm disabled:opacity-30 transition-all">Validar</button>
                            ) : (
                              <button onClick={() => handleEstatusKYC("chequeadores", cheq.id, false, { kyc_cedula_url: null, kyc_rostro_url: null })} className="text-xs font-black uppercase bg-red-50 text-red-600 px-5 py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all">Revocar</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA C: ALERTAS RECIBIDAS DESDE CHEQUEADORES */}
          {activeTab === "alertas" && (
            <div className="bg-white rounded-[30px] lg:rounded-[40px] shadow-xl border border-slate-100 overflow-x-auto w-full">
              <table className="w-full text-left min-w-max">
                <thead className="bg-red-50/40">
                  <tr className="text-xs uppercase font-black tracking-[0.1em] text-red-500">
                    <th className="px-6 lg:px-10 py-6">📍 Ubicación / Parada</th>
                    <th className="px-6 lg:px-10 py-6">Alerta Emitida Por</th>
                    <th className="px-6 lg:px-10 py-6">Hora de Emisión</th>
                    <th className="px-6 lg:px-10 py-6 text-right">Acción Operativa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {alertasParadas.length > 0 ? (
                    alertasParadas.map(alerta => (
                      <tr key={alerta.id} className="bg-amber-50/20 hover:bg-amber-50/50 transition-colors">
                        <td className="px-6 lg:px-10 py-6"><span className="bg-red-100 text-red-700 font-black px-4 py-2.5 rounded-xl text-sm uppercase tracking-wide inline-block shadow-sm border border-red-200">{alerta.parada_nombre}</span></td>
                        <td className="px-6 lg:px-10 py-6 font-black text-slate-700 uppercase text-xs leading-tight">Chequeador: {alerta.chequeadores?.nombre} {alerta.chequeadores?.apellido} <span className="text-slate-400 block text-[10px] mt-1 tracking-widest">V-{alerta.chequeadores?.cedula}</span></td>
                        <td className="px-6 lg:px-10 py-6 text-sm font-bold text-slate-600">{safeTime(alerta.creado_at)}</td>
                        <td className="px-6 lg:px-10 py-6 text-right"><button onClick={() => setDispatchTarget(alerta)} className="inline-flex items-center gap-2 bg-[#0D47A1] text-white px-6 py-3.5 rounded-xl text-xs font-black uppercase hover:bg-blue-800 transition-all shadow-md active:scale-95"><Car size={16} /> Despachar Unidad</button></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="px-6 lg:px-10 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm"><CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400 opacity-50"/>Todas las paradas fluyen con normalidad 👍</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VISTA D: REPORTES OPERATIVOS */}
          {activeTab === "reportes" && (
            <div className="bg-white rounded-[30px] lg:rounded-[40px] shadow-xl border border-slate-100 overflow-x-auto w-full">
              <table className="w-full text-left min-w-max">
                <thead className="bg-orange-50/40">
                  <tr className="text-xs uppercase font-black tracking-[0.1em] text-orange-600">
                    <th className="px-6 lg:px-10 py-6">Tipo de Incidencia</th>
                    <th className="px-6 lg:px-10 py-6">Operador Responsable</th>
                    <th className="px-6 lg:px-10 py-6">Detalles del Reporte</th>
                    <th className="px-6 lg:px-10 py-6 text-right">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportesChoferes.length > 0 ? (
                    reportesChoferes.map(reporte => (
                      <tr key={reporte.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 lg:px-10 py-6">
                          <span className="bg-orange-100 text-orange-700 font-black px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-wide inline-block shadow-sm border border-orange-200">
                            {reporte.tipo_reporte}
                          </span>
                        </td>
                        <td className="px-6 lg:px-10 py-6 font-black text-slate-700 uppercase text-xs leading-tight">
                          <div className="flex flex-col gap-1">
                            <span>{reporte.emisor || "Chofer Activo"}</span>
                            <span className="text-[#0D47A1] text-[10px] tracking-widest">PLACA: {reporte.placa_vehiculo}</span>
                          </div>
                        </td>
                        <td className="px-6 lg:px-10 py-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 italic">"{reporte.mensaje}"</span>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1"><Clock size={12}/> {safeTime(reporte.created_at || reporte.creado_at)}</span>
                          </div>
                        </td>
                        <td className="px-6 lg:px-10 py-6 text-right">
                          <button onClick={() => handleMarcarReporteResuelto(reporte.id)} className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95">
                            <CheckCircle2 size={16} /> Marcar como Resuelto
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="px-6 lg:px-10 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm"><CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400 opacity-50"/>La flota opera sin incidentes logísticos 👍</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 🔥 VISTA E: HISTORIAL GLOBAL DE RECORRIDOS 🔥 */}
          {activeTab === "historial" && (
            <div className="bg-white rounded-[30px] lg:rounded-[40px] shadow-xl border border-slate-100 overflow-x-auto w-full">
              <div className="p-6 lg:px-10 lg:pt-8 bg-slate-50/50 border-b border-slate-100">
                <h3 className="text-lg font-black uppercase text-[#0D47A1] tracking-tighter">Bitácora Global de Viajes Finalizados</h3>
                <p className="text-xs font-bold text-slate-400 mt-1">Control histórico de todos los trayectos completados por los operadores.</p>
              </div>
              <table className="w-full text-left min-w-max">
                <thead className="bg-slate-50/50">
                  <tr className="text-xs uppercase font-black tracking-[0.1em] text-slate-400">
                    <th className="px-6 lg:px-10 py-6">Fecha del Trayecto</th>
                    <th className="px-6 lg:px-10 py-6">Ruta Completada</th>
                    <th className="px-6 lg:px-10 py-6">Vehículo y Operador</th>
                    <th className="px-6 lg:px-10 py-6">Horarios (Salida / Llegada)</th>
                    <th className="px-6 lg:px-10 py-6 text-right">Pasajeros Llevados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {historialGlobal.length > 0 ? (
                    historialGlobal.map((viaje, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 lg:px-10 py-6">
                          <span className="bg-slate-100 text-slate-600 font-black px-3 py-1.5 rounded-lg text-xs uppercase shadow-sm border border-slate-200">
                            {new Date(viaje.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-6 lg:px-10 py-6 font-black text-slate-700 uppercase text-xs leading-tight">
                          {viaje.ruta}
                        </td>
                        <td className="px-6 lg:px-10 py-6 font-black text-slate-700 uppercase text-xs leading-tight">
                          <div className="flex flex-col gap-1">
                            <span className="text-[#0D47A1] text-xs">PLACA: {viaje.placa}</span>
                            <span className="text-slate-400 text-[10px] tracking-widest">{viaje.chofer_nombre}</span>
                          </div>
                        </td>
                        <td className="px-6 lg:px-10 py-6">
                          <div className="flex flex-col gap-1 text-xs font-bold text-slate-500">
                            <span className="text-orange-500 flex items-center gap-1"><Clock size={12}/> Salida: {viaje.hora_salida || '--:--'}</span>
                            <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12}/> Llegada: {viaje.hora_llegada || '--:--'}</span>
                          </div>
                        </td>
                        <td className="px-6 lg:px-10 py-6 text-right">
                          <span className="bg-emerald-100 text-emerald-700 font-black px-4 py-2 rounded-xl text-lg uppercase tracking-wide inline-block shadow-sm border border-emerald-200">
                            {viaje.pasajeros_transportados} P.
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="px-6 lg:px-10 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm"><CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400 opacity-50"/>Aún no se ha registrado el fin de ningún trayecto.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>

      {/* MODAL INTERACTIVO: ASIGNA VEHÍCULOS DISPONIBLES AL REPORTE */}
      {dispatchTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[140] flex items-center justify-center p-6">
          <div className="bg-white p-8 lg:p-12 rounded-[40px] lg:rounded-[50px] w-full max-w-md shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4 text-red-600">
              <div className="flex items-center gap-3"><AlertTriangle size={26} className="animate-pulse" /><h3 className="text-lg lg:text-xl font-black italic uppercase tracking-tighter">Despachar Refuerzo</h3></div>
              <button onClick={() => setDispatchTarget(null)} className="p-2 bg-slate-50 rounded-full hover:bg-red-50 text-slate-400 transition-colors"><X size={20}/></button>
            </div>
            <div className="mb-6 space-y-2 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-sm font-bold text-slate-700">📍 Emergencia en Parada: <span className="text-red-600 font-black uppercase block mt-1">{dispatchTarget.parada_nombre}</span></p></div>
            <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Unidades Disponibles:</p>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              {choferes.filter(u => u.estado === 'disponible' && u.kyc_verificado).length > 0 ? (
                choferes.filter(u => u.estado === 'disponible' && u.kyc_verificado).map(unit => (
                  <button key={unit.id} onClick={() => handleConfirmarDespacho(unit)} className="w-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 p-4 rounded-xl flex items-center justify-between group transition-all text-left active:scale-95" >
                    <div className="flex flex-col"><span className="text-sm font-black text-[#0D47A1] uppercase tracking-wide">PLACA: {unit.placa_vehiculo}</span><span className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">Chofer: {unit.nombre} {unit.apellido}</span></div>
                    <div className="bg-blue-50 group-hover:bg-[#0D47A1] group-hover:text-white text-[#0D47A1] p-3 rounded-xl transition-colors"><Send size={16} /></div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50"><ShieldAlert size={32} className="mx-auto text-orange-400 mb-3 opacity-50"/><p className="text-xs font-black uppercase text-slate-500 tracking-wide">Toda la flota está en ruta.<br/>No hay unidades disponibles.</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL MULTI-DOCS */}
      {selectedKycDoc && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[150] flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <button onClick={() => setSelectedKycDoc(null)} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full hover:bg-white/20 text-white shadow-xl z-50 transition-colors"><X size={28} /></button>
          <div className="w-full max-w-3xl text-center space-y-4">
            <h3 className="text-sm lg:text-base font-black uppercase tracking-widest text-blue-400 italic">{selectedKycDoc.titulo}</h3>
            <div className="w-full max-h-[80vh] flex items-center justify-center rounded-[40px] overflow-hidden bg-slate-800 shadow-2xl p-4 lg:p-8 border border-white/10"><img src={selectedKycDoc.url} alt="Evidencia KYC" className="max-w-full max-h-[70vh] object-contain rounded-2xl" /></div>
          </div>
        </div>
      )}

    </div>
  );
}