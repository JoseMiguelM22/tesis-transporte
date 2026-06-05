import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Car, Users, Power, RefreshCw, Edit3, CheckCircle2, 
  X, ShieldCheck, Trash2, UserCog, Save, Loader2, 
  Eye, AlertTriangle, Send, ShieldAlert, Search, FileText, Smile, Check, MapPin, Fuel, Menu
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  
  // --- ESTADOS DE CONTROL DE INTERFAZ ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // 🎯 NUEVO: Control del Menú Desplegable
  const [activeTab, setActiveTab] = useState("flota"); 
  const [subTabKyc, setSubTabKyc] = useState("estudiantes"); 
  const [filtroChoferEstatus, setFiltroChoferEstatus] = useState("pendientes"); 
  const [filtroChequeadorEstatus, setFiltroChequeadorEstatus] = useState("pendientes"); 
  const [filtroRutaFlota, setFiltroRutaFlota] = useState("todas"); 
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [modalType, setModalType] = useState(null); 
  const [selectedKycDoc, setSelectedKycDoc] = useState(null); 
  const [dispatchTarget, setDispatchTarget] = useState(null); 
  const [fuelTarget, setFuelTarget] = useState(null); 
  const [nuevoCombustible, setNuevoCombustible] = useState(100);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [searchChofer, setSearchChofer] = useState(""); 
  const [searchChequeador, setSearchChequeador] = useState(""); 

  // --- ESTADOS DE DATA ---
  const [choferes, setChoferes] = useState([]); 
  const [estudiantes, setEstudiantes] = useState([]); 
  const [chequeadores, setChequeadores] = useState([]); 
  const [alertasParadas, setAlertasParadas] = useState([]); 
  const [editData, setEditData] = useState(null);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [chRes, estRes, repRes, cheqRes] = await Promise.all([
        supabase.from("choferes").select("*").order("apellido", { ascending: true }),
        supabase.from("perfiles").select("*").eq("rol", "estudiante").order("apellido", { ascending: true }),
        supabase.from("alertas_paradas").select("id, parada_nombre, creado_at, chequeadores(nombre, apellido, cedula)").eq("estado", "activa").order("creado_at", { ascending: false }),
        supabase.from("chequeadores").select("*").order("apellido", { ascending: true }) 
      ]);
      setChoferes(chRes.data || []);
      setEstudiantes(estRes.data || []);
      setAlertasParadas(repRes.data || []);
      setChequeadores(cheqRes.data || []);
    } catch (e) { console.error("Error de sincronización:", e.message); }
    setLoading(false);
  };

  useEffect(() => { 
    cargarDatos(); 
    const intervalo = setInterval(() => { cargarDatos(); }, 15000);
    return () => clearInterval(intervalo);
  }, []);

  // --- CONTROLADORES ACCIONES LOGÍSTICAS ---
  const handleConfirmarDespacho = async (idChofer) => {
    if (!dispatchTarget) return;
    try {
      const { error: uErr } = await supabase.from("choferes").update({ estado: "en ruta", hora_salida: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }).eq("id", idChofer);
      const { error: rErr } = await supabase.from("alertas_paradas").update({ estado: "atendida" }).eq("id", dispatchTarget.id);
      
      if (uErr || rErr) throw uErr || rErr;
      
      alert("¡Vehículo despachado con éxito para atender la saturación!");
      setDispatchTarget(null);
      await cargarDatos();
    } catch (err) { alert(err.message); }
  };

  const handleAsignarCombustible = async (e) => {
    e.preventDefault();
    if (!fuelTarget) return;
    try {
      const { error } = await supabase.from("choferes").update({ nivel_combustible: nuevoCombustible }).eq("id", fuelTarget.id);
      if (error) throw error;
      alert(`Asignación de combustible actualizada a ${nuevoCombustible}%`);
      setFuelTarget(null);
      await cargarDatos();
    } catch (err) { alert("Error asignando combustible: " + err.message); }
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editData) return;
    try {
      await supabase.from("choferes").update({ 
        nombre: editData.nombre, 
        apellido: editData.apellido, 
        cedula: editData.cedula, 
        telefono: editData.telefono, 
        placa_vehiculo: editData.placa_vehiculo, 
        capacidad_total: parseInt(editData.capacidad_total, 10),
        ruta: editData.ruta 
      }).eq("id", editData.id);
      
      setModalType(null);
      setEditData(null);
      await cargarDatos();
    } catch (err) { alert(err.message); }
  };

  // --- FILTRADOS EN CALIENTE ---
  const estudiantesFiltrados = estudiantes.filter(e => {
    const s = searchTerm.toLowerCase();
    return e.nombre?.toLowerCase().includes(s) || e.apellido?.toLowerCase().includes(s) || e.cedula?.toLowerCase().includes(s);
  });

  const choferesFiltrados = choferes.filter(c => {
    const s = searchChofer.toLowerCase();
    const match = c.nombre?.toLowerCase().includes(s) || c.apellido?.toLowerCase().includes(s) || c.placa_vehiculo?.toLowerCase().includes(s) || c.cedula?.toLowerCase().includes(s);
    return filtroChoferEstatus === "pendientes" ? match && (c.kyc_cedula_url && c.kyc_vehiculo_url && c.kyc_rostro_url) && !c.kyc_verificado : match;
  });

  const chequeadoresFiltrados = chequeadores.filter(c => {
    const s = searchChequeador.toLowerCase();
    const match = c.nombre?.toLowerCase().includes(s) || c.apellido?.toLowerCase().includes(s) || c.cedula?.toLowerCase().includes(s);
    return filtroChequeadorEstatus === "pendientes" ? match && (c.kyc_cedula_url && c.kyc_rostro_url) && !c.kyc_verificado : match;
  });

  const flotaFiltradaPorRuta = choferes.filter(c => {
    if (filtroRutaFlota === "todas") return true;
    return c.ruta === filtroRutaFlota;
  });

  const estudiantesPorValidar = estudiantes.filter(e => !e.kyc_verificado && e.carnet_url).length;
  const pendientesChof = choferes.filter(c => (c.kyc_cedula_url && c.kyc_vehiculo_url && c.kyc_rostro_url) && !c.kyc_verificado).length;
  const pendientesCheq = chequeadores.filter(c => (c.kyc_cedula_url && c.kyc_rostro_url) && !c.kyc_verificado).length; 
  
  const totalNotificacionesKyc = estudiantesPorValidar + pendientesChof + pendientesCheq;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden text-left relative">
      
      {/* 🎯 SIDEBAR DESPLEGABLE */}
      <aside 
        ref={sidebarRef} 
        className={`bg-[#0D47A1] text-white shrink-0 shadow-2xl z-30 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'w-72' : 'w-0'}`}
      >
        <div className="w-72 flex flex-col h-full">
          <div className="p-10 flex items-center gap-3 italic select-none">
            <Car size={32} className="text-blue-400" />
            <h2 className="text-2xl font-black uppercase tracking-tighter">RUTA<span className="font-light text-blue-300">UNEFA</span></h2>
          </div>
          <nav className="flex-1 px-6 space-y-3">
            <button onClick={() => setActiveTab("flota")} className={`flex items-center gap-4 w-full p-4 rounded-2xl font-black italic transition-all ${activeTab === "flota" ? 'bg-white/10 shadow-lg border-l-4 border-blue-400' : 'opacity-60 hover:opacity-100'}`}><LayoutDashboard size={20}/> Monitoreo de Línea</button>
            <button onClick={() => setActiveTab("kyc")} className={`flex items-center justify-between w-full p-4 rounded-2xl font-black italic transition-all ${activeTab === "kyc" ? 'bg-white/10 shadow-lg border-l-4 border-blue-400' : 'opacity-60 hover:opacity-100'}`}>
              <div className="flex items-center gap-4"><Users size={20}/> Auditoría KYC</div>
              {totalNotificacionesKyc > 0 && <span className="bg-orange-500 text-white font-bold text-xs px-2.5 py-1 rounded-full">{totalNotificacionesKyc}</span>}
            </button>
            <button onClick={() => setActiveTab("alertas")} className={`flex items-center justify-between w-full p-4 rounded-2xl font-black italic transition-all ${activeTab === "alertas" ? 'bg-white/10 shadow-lg border-l-4 border-red-400' : 'opacity-60 hover:opacity-100'}`}>
              <div className="flex items-center gap-4"><AlertTriangle size={20} className={alertasParadas.length > 0 ? "text-red-400" : ""} /> Alertas Chequeador</div>
              {alertasParadas.length > 0 && <span className="bg-red-500 text-white font-bold text-xs px-2.5 py-1 rounded-full">{alertasParadas.length}</span>}
            </button>
          </nav>
          <div className="p-10 border-t border-white/5">
            <button onClick={() => { supabase.auth.signOut(); navigate("/acceso-admin"); }} className="flex items-center gap-3 text-white/50 hover:text-white font-bold italic uppercase text-xs transition-all"><Power size={16}/> Cerrar Sesión</button>
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50">
        
        {/* 🎯 HEADER CON BOTÓN MENÚ */}
        <header className="h-24 bg-white border-b px-6 lg:px-12 flex items-center justify-between shrink-0 gap-4">
          <div className="flex items-center gap-4 overflow-hidden">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-3 bg-slate-50 rounded-xl text-[#0D47A1] border hover:bg-slate-100 transition-all shrink-0 active:scale-95"
            >
              <Menu size={20}/>
            </button>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-black italic uppercase tracking-tighter truncate">
              {activeTab === "flota" ? "Tablero Control de Vehículos" : activeTab === "kyc" ? "Centro de Validación Digital (KYC)" : "🚨 Alertas Oficiales Centrales"}
            </h1>
          </div>
          <button onClick={cargarDatos} className="p-3 bg-slate-50 rounded-xl text-[#0D47A1] border hover:bg-slate-100 transition-all shrink-0 active:scale-95">
            {loading ? <Loader2 size={20} className="animate-spin"/> : <RefreshCw size={20}/>}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-12">
          
          {/* VISTA A: MONITOREO FLOTA */}
          {activeTab === "flota" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100 gap-4">
                <div className="flex items-center gap-3 px-4 w-full sm:w-auto">
                  <MapPin size={20} className="text-blue-500 shrink-0" />
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider shrink-0">Filtrar por Ruta:</span>
                  <select 
                    value={filtroRutaFlota} 
                    onChange={(e) => setFiltroRutaFlota(e.target.value)} 
                    className="bg-slate-50 border border-slate-200 text-xs font-bold p-2.5 rounded-xl uppercase text-blue-700 outline-none cursor-pointer w-full sm:w-auto truncate"
                  >
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
                      <th className="px-6 lg:px-10 py-6">Combustible</th>
                      <th className="px-6 lg:px-10 py-6">Estado</th>
                      <th className="px-6 lg:px-10 py-6 text-right">Modificaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {flotaFiltradaPorRuta.map(u => (
                      <React.Fragment key={u.id}>
                        <tr className="group hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 lg:px-10 py-5 font-black italic text-[#0D47A1] text-lg uppercase">{u.placa_vehiculo || "SIN PLACA"}</td>
                          
                          <td className="px-6 lg:px-10 py-5">
                            <span className={`px-3 py-1.5 rounded-lg text-[10px] lg:text-xs font-black uppercase tracking-wider whitespace-nowrap ${u.ruta === 'Maraven - Centro' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                              {u.ruta || "SIN RUTA"}
                            </span>
                          </td>

                          <td className="px-6 lg:px-10 py-5"><button onClick={() => setExpandedRow(expandedRow === u.id ? null : u.id)} className="flex items-center gap-3 font-black italic uppercase text-slate-700 hover:text-[#0D47A1] transition-colors">{u.nombre} {u.apellido}</button></td>
                          
                          <td className="px-6 lg:px-10 py-5">
                            <div className="flex items-center gap-3">
                              <Fuel size={16} className={(u.nivel_combustible ?? 100) <= 20 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}/>
                              <div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${(u.nivel_combustible ?? 100) <= 20 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{width: `${u.nivel_combustible ?? 100}%`}}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-600">{u.nivel_combustible ?? 100}%</span>
                            </div>
                          </td>

                          <td className="px-6 lg:px-10 py-5 font-black text-slate-600 text-xs uppercase">{u.estado || "DISPONIBLE"}</td>
                          <td className="px-6 lg:px-10 py-5 text-right">
                            <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                              <button title="Asignar Combustible" onClick={() => { setFuelTarget(u); setNuevoCombustible(u.nivel_combustible ?? 100); }} className="p-2.5 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all"><Fuel size={18}/></button>
                              <button title="Editar Unidad" onClick={() => { setEditData(u); setModalType("edit"); }} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={18}/></button>
                              <button title="Eliminar Unidad" onClick={() => handleDeleteChofer(u.id)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button>
                            </div>
                          </td>
                        </tr>
                        {expandedRow === u.id && (
                          <tr className="bg-blue-50/30">
                            <td colSpan="6" className="px-6 lg:px-10 py-8 border-t border-blue-100/30">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                <DetailCard icon={<ShieldCheck size={28}/>} label="Cédula Operador" value={`V-${u.cedula}`} color="blue"/>
                                <DetailCard icon={<Users size={28}/>} label="Capacidad" value={`${u.puestos_libres} / ${u.capacidad_total} ASIENTOS`} color="orange"/>
                                <DetailCard icon={<Clock size={28}/>} label="Última Hora Salida" value={u.hora_salida || "SIN RECORRIDO"} color="blue"/>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {flotaFiltradaPorRuta.length === 0 && (
                      <tr><td colSpan="6" className="text-center py-12 text-slate-400 font-bold uppercase text-sm tracking-widest">No hay vehículos registrados en esta ruta.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA B: AUDITORÍA KYC */}
          {activeTab === "kyc" && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-full max-w-2xl shadow-inner">
                  <button onClick={() => { setSubTabKyc("estudiantes"); setSearchTerm(""); }} className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase transition-all ${subTabKyc === "estudiantes" ? "bg-[#0D47A1] text-white shadow-md" : "text-slate-500"}`}>🧑‍🎓 Estudiantes ({estudiantes.length})</button>
                  <button onClick={() => { setSubTabKyc("choferes"); setSearchChofer(""); }} className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase transition-all ${subTabKyc === "choferes" ? "bg-[#0D47A1] text-white shadow-md" : "text-slate-500"}`}>🚍 Conductores ({choferes.length})</button>
                  <button onClick={() => { setSubTabKyc("chequeadores"); setSearchChequeador(""); }} className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase transition-all ${subTabKyc === "chequeadores" ? "bg-[#0D47A1] text-white shadow-md" : "text-slate-500"}`}>📋 Chequeadores ({chequeadores.length})</button>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                  {subTabKyc === "choferes" && <select value={filtroChoferEstatus} onChange={(e) => setFiltroChoferEstatus(e.target.value)} className="bg-white border text-xs font-black p-3 rounded-xl uppercase tracking-wider text-slate-700 shadow-sm outline-none cursor-pointer"><option value="pendientes">Pendientes ({pendientesChof})</option><option value="todos">Historial Completo</option></select>}
                  {subTabKyc === "chequeadores" && <select value={filtroChequeadorEstatus} onChange={(e) => setFiltroChequeadorEstatus(e.target.value)} className="bg-white border text-xs font-black p-3 rounded-xl uppercase tracking-wider text-slate-700 shadow-sm outline-none cursor-pointer"><option value="pendientes">Pendientes ({pendientesCheq})</option><option value="todos">Historial Completo</option></select>}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Buscar..." value={subTabKyc === "estudiantes" ? searchTerm : subTabKyc === "choferes" ? searchChofer : searchChequeador} onChange={(e) => { if (subTabKyc === "estudiantes") setSearchTerm(e.target.value); else if (subTabKyc === "choferes") setSearchChofer(e.target.value); else setSearchChequeador(e.target.value); }} className="w-full bg-white border rounded-xl pl-9 pr-4 py-3 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-blue-400 transition-all" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[30px] lg:rounded-[40px] shadow-xl border border-slate-100 overflow-x-auto w-full">
                <table className="w-full text-left min-w-max">
                  <thead className="bg-slate-50/50"><tr className="text-xs uppercase font-black tracking-[0.1em] text-slate-400"><th className="px-6 lg:px-10 py-6">Nombre Completo</th><th className="px-6 lg:px-10 py-6">Cédula</th><th className="px-6 lg:px-10 py-6">{subTabKyc === "estudiantes" ? "Estatus" : subTabKyc === "choferes" ? "Inspección (3 Fotos)" : "Inspección (2 Fotos)"}</th><th className="px-6 lg:px-10 py-6 text-right">Dictamen</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    
                    {subTabKyc === "estudiantes" && estudiantesFiltrados.map(est => (
                      <tr key={est.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 lg:px-10 py-5 font-black text-slate-700 uppercase">{est.nombre} {est.apellido}</td>
                        <td className="px-6 lg:px-10 py-5 font-bold text-slate-400 tracking-wider">V-{est.cedula}</td>
                        <td className="px-6 lg:px-10 py-5"><span className={`text-[10px] lg:text-xs font-black uppercase px-3 py-1.5 rounded-full ${est.kyc_verificado ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>{est.kyc_verificado ? "✔ Validado" : "⏳ Por Validar"}</span></td>
                        <td className="px-6 lg:px-10 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            {est.carnet_url && <button onClick={() => setSelectedKycDoc({ titulo: `Carnet Estudiante: ${est.nombre}`, url: est.carnet_url })} className="bg-blue-50 text-[#0D47A1] px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-[#0D47A1] hover:text-white transition-all"><Eye size={16}/></button>}
                            {!est.kyc_verificado ? <button onClick={() => handleEstatusKYC("perfiles", est.id, true)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Check size={16}/></button> : <button onClick={() => handleEstatusKYC("perfiles", est.id, false, { carnet_url: null })} className="text-xs font-black uppercase bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all">Revocar</button>}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {subTabKyc === "choferes" && choferesFiltrados.map(chof => (
                      <tr key={chof.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 lg:px-10 py-5 text-slate-800"><p className="font-black uppercase leading-none">{chof.nombre} {chof.apellido}</p><span className="text-[10px] text-[#0D47A1] font-black uppercase block mt-1 tracking-wider">Placa: {chof.placa_vehiculo}</span></td>
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
                            {!chof.kyc_verificado ? <button disabled={!(chof.kyc_cedula_url && chof.kyc_vehiculo_url && chof.kyc_rostro_url)} onClick={() => handleEstatusKYC("choferes", chof.id, true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase shadow-sm disabled:opacity-30 transition-all">Validar</button> : <button onClick={() => handleEstatusKYC("choferes", chof.id, false, { kyc_cedula_url: null, kyc_vehiculo_url: null, kyc_rostro_url: null })} className="text-xs font-black uppercase bg-red-50 text-red-600 px-5 py-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all">Revocar</button>}
                          </div>
                        </td>
                      </tr>
                    ))}

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
                              <button disabled={!(cheq.kyc_cedula_url && cheq.kyc_rostro_url)} onClick={() => handleEstatusKYC("chequeadores", cheq.id, true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase shadow-sm disabled:opacity-30 transition-all">Validar</button>
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
                        <td className="px-6 lg:px-10 py-6 text-sm font-bold text-slate-600">{new Date(alerta.creado_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
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
        </div>
      </main>

      {/* 🎯 MODAL ASIGNAR COMBUSTIBLE */}
      {fuelTarget && (
        <Modal title="Asignación de Combustible" icon={<Fuel size={30} className="text-orange-500"/>} onClose={() => setFuelTarget(null)}>
          <form onSubmit={handleAsignarCombustible} className="space-y-6 text-center">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Unidad: <span className="text-[#0D47A1] font-black">{fuelTarget.placa_vehiculo}</span></p>
            <div className="flex flex-col items-center gap-4">
              <span className="text-6xl font-black italic text-slate-800">{nuevoCombustible}%</span>
              <input 
                type="range" 
                min="0" max="100" step="5"
                value={nuevoCombustible}
                onChange={(e) => setNuevoCombustible(e.target.value)}
                className="w-full max-w-sm h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0D47A1]"
              />
            </div>
            <button type="submit" className="w-full bg-emerald-500 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 tracking-widest text-sm uppercase mt-4 shadow-xl hover:bg-emerald-600 transition-all active:scale-95"><Save size={18}/> Actualizar Nivel</button>
          </form>
        </Modal>
      )}

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
                  <button key={unit.id} onClick={() => handleConfirmarDespacho(unit.id)} className="w-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 p-4 rounded-xl flex items-center justify-between group transition-all text-left active:scale-95" >
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

      {/* 🎯 MODAL EDICIÓN DE FLOTA */}
      {modalType === "edit" && editData && (
        <Modal title="Editar Perfil Vehicular" icon={<UserCog size={30}/>} onClose={() => setModalType(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-5 text-xs font-bold uppercase italic text-left">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><p className="text-[10px] text-blue-500 mb-1 tracking-widest">Nombre</p><input value={editData?.nombre || ""} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800 focus:border-blue-400 transition-colors" onChange={e => setEditData({...editData, nombre: e.target.value})} required/></div>
                <div><p className="text-[10px] text-blue-500 mb-1 tracking-widest">Apellido</p><input value={editData?.apellido || ""} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800 focus:border-blue-400 transition-colors" onChange={e => setEditData({...editData, apellido: e.target.value})} required/></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><p className="text-[10px] text-blue-500 mb-1 tracking-widest">Cédula</p><input value={editData?.cedula || ""} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800 focus:border-blue-400 transition-colors" onChange={e => setEditData({...editData, cedula: e.target.value})} required/></div>
                <div><p className="text-[10px] text-blue-500 mb-1 tracking-widest">Teléfono</p><input value={editData?.telefono || ""} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800 focus:border-blue-400 transition-colors" onChange={e => setEditData({...editData, telefono: e.target.value})} required/></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><p className="text-[10px] text-emerald-500 mb-1 tracking-widest">Placa Carro</p><input value={editData?.placa_vehiculo || ""} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none uppercase text-slate-800 focus:border-emerald-400 transition-colors" onChange={e => setEditData({...editData, placa_vehiculo: e.target.value})} required/></div>
                <div><p className="text-[10px] text-emerald-500 mb-1 tracking-widest">Asientos</p><input type="number" value={editData?.capacidad_total || 4} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800 focus:border-emerald-400 transition-colors" onChange={e => setEditData({...editData, capacidad_total: e.target.value})} required/></div>
                <div>
                  <p className="text-[10px] text-blue-500 mb-1 tracking-widest">Ruta Asignada</p>
                  <select value={editData?.ruta || "Maraven - Centro"} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800 focus:border-blue-400 transition-colors cursor-pointer" onChange={e => setEditData({...editData, ruta: e.target.value})} required>
                    <option value="Maraven - Centro">MARAVEN - CENTRO</option>
                    <option value="Maraven - Punta Cardón">MARAVEN - P. CARDÓN</option>
                  </select>
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#0D47A1] text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 tracking-widest text-sm uppercase mt-6 shadow-xl hover:bg-blue-800 active:scale-95 transition-all"><Save size={20}/> ACTUALIZAR PERFIL</button>
          </form>
        </Modal>
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

// --- COMPONENTES AUXILIARES ---
const DetailCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-6 lg:p-7 rounded-[30px] lg:rounded-[35px] shadow-sm border border-blue-100/50 flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-5 text-left w-full">
    <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${color === 'blue' ? 'bg-blue-50 text-[#0D47A1]' : 'bg-orange-50 text-orange-600'}`}>{icon}</div>
    <div><p className="text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p><p className="text-sm lg:text-base font-black italic text-slate-700 uppercase leading-none">{value}</p></div>
  </div>
);

const Modal = ({ title, icon, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 lg:p-6 overflow-y-auto">
    <div className="bg-white p-8 lg:p-12 rounded-[40px] lg:rounded-[50px] w-full max-w-3xl shadow-2xl animate-in zoom-in duration-300 border border-white/20 my-8">
      <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6 text-[#0D47A1]">
        <div className="flex items-center gap-4">{icon}<h3 className="text-xl lg:text-2xl font-black italic uppercase tracking-tighter">{title}</h3></div>
        <button onClick={onClose} className="p-3 bg-slate-50 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><X size={24}/></button>
      </div>
      {children}
    </div>
  </div>
);