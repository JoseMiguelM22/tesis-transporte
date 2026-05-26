import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Car, Users, Power, Plus, RefreshCw, Edit3, CheckCircle2, 
  X, ShieldCheck, ChevronDown, ChevronUp, Trash2, UserCog, Save, Loader2, 
  Eye, XCircle, AlertTriangle, Send, ShieldAlert, History, Search, FileText, Smile, Check
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  
  // --- ESTADOS DE CONTROL DE INTERFAZ ---
  const [activeTab, setActiveTab] = useState("flota"); 
  const [subTabKyc, setSubTabKyc] = useState("estudiantes"); // "estudiantes", "choferes", "chequeadores"
  const [filtroChoferEstatus, setFiltroChoferEstatus] = useState("pendientes"); 
  const [filtroChequeadorEstatus, setFiltroChequeadorEstatus] = useState("pendientes"); 
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [modalType, setModalType] = useState(null); // "edit" o "register"
  const [selectedKycDoc, setSelectedKycDoc] = useState(null); 
  const [dispatchTarget, setDispatchTarget] = useState(null); 
  const [searchTerm, setSearchTerm] = useState(""); 
  const [searchChofer, setSearchChofer] = useState(""); 
  const [searchChequeador, setSearchChequeador] = useState(""); 

  // --- ESTADOS DE DATA (BITÁCORAS HISTÓRICAS COMPLETAS) ---
  const [choferes, setChoferes] = useState([]); 
  const [estudiantes, setEstudiantes] = useState([]); 
  const [chequeadores, setChequeadores] = useState([]); // 🎯 NUEVO ESTADO PARA CHEQUEADORES
  const [reportesParada, setReportesParada] = useState([]); 
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({ numero_unit: "", placa: "", capacidad: 4, nom_chof: "", apellido_chof: "", ced_chof: "", tel_chof: "", mail_chof: "", pass_chof: "" });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [chRes, estRes, repRes, cheqRes] = await Promise.all([
        supabase.from("choferes").select("*").order("apellido", { ascending: true }),
        supabase.from("perfiles").select("*").eq("rol", "estudiante").order("apellido", { ascending: true }),
        supabase.from("reportes_parada").select("id, parada_nombre, creado_at, perfiles(nombre, apellido, cedula)").eq("activo", true).order("creado_at", { ascending: false }),
        supabase.from("chequeadores").select("*").order("apellido", { ascending: true }) // 🎯 CARGA DE CHEQUEADORES
      ]);
      setChoferes(chRes.data || []);
      setEstudiantes(estRes.data || []);
      setReportesParada(repRes.data || []);
      setChequeadores(cheqRes.data || []);
    } catch (e) { console.error("Error de sincronización:", e.message); }
    setLoading(false);
  };

  useEffect(() => { 
    cargarDatos(); 
    const intervalo = setInterval(() => { cargarDatos(); }, 15000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    const manejarClicsExteriores = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target) && !e.target.closest("button")) {}
    };
    document.addEventListener("mousedown", manejarClicsExteriores);
    return () => document.removeEventListener("mousedown", manejarClicsExteriores);
  }, []);

  // --- CONTROLADORES ACCIONES LOGÍSTICAS ---
  const handleConfirmarDespacho = async (idChofer) => {
    if (!dispatchTarget) return;
    try {
      const { error: uErr } = await supabase.from("choferes").update({ estado: "en ruta", hora_salida: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }).eq("id", idChofer);
      const { error: rErr } = await supabase.from("reportes_parada").update({ activo: false }).eq("id", dispatchTarget.id);
      if (uErr || rErr) throw uErr || rErr;
      setDispatchTarget(null);
      await cargarDatos();
    } catch (err) { alert(err.message); }
  };

  const handleEstatusKYC = async (tabla, id, verificado, camposReset = {}) => {
    try {
      const { error } = await supabase.from(tabla).update({ kyc_verificado: verificado, ...camposReset }).eq("id", id);
      if (error) throw error;
      alert("Dictamen de validación KYC guardado en el histórico.");
      await cargarDatos();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteChofer = async (id) => {
    if (window.confirm("¿Eliminar operador permanentemente de la bitácora?")) {
      await supabase.from("choferes").delete().eq("id", id);
      await cargarDatos();
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === "edit") {
        await supabase.from("choferes").update({ nombre: editData.nombre, apellido: editData.apellido, cedula: editData.cedula, telefono: editData.telefono, placa_vehiculo: editData.placa_vehiculo, capacidad_total: parseInt(editData.capacidad_total, 10) }).eq("id", editData.id);
      } else {
        const { data: aData, error: aErr } = await supabase.auth.signUp({ email: formData.mail_chof, password: formData.pass_chof });
        if (aErr) throw aErr;
        await supabase.from("choferes").insert([{ id: aData.user.id, nombre: formData.nom_chof, apellido: formData.apellido_chof, cedula: formData.ced_chof, telefono: formData.tel_chof, email: formData.mail_chof, placa_vehiculo: formData.placa, capacidad_total: parseInt(formData.capacidad, 10), puestos_libres: parseInt(formData.capacidad, 10), estado: 'disponible', kyc_verificado: false }]);
      }
      setModalType(null);
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

  // 🎯 FILTRO PARA CHEQUEADORES
  const chequeadoresFiltrados = chequeadores.filter(c => {
    const s = searchChequeador.toLowerCase();
    const match = c.nombre?.toLowerCase().includes(s) || c.apellido?.toLowerCase().includes(s) || c.cedula?.toLowerCase().includes(s);
    return filtroChequeadorEstatus === "pendientes" ? match && (c.kyc_cedula_url && c.kyc_rostro_url) && !c.kyc_verificado : match;
  });

  const estudiantesPorValidar = estudiantes.filter(e => !e.kyc_verificado && e.carnet_url).length;
  const pendientesChof = choferes.filter(c => (c.kyc_cedula_url && c.kyc_vehiculo_url && c.kyc_rostro_url) && !c.kyc_verificado).length;
  const pendientesCheq = chequeadores.filter(c => (c.kyc_cedula_url && c.kyc_rostro_url) && !c.kyc_verificado).length; // 🎯 CONTADOR CHEQUEADORES PENDIENTES
  
  const totalNotificacionesKyc = estudiantesPorValidar + pendientesChof + pendientesCheq;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden text-left">
      {/* SIDEBAR */}
      <aside ref={sidebarRef} className="w-72 bg-[#0D47A1] text-white flex flex-col shrink-0 shadow-2xl z-30">
        <div className="p-10 flex items-center gap-3 italic select-none">
          <Car size={32} className="text-blue-400" />
          <h2 className="text-2xl font-black uppercase tracking-tighter">RUTA<span className="font-light text-blue-300">UNEFA</span></h2>
        </div>
        <nav className="flex-1 px-6 space-y-3">
          <button onClick={() => setActiveTab("flota")} className={`flex items-center gap-4 w-full p-4 rounded-2xl font-black italic transition-all ${activeTab === "flota" ? 'bg-white/10 shadow-lg border-l-4 border-blue-400' : 'opacity-60 hover:opacity-100'}`}><LayoutDashboard size={20}/> Monitoreo de Línea</button>
          <button onClick={() => setActiveTab("kyc")} className={`flex items-center justify-between w-full p-4 rounded-2xl font-black italic transition-all ${activeTab === "kyc" ? 'bg-white/10 shadow-lg border-l-4 border-blue-400' : 'opacity-60 hover:opacity-100'}`}>
            <div className="flex items-center gap-4"><Users size={20}/> Auditoría KYC</div>
            {totalNotificacionesKyc > 0 && <span className="bg-orange-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-full">{totalNotificacionesKyc}</span>}
          </button>
          <button onClick={() => setActiveTab("alertas")} className={`flex items-center justify-between w-full p-4 rounded-2xl font-black italic transition-all ${activeTab === "alertas" ? 'bg-white/10 shadow-lg border-l-4 border-red-400' : 'opacity-60 hover:opacity-100'}`}>
            <div className="flex items-center gap-4"><AlertTriangle size={20} className={reportesParada.length > 0 ? "text-red-400" : ""} /> Paradas Llenas</div>
            {reportesParada.length > 0 && <span className="bg-red-500 text-white font-bold text-[10px] px-2.5 py-1 rounded-full">{reportesParada.length}</span>}
          </button>
          <div className="pt-4 border-t border-white/10">
            <button onClick={() => setModalType("register")} className="flex items-center gap-4 w-full p-4 bg-emerald-500/20 text-emerald-300 rounded-2xl font-black italic border border-emerald-500/20 hover:bg-emerald-500/30 transition-all"><Plus size={20}/> DAR DE ALTA VEHÍCULO</button>
          </div>
        </nav>
        <div className="p-10 border-t border-white/5"><button onClick={() => { supabase.auth.signOut(); navigate("/acceso-admin"); }} className="flex items-center gap-3 text-white/50 hover:text-white font-bold italic uppercase text-xs transition-all"><Power size={16}/> Cerrar Sesión</button></div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 shrink-0 flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-white border-b px-12 flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">{activeTab === "flota" ? "Tablero Control de Vehículos" : activeTab === "kyc" ? "Centro de Validación Digital (KYC)" : "🚨 Paradas Saturadas Detectadas"}</h1>
          <button onClick={cargarDatos} className="p-3 bg-slate-50 rounded-xl text-[#0D47A1] border hover:bg-slate-100 transition-all">{loading ? <Loader2 size={20} className="animate-spin"/> : <RefreshCw size={20}/>}</button>
        </header>

        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
          {/* VISTA A: MONITOREO FLOTA REFACTORIZADA */}
          {activeTab === "flota" && (
            <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
              <table className="w-full text-left"><thead className="bg-slate-50/50"><tr className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400"><th className="px-10 py-8">Vehículo (Placa)</th><th className="px-10 py-8">Operador Encargado</th><th className="px-10 py-8">Puestos Libres</th><th className="px-10 py-8 text-right">Modificaciones</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {choferes.map(u => (
                    <React.Fragment key={u.id}>
                      <tr className="group hover:bg-slate-50/30">
                        <td className="px-10 py-6 font-black italic text-[#0D47A1] text-lg uppercase">{u.placa_vehiculo || "SIN PLACA"}</td>
                        <td className="px-10 py-6"><button onClick={() => setExpandedRow(expandedRow === u.id ? null : u.id)} className="flex items-center gap-3 font-black italic uppercase text-slate-700 hover:text-[#0D47A1]">{u.nombre} {u.apellido}</button></td>
                        <td className="px-10 py-6 font-black text-slate-600">{u.puestos_libres} / {u.capacidad_total} Asientos</td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setEditData(u); setModalType("edit"); }} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={18}/></button>
                            <button onClick={() => handleDeleteChofer(u.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button>
                          </div>
                        </td>
                      </tr>
                      {expandedRow === u.id && (
                        <tr className="bg-blue-50/30"><td colSpan="4" className="px-10 py-10 border-t border-blue-100/30"><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><DetailCard icon={<ShieldCheck size={28}/>} label="Cédula Operador" value={`V-${u.cedula}`} color="blue"/><DetailCard icon={<Car size={28}/>} label="Estado Actual" value={(u.estado || 'disponible').toUpperCase()} color="orange"/><DetailCard icon={<Clock size={28}/>} label="Última Hora Salida" value={u.hora_salida || "SIN RECORRIDO"} color="blue"/></div></td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VISTA B: AUDITORÍA KYC COMPLETADO CON 3 PESTAÑAS */}
          {activeTab === "kyc" && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                
                {/* 🎯 TABS DE SELECCIÓN DE ROLES (ESTUDIANTE / CHOFER / CHEQUEADOR) */}
                <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-full max-w-2xl shadow-inner">
                  <button onClick={() => { setSubTabKyc("estudiantes"); setSearchTerm(""); }} className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase transition-all ${subTabKyc === "estudiantes" ? "bg-[#0D47A1] text-white shadow-md" : "text-slate-500"}`}>🧑‍🎓 Estudiantes ({estudiantes.length})</button>
                  <button onClick={() => { setSubTabKyc("choferes"); setSearchChofer(""); }} className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase transition-all ${subTabKyc === "choferes" ? "bg-[#0D47A1] text-white shadow-md" : "text-slate-500"}`}>🚍 Conductores ({choferes.length})</button>
                  <button onClick={() => { setSubTabKyc("chequeadores"); setSearchChequeador(""); }} className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase transition-all ${subTabKyc === "chequeadores" ? "bg-[#0D47A1] text-white shadow-md" : "text-slate-500"}`}>📋 Chequeadores ({chequeadores.length})</button>
                </div>
                
                <div className="flex items-center gap-2 w-full lg:w-auto">
                  {/* SELECTOR DE FILTRO DE HISTORIAL O PENDIENTES */}
                  {subTabKyc === "choferes" && (
                    <select value={filtroChoferEstatus} onChange={(e) => setFiltroChoferEstatus(e.target.value)} className="bg-white border text-xs font-black p-3 rounded-xl uppercase tracking-wider text-slate-700 shadow-sm"><option value="pendientes">Pendientes ({pendientesChof})</option><option value="todos">Historial Completo</option></select>
                  )}
                  {subTabKyc === "chequeadores" && (
                    <select value={filtroChequeadorEstatus} onChange={(e) => setFiltroChequeadorEstatus(e.target.value)} className="bg-white border text-xs font-black p-3 rounded-xl uppercase tracking-wider text-slate-700 shadow-sm"><option value="pendientes">Pendientes ({pendientesCheq})</option><option value="todos">Historial Completo</option></select>
                  )}

                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre o cédula..." 
                      value={subTabKyc === "estudiantes" ? searchTerm : subTabKyc === "choferes" ? searchChofer : searchChequeador} 
                      onChange={(e) => {
                        if (subTabKyc === "estudiantes") setSearchTerm(e.target.value);
                        else if (subTabKyc === "choferes") setSearchChofer(e.target.value);
                        else setSearchChequeador(e.target.value);
                      }} 
                      className="w-full bg-white border rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                    <tr className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                      <th className="px-10 py-8">Nombre Completo</th>
                      <th className="px-10 py-8">Cédula</th>
                      <th className="px-10 py-8">
                        {subTabKyc === "estudiantes" ? "Estatus" : subTabKyc === "choferes" ? "Inspección (3 Fotos)" : "Inspección (2 Fotos)"}
                      </th>
                      <th className="px-10 py-8 text-right">Dictamen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    
                    {/* TABLA ESTUDIANTES */}
                    {subTabKyc === "estudiantes" && estudiantesFiltrados.map(est => (
                      <tr key={est.id} className="hover:bg-slate-50/40">
                        <td className="px-10 py-6 font-black text-slate-700 uppercase">{est.nombre} {est.apellido}</td>
                        <td className="px-10 py-6 font-bold text-slate-400 tracking-wider">V-{est.cedula}</td>
                        <td className="px-10 py-6"><span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${est.kyc_verificado ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>{est.kyc_verificado ? "✔ Validado" : "⏳ Por Validar"}</span></td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            {est.carnet_url && <button onClick={() => setSelectedKycDoc({ titulo: `Carnet Estudiante: ${est.nombre}`, url: est.carnet_url })} className="bg-blue-50 text-[#0D47A1] px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-[#0D47A1] hover:text-white transition-all"><Eye size={12}/></button>}
                            {!est.kyc_verificado ? <button onClick={() => handleEstatusKYC("perfiles", est.id, true)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><Check size={14}/></button> : <button onClick={() => handleEstatusKYC("perfiles", est.id, false, { carnet_url: null })} className="text-[10px] font-black uppercase bg-red-50 text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-600 hover:text-white transition-all">Revocar</button>}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* TABLA CHOFERES */}
                    {subTabKyc === "choferes" && choferesFiltrados.map(chof => (
                      <tr key={chof.id} className="hover:bg-slate-50/40">
                        <td className="px-10 py-6 text-slate-800"><p className="font-black uppercase leading-none">{chof.nombre} {chof.apellido}</p><span className="text-[10px] text-[#0D47A1] font-black uppercase block mt-1">Placa: {chof.placa_vehiculo}</span></td>
                        <td className="px-10 py-6 font-bold text-slate-500 tracking-wider">V-{chof.cedula}</td>
                        <td className="px-10 py-6">
                          <div className="flex gap-2">
                            <button disabled={!chof.kyc_cedula_url} onClick={() => setSelectedKycDoc({ titulo: `Cédula: ${chof.nombre}`, url: chof.kyc_cedula_url })} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase border ${chof.kyc_cedula_url ? 'bg-blue-50 text-[#0D47A1] border-blue-100 hover:bg-[#0D47A1] hover:text-white' : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'}`}><FileText size={12} /></button>
                            <button disabled={!chof.kyc_vehiculo_url} onClick={() => setSelectedKycDoc({ titulo: `Vehículo Placa [${chof.placa_vehiculo}]`, url: chof.kyc_vehiculo_url })} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase border ${chof.kyc_vehiculo_url ? 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-600 hover:text-white' : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'}`}><Car size={12} /></button>
                            <button disabled={!chof.kyc_rostro_url} onClick={() => setSelectedKycDoc({ titulo: `Rostro Conductor: ${chof.nombre}`, url: chof.kyc_rostro_url })} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase border ${chof.kyc_rostro_url ? 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-600 hover:text-white' : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'}`}><Smile size={12} /></button>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            {!chof.kyc_verificado ? <button disabled={!(chof.kyc_cedula_url && chof.kyc_vehiculo_url && chof.kyc_rostro_url)} onClick={() => handleEstatusKYC("choferes", chof.id, true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase shadow-sm disabled:opacity-30">Validar</button> : <button onClick={() => handleEstatusKYC("choferes", chof.id, false, { kyc_cedula_url: null, kyc_vehiculo_url: null, kyc_rostro_url: null })} className="text-[10px] font-black uppercase bg-red-50 text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-600 hover:text-white transition-all">Revocar</button>}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* 🎯 NUEVA TABLA: CHEQUEADORES */}
                    {subTabKyc === "chequeadores" && chequeadoresFiltrados.map(cheq => (
                      <tr key={cheq.id} className="hover:bg-slate-50/40">
                        <td className="px-10 py-6 text-slate-800"><p className="font-black uppercase leading-none">{cheq.nombre} {cheq.apellido}</p></td>
                        <td className="px-10 py-6 font-bold text-slate-500 tracking-wider">V-{cheq.cedula}</td>
                        <td className="px-10 py-6">
                          <div className="flex gap-2">
                            <button disabled={!cheq.kyc_cedula_url} onClick={() => setSelectedKycDoc({ titulo: `Cédula: ${cheq.nombre}`, url: cheq.kyc_cedula_url })} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase border ${cheq.kyc_cedula_url ? 'bg-blue-50 text-[#0D47A1] border-blue-100 hover:bg-[#0D47A1] hover:text-white' : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'}`}><FileText size={12} /></button>
                            <button disabled={!cheq.kyc_rostro_url} onClick={() => setSelectedKycDoc({ titulo: `Rostro Chequeador: ${cheq.nombre}`, url: cheq.kyc_rostro_url })} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase border ${cheq.kyc_rostro_url ? 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-600 hover:text-white' : 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed'}`}><Smile size={12} /></button>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            {!cheq.kyc_verificado ? (
                              <button disabled={!(cheq.kyc_cedula_url && cheq.kyc_rostro_url)} onClick={() => handleEstatusKYC("chequeadores", cheq.id, true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase shadow-sm disabled:opacity-30">Validar</button>
                            ) : (
                              <button onClick={() => handleEstatusKYC("chequeadores", cheq.id, false, { kyc_cedula_url: null, kyc_rostro_url: null })} className="text-[10px] font-black uppercase bg-red-50 text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-600 hover:text-white transition-all">Revocar</button>
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

          {/* VISTA C: ALERTAS PARADAS */}
          {activeTab === "alertas" && (
            <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
              <table className="w-full text-left"><thead className="bg-red-50/40"><tr className="text-[10px] uppercase font-black tracking-[0.2em] text-red-500"><th className="px-10 py-8">📍 Ubicación / Parada</th><th className="px-10 py-8">Reportado Por</th><th className="px-10 py-8">Hora</th><th className="px-10 py-8 text-right">Acción</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {reportesParada.length > 0 ? (
                    reportesParada.map(rep => (
                      <tr key={rep.id} className="bg-amber-50/10">
                        <td className="px-10 py-6"><span className="bg-red-100 text-red-700 font-black px-4 py-2 rounded-xl text-sm uppercase tracking-wide inline-block">{rep.parada_nombre}</span></td>
                        <td className="px-10 py-6 font-black text-slate-700 uppercase text-xs">{rep.perfiles?.nombre} {rep.perfiles?.apellido} <span className="text-slate-400 block text-[10px]">V-{rep.perfiles?.cedula}</span></td>
                        <td className="px-10 py-6 text-xs font-medium text-slate-500">{new Date(rep.creado_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                        <td className="px-10 py-6 text-right"><button onClick={() => setDispatchTarget(rep)} className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-xl text-xs font-black uppercase hover:bg-emerald-600 transition-all shadow-md"><Car size={14} /> Atender</button></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="px-10 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Todas las paradas fluyen con normalidad 👍</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL INTERACTIVO: ASIGNA VEHÍCULOS DISPONIBLES */}
      {dispatchTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[140] flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[50px] w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-6 border-b pb-4 text-red-600">
              <div className="flex items-center gap-3"><AlertTriangle size={26} className="animate-pulse" /><h3 className="text-xl font-black italic uppercase tracking-tighter">Despachar Refuerzo</h3></div>
              <button onClick={() => setDispatchTarget(null)} className="p-2 bg-slate-50 rounded-full hover:bg-red-50 text-slate-400"><X size={20}/></button>
            </div>
            <div className="mb-6 space-y-2 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-sm font-bold text-slate-700">📍 Parada: <span className="text-red-600 font-black uppercase">{dispatchTarget.parada_nombre}</span></p></div>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-8">
              {choferes.filter(u => u.estado === 'disponible' && u.kyc_verificado).length > 0 ? (
                choferes.filter(u => u.estado === 'disponible' && u.kyc_verificado).map(unit => (
                  <button key={unit.id} onClick={() => handleConfirmarDespacho(unit.id)} className="w-full bg-white hover:bg-blue-50 border p-4 rounded-xl flex items-center justify-between group transition-all text-left" >
                    <div className="flex flex-col"><span className="text-sm font-black text-[#0D47A1] uppercase">PLACA: {unit.placa_vehiculo}</span><span className="text-[10px] text-emerald-600 font-black uppercase mt-0.5">Chofer: {unit.nombre} {unit.apellido}</span></div>
                    <div className="bg-blue-50 group-hover:bg-[#0D47A1] group-hover:text-white text-[#0D47A1] p-2.5 rounded-lg"><Send size={14} /></div>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50"><ShieldAlert size={24} className="mx-auto text-orange-400 mb-2"/><p className="text-[11px] font-black uppercase text-slate-500 tracking-wide">Flota No Disponible</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL UNIFICADO: ALTA / EDICIÓN DE FLOTA */}
      {modalType && (
        <Modal title={modalType === "edit" ? "Editar Perfil Vehicular" : "Alta de Chofer y Vehículo"} icon={modalType === "edit" ? <UserCog size={30}/> : <Plus size={30}/>} onClose={() => setModalType(null)}>
          <form onSubmit={handleFormSubmit} className="space-y-5 text-xs font-bold uppercase italic text-left">
            {modalType === "edit" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] text-blue-500 mb-1">Nombre</p><input value={editData?.nombre || ""} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800" onChange={e => setEditData({...editData, nombre: e.target.value})} required/></div>
                  <div><p className="text-[10px] text-blue-500 mb-1">Apellido</p><input value={editData?.apellido || ""} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800" onChange={e => setEditData({...editData, apellido: e.target.value})} required/></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] text-blue-500 mb-1">Cédula</p><input value={editData?.cedula || ""} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800" onChange={e => setEditData({...editData, cedula: e.target.value})} required/></div>
                  <div><p className="text-[10px] text-blue-500 mb-1">Teléfono</p><input value={editData?.telefono || ""} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800" onChange={e => setEditData({...editData, telefono: e.target.value})} required/></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] text-emerald-500 mb-1">Placa Carro</p><input value={editData?.placa_vehiculo || ""} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none uppercase text-slate-800" onChange={e => setEditData({...editData, placa_vehiculo: e.target.value})} required/></div>
                  <div><p className="text-[10px] text-emerald-500 mb-1">Asientos</p><input type="number" value={editData?.capacidad_total || 4} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800" onChange={e => setEditData({...editData, capacidad_total: e.target.value})} required/></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="font-black text-[10px] text-blue-500">DATOS TÉCNICOS</p>
                  <input placeholder="PLACA DEL CARRO" className="w-full bg-slate-50 border p-4 rounded-2xl outline-none uppercase text-slate-800" onChange={e => setFormData({...formData, placa: e.target.value})} required/>
                  <select className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-500" onChange={e => setFormData({...formData, capacidad: e.target.value})} required><option value="4">4 PUESTOS (SEDÁN)</option><option value="5">5 PUESTOS (SUV)</option></select>
                </div>
                <div className="space-y-4">
                  <p className="font-black text-[10px] text-emerald-500">DATOS OPERADOR</p>
                  <input placeholder="NOMBRE" className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800" onChange={e => setFormData({...formData, nom_chof: e.target.value})} required/>
                  <input placeholder="APELLIDO" className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800" onChange={e => setFormData({...formData, apellido_chof: e.target.value})} required/>
                  <input placeholder="CÉDULA" className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800" onChange={e => setFormData({...formData, ced_chof: e.target.value})} required/>
                  <input placeholder="TELÉFONO" className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800" onChange={e => setFormData({...formData, tel_chof: e.target.value})} required/>
                  <input type="email" placeholder="CORREO" className="w-full bg-slate-50 border p-4 rounded-2xl outline-none lowercase text-slate-800" onChange={e => setFormData({...formData, mail_chof: e.target.value})} required/>
                  <input type="password" placeholder="CONTRASEÑA ACCESS" className="w-full bg-slate-50 border p-4 rounded-2xl outline-none text-slate-800" onChange={e => setFormData({...formData, pass_chof: e.target.value})} required/>
                </div>
              </div>
            )}
            <button type="submit" className="w-full bg-[#0D47A1] text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 tracking-widest text-sm uppercase mt-4 shadow-xl"><Save size={18}/> CONFIRMAR REGISTRO</button>
          </form>
        </Modal>
      )}

      {/* LIGHTBOX MODAL MULTI-DOCS */}
      {selectedKycDoc && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[150] flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <button onClick={() => setSelectedKycDoc(null)} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full hover:bg-white/20 text-white shadow-xl z-50"><X size={28} /></button>
          <div className="w-full max-w-2xl text-center space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-blue-400 italic">{selectedKycDoc.titulo}</h3>
            <div className="w-full max-h-[75vh] flex items-center justify-center rounded-[32px] overflow-hidden bg-slate-800 shadow-2xl p-4 border border-white/10"><img src={selectedKycDoc.url} alt="Evidencia KYC" className="max-w-full max-h-[70vh] object-contain rounded-2xl" /></div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- COMPONENTES AUXILIARES ---
const DetailCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-7 rounded-[35px] shadow-sm border border-blue-100/50 flex items-center gap-5 text-left w-full">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{icon}</div>
    <div><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{label}</p><p className="text-base font-black italic text-slate-700 uppercase leading-none">{value}</p></div>
  </div>
);

const Modal = ({ title, icon, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 overflow-y-auto">
    <div className="bg-white p-12 rounded-[50px] w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300 border border-white/20">
      <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6 text-[#0D47A1]">
        <div className="flex items-center gap-4">{icon}<h3 className="text-2xl font-black italic uppercase tracking-tighter">{title}</h3></div>
        <button onClick={onClose} className="p-3 bg-slate-50 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600"><X size={24}/></button>
      </div>
      {children}
    </div>
  </div>
);