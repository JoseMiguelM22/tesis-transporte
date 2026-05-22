import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Car, Users, Power, Plus, RefreshCw, 
  Edit3, CheckCircle2, X, ShieldCheck, ChevronDown, 
  ChevronUp, Calendar, Trash2, UserCog, Save, Loader2, Eye, XCircle,
  AlertTriangle, Check, Send
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // --- ESTADOS PRINCIPALES ---
  const [unidades, setUnidades] = useState([]);
  const [estudiantesPendientes, setEstudiantesPendientes] = useState([]);
  const [reportesParada, setReportesParada] = useState([]); 
  const [activeTab, setActiveTab] = useState("flota"); // "flota", "kyc" o "alertas"
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showFullRegistration, setShowFullRegistration] = useState(false);
  const [selectedCarnetUrl, setSelectedCarnetUrl] = useState(null); 
  const [dispatchTarget, setDispatchTarget] = useState(null); // Alerta seleccionada para despachar

  // --- ESTADOS DE EDICIÓN ---
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  // --- ESTADO FORMULARIO REGISTRO ---
  const [formData, setFormData] = useState({
    numero_unit: "", placa: "", capacidad: 5,
    nom_chof: "", ced_chof: "", mail_chof: "", pass_chof: ""
  });

  // --- CARGA DE DATOS GLOBAL ---
  const cargarDatos = async () => {
    setLoading(true);
    await fetchUnidades();
    await fetchEstudiantesPendientes();
    await fetchReportesParada(); 
    setLoading(false);
  };

  const fetchUnidades = async () => {
    try {
      const { data, error } = await supabase
        .from("unidades")
        .select(`*, choferes (*)`)
        .order("numero_unidad", { ascending: true });
      if (error) throw error;
      setUnidades(data || []);
    } catch (err) { 
      console.error("Error unidades:", err.message);
    }
  };

  const fetchEstudiantesPendientes = async () => {
    try {
      const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .eq("rol", "estudiante")
        .not("carnet_url", "is", null)
        .eq("kyc_verificado", false);
      
      if (error) throw error;
      setEstudiantesPendientes(data || []);
    } catch (err) {
      console.error("Error KYC pendientes:", err.message);
    }
  };

  const fetchReportesParada = async () => {
    try {
      // Filtramos explícitamente los registros cuyo flag sea estrictamente TRUE
      const { data, error } = await supabase
        .from("reportes_parada")
        .select(`
          id,
          parada_nombre,
          creado_at,
          perfiles ( nombre, apellido, cedula )
        `)
        .eq("activo", true)
        .order("creado_at", { ascending: false });

      if (error) throw error;
      setReportesParada(data || []);
    } catch (err) {
      console.error("Error al traer reportes de parada:", err.message);
    }
  };

  useEffect(() => { 
    cargarDatos(); 
    const intervalo = setInterval(() => { fetchReportesParada(); }, 15000);
    return () => clearInterval(intervalo);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // --- 🚨 LÓGICA DE DESPACHO INTERACTIVO BLINDADA CON REMOCIÓN INSTANTÁNEA ---
  const handleConfirmarDespacho = async (idUnidadSeleccionada) => {
    if (!dispatchTarget) return;

    const idReporteAEliminar = dispatchTarget.id;

    try {
      const unidadAsignada = unidades.find(u => u.id === idUnidadSeleccionada);

      // 1. Modificamos el estado operativo del autobús a 'en ruta'
      const { error: unitError } = await supabase
        .from("unidades")
        .update({ estado: "en ruta" }) 
        .eq("id", idUnidadSeleccionada);

      if (unitError) throw unitError;

      // 2. Modificamos el estado del reporte a inactivo (activo = false) en Supabase
      const { error: reportError } = await supabase
        .from("reportes_parada")
        .update({ activo: false })
        .eq("id", idReporteAEliminar);

      if (reportError) throw reportError;

      // 3. 🎯 SOLUCIÓN VISUAL INSTANTÁNEA: Filtramos el estado local para limpiar la tabla y el badge del sidebar ya mismo
      setReportesParada(prevReportes => prevReportes.filter(r => r.id !== idReporteAEliminar));

      alert(`¡Despacho Exitoso! Unidad ${unidadAsignada?.numero_unidad} movilizada a ${dispatchTarget.parada_nombre}.`);
      
      // 4. Cerramos el modal de asignación limpiando el target
      setDispatchTarget(null);
      
      // 5. Refrescamos la lista de unidades en segundo plano
      fetchUnidades();
    } catch (err) {
      console.error("Error en despacho logístico:", err);
      alert("No se pudo procesar el despacho: " + err.message);
    }
  };

  // --- ACCIONES KYC ---
  const handleAprobarKYC = async (idEstudiante) => {
    try {
      const { error } = await supabase
        .from("perfiles")
        .update({ kyc_verificado: true })
        .eq("id", idEstudiante);

      if (error) throw error;
      alert("¡Estudiante verificado correctamente!");
      fetchEstudiantesPendientes();
    } catch (err) {
      alert("Error al aprobar: " + err.message);
    }
  };

  const handleRechazarKYC = async (idEstudiante) => {
    if (window.confirm("¿Estás seguro de rechazar este carnet?")) {
      try {
        const { error } = await supabase
          .from("perfiles")
          .update({ carnet_url: null }) 
          .eq("id", idEstudiante);

        if (error) throw error;
        alert("Carnet rechazado.");
        fetchEstudiantesPendientes();
      } catch (err) { alert(err.message); }
    }
  };

  // --- ACCIONES CRUD FLOTA ---
  const handleDelete = async (unitId, choferId) => {
    if (window.confirm("¿Deseas eliminar este registro permanentemente?")) {
      try {
        await supabase.from("unidades").delete().eq("id", unitId);
        if (choferId) await supabase.from("choferes").delete().eq("id", choferId);
        fetchUnidades();
      } catch (err) { alert(err.message); }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editData.chofer_id) {
        await supabase.from("choferes").update({
          nombre: editData.choferes.nombre,
          cedula: editData.choferes.cedula
        }).eq("id", editData.chofer_id);
      }
      await supabase.from("unidades").update({
        placa: editData.placa,
        capacidad_total: editData.capacidad_total
      }).eq("id", editData.id);

      setIsEditing(false);
      fetchUnidades();
    } catch (err) { alert(err.message); }
  };

  const handleFullRegistration = async (e) => {
    e.preventDefault();
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.mail_chof, password: formData.pass_chof,
      });
      if (authError) throw authError;

      const { data: choferData, error: chofError } = await supabase.from("choferes").insert([{ 
        nombre: formData.nom_chof, cedula: formData.ced_chof, user_id: authData.user.id 
      }]).select().single();
      if (chofError) throw chofError;

      await supabase.from("unidades").insert([{ 
        numero_unidad: formData.numero_unit, placa: formData.placa, 
        capacidad_total: formData.capacidad, puestos_libres: formData.capacidad, 
        estado: 'disponible', chofer_id: choferData.id 
      }]);

      alert("¡Nueva unidad registrada!");
      setShowFullRegistration(false);
      fetchUnidades();
    } catch (err) { alert("Error: " + err.message); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden text-left">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0D47A1] text-white flex flex-col shrink-0 shadow-2xl z-30">
        <div className="p-10 flex items-center gap-3 italic">
          <Car size={32} className="text-blue-400" />
          <h2 className="text-2xl font-black uppercase tracking-tighter">RUTA<span className="font-light text-blue-300">UNEFA</span></h2>
        </div>
        <nav className="flex-1 px-6 space-y-3">
          <button 
            onClick={() => setActiveTab("flota")}
            className={`flex items-center gap-4 w-full p-4 rounded-2xl font-black italic transition-all ${activeTab === "flota" ? 'bg-white/10 shadow-lg border-l-4 border-blue-400' : 'opacity-60 hover:opacity-100'}`}
          >
            <LayoutDashboard size={20}/> Vista de Flota
          </button>
          
          <button 
            onClick={() => setActiveTab("kyc")}
            className={`flex items-center justify-between w-full p-4 rounded-2xl font-black italic transition-all ${activeTab === "kyc" ? 'bg-white/10 shadow-lg border-l-4 border-blue-400' : 'opacity-60 hover:opacity-100'}`}
          >
            <div className="flex items-center gap-4">
              <Users size={20}/> Auditoría KYC
            </div>
            {estudiantesPendientes.length > 0 && (
              <span className="bg-orange-500 text-white font-sans font-bold text-[10px] px-2.5 py-1 rounded-full">
                {estudiantesPendientes.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab("alertas")}
            className={`flex items-center justify-between w-full p-4 rounded-2xl font-black italic transition-all ${activeTab === "alertas" ? 'bg-white/10 shadow-lg border-l-4 border-red-400' : 'opacity-60 hover:opacity-100'}`}
          >
            <div className="flex items-center gap-4">
              <AlertTriangle size={20} className={reportesParada.length > 0 ? "text-red-400" : ""} /> Paradas Llenas
            </div>
            {reportesParada.length > 0 && (
              <span className="bg-red-500 text-white font-sans font-bold text-[10px] px-2.5 py-1 rounded-full">
                {reportesParada.length}
              </span>
            )}
          </button>

          <div className="pt-4 border-t border-white/10">
            <button onClick={() => setShowFullRegistration(true)} className="flex items-center gap-4 w-full p-4 bg-emerald-500/20 text-emerald-300 rounded-2xl font-black italic border border-emerald-500/20 hover:bg-emerald-500/30 transition-all">
              <Plus size={20}/> ALTA DE FLOTA
            </button>
          </div>
        </nav>
        <div className="p-10 border-t border-white/5">
            <button onClick={handleLogout} className="flex items-center gap-3 text-white/50 hover:text-white font-bold italic uppercase text-xs transition-all">
                <Power size={16}/> Cerrar Sesión
            </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-white border-b px-12 flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">
            {activeTab === "flota" && "Gestión de Flota"}
            {activeTab === "kyc" && "Verificación de Identidad Estudiantil"}
            {activeTab === "alertas" && "🚨 Alertas Críticas: Paradas Saturadas"}
          </h1>
          <button onClick={cargarDatos} className="p-3 bg-slate-50 rounded-xl text-[#0D47A1] border hover:bg-slate-100 transition-all">
            {loading ? <Loader2 size={20} className="animate-spin"/> : <RefreshCw size={20}/>}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
          
          {/* TAB 1: GESTIÓN DE FLOTA */}
          {activeTab === "flota" && (
            <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                    <th className="px-10 py-8">Unidad</th>
                    <th className="px-10 py-8">Chofer / Operador</th>
                    <th className="px-10 py-8">Placa</th>
                    <th className="px-10 py-8 text-right">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {unidades.map((u) => (
                    <React.Fragment key={u.id}>
                      <tr className={`group transition-all ${expandedRow === u.id ? 'bg-blue-50/50' : 'hover:bg-slate-50/30'}`}>
                        <td className="px-10 py-6 font-black italic text-[#0D47A1] text-lg">Unidad {u.numero_unidad}</td>
                        <td className="px-10 py-6">
                           <button onClick={() => setExpandedRow(expandedRow === u.id ? null : u.id)} className="flex items-center gap-3 font-black italic uppercase text-slate-700 hover:text-[#0D47A1] transition-colors">
                              <div className={`p-2 rounded-lg transition-all ${expandedRow === u.id ? 'bg-[#0D47A1] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {expandedRow === u.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                              </div>
                              {u.choferes?.nombre || "PERSONAL PENDIENTE"}
                           </button>
                        </td>
                        <td className="px-10 py-6 font-black text-slate-400 uppercase tracking-widest">{u.placa}</td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { setEditData(u); setIsEditing(true); }} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                              <Edit3 size={18}/>
                            </button>
                            <button onClick={() => handleDelete(u.id, u.chofer_id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                              <Trash2 size={18}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRow === u.id && (
                        <tr className="bg-blue-50/30">
                          <td colSpan="4" className="px-10 py-10 border-t border-blue-100/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <DetailCard icon={<ShieldCheck size={28}/>} label="Cédula" value={u.choferes?.cedula || "N/A"} color="blue"/>
                              <DetailCard icon={<Car size={28}/>} label="Estado Flota" value={(u.estado || 'disponible').toUpperCase()} color="orange"/>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: AUDITORÍA KYC */}
          {activeTab === "kyc" && (
            <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                    <th className="px-10 py-8">Estudiante</th>
                    <th className="px-10 py-8">Cédula</th>
                    <th className="px-10 py-8">Documento Adjunto</th>
                    <th className="px-10 py-8 text-right">Validación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {estudiantesPendientes.length > 0 ? (
                    estudiantesPendientes.map((est) => (
                      <tr key={est.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-10 py-6 font-black text-slate-800 uppercase">{est.nombre} {est.apellido}</td>
                        <td className="px-10 py-6 font-bold text-slate-500 tracking-wider">{est.cedula}</td>
                        <td className="px-10 py-6">
                          <button 
                            onClick={() => setSelectedCarnetUrl(est.carnet_url)}
                            className="flex items-center gap-2 bg-blue-50 text-[#0D47A1] px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-[#0D47A1] hover:text-white transition-all shadow-sm"
                          >
                            <Eye size={14} /> Inspeccionar Carnet
                          </button>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleAprobarKYC(est.id)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                              <CheckCircle2 size={18}/>
                            </button>
                            <button onClick={() => handleRechazarKYC(est.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                              <XCircle size={18}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-10 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                        No hay solicitudes KYC pendientes 🎉
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: CONTROL DE PARADAS LLENAS */}
          {activeTab === "alertas" && (
            <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-red-50/40">
                  <tr className="text-[10px] uppercase font-black tracking-[0.2em] text-red-500">
                    <th className="px-10 py-8">📍 Ubicación / Parada</th>
                    <th className="px-10 py-8">Reportado Por</th>
                    <th className="px-10 py-8">Hora del Reporte</th>
                    <th className="px-10 py-8 text-right">Acción Crítica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportesParada.length > 0 ? (
                    reportesParada.map((rep) => (
                      <tr key={rep.id} className="hover:bg-red-50/10 transition-all bg-amber-50/10">
                        <td className="px-10 py-6">
                          <span className="bg-red-100 text-red-700 font-black px-4 py-2 rounded-xl text-sm uppercase tracking-wide inline-block">
                            {rep.parada_nombre}
                          </span>
                        </td>
                        <td className="px-10 py-6 font-bold text-slate-700 uppercase text-xs">
                          {rep.perfiles?.nombre} {rep.perfiles?.apellido} <span className="text-slate-400 block text-[10px]">V-{rep.perfiles?.cedula}</span>
                        </td>
                        <td className="px-10 py-6 text-xs font-medium text-slate-500">
                          {new Date(rep.creado_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button 
                            onClick={() => setDispatchTarget(rep)}
                            className="inline-flex items-center gap-2 bg-emerald-500 text-white px-5 py-3 rounded-xl text-xs font-black uppercase hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                          >
                            <Car size={14} /> Atender Parada
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-10 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                        Todas las paradas fluyen con normalidad 👍
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>

      {/* MODAL INTERACTIVO: ORDEN DE DESPACHO Y ASIGNACIÓN DE FLOTA */}
      {dispatchTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[140] flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[50px] w-full max-w-md shadow-2xl animate-in zoom-in duration-200 border border-slate-100">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4 text-red-600">
              <div className="flex items-center gap-3">
                <AlertTriangle size={26} className="animate-pulse" />
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Despachar Refuerzo</h3>
              </div>
              <button onClick={() => setDispatchTarget(null)} className="p-2 bg-slate-50 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><X size={20}/></button>
            </div>

            <div className="mb-6 space-y-2 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Detalles de Incidencia</p>
              <p className="text-sm font-bold text-slate-700">📍 Parada: <span className="text-red-600 font-black uppercase">{dispatchTarget.parada_nombre}</span></p>
              <p className="text-xs text-slate-500 font-medium">Reportado por: {dispatchTarget.perfiles?.nombre} {dispatchTarget.perfiles?.apellido}</p>
            </div>

            <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-4 text-left">Selecciona una Unidad Disponible:</p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar mb-8">
              {unidades.filter(u => u.estado !== 'fuera de servicio').map((unit) => (
                <button
                  key={unit.id}
                  onClick={() => handleConfirmarDespacho(unit.id)}
                  className="w-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 p-4 rounded-xl flex items-center justify-between group active:scale-[0.99] transition-all text-left"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-[#0D47A1] uppercase">Unidad {unit.numero_unidad}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Estado actual: {unit.estado}</span>
                  </div>
                  <div className="bg-blue-50 group-hover:bg-[#0D47A1] group-hover:text-white text-[#0D47A1] p-2.5 rounded-lg transition-colors">
                    <Send size={14} />
                  </div>
                </button>
              ))}
            </div>
            
            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tight">Al asignar la unidad, la alerta se archivará de forma automática.</p>
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN FLOTA */}
      {isEditing && (
        <Modal title="Editar Perfil" icon={<UserCog size={30}/>} onClose={() => setIsEditing(false)}>
            <form onSubmit={handleUpdate} className="space-y-8 italic font-bold uppercase">
              <div className="space-y-4 text-left">
                <p className="text-[10px] text-blue-500 tracking-widest font-black uppercase">Identidad Operador</p>
                <input value={editData.choferes?.nombre || ""} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20" onChange={e => setEditData({...editData, choferes: {...editData.choferes, nombre: e.target.value}})} required/>
                <input value={editData.choferes?.cedula || ""} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20" onChange={e => setEditData({...editData, choferes: {...editData.choferes, cedula: e.target.value}})} required/>
              </div>
              <div className="space-y-4 text-left">
                <p className="text-[10px] text-emerald-500 tracking-widest font-black uppercase">Detalles Unidad</p>
                <input value={editData.placa} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20" onChange={e => setEditData({...editData, placa: e.target.value})} required/>
                <input type="number" value={editData.capacidad_total} className="w-full bg-slate-50 border p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20" onChange={e => setEditData({...editData, capacidad_total: e.target.value})} required/>
              </div>
              <button type="submit" className="w-full bg-[#0D47A1] text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl">
                <Save size={22}/> GUARDAR CAMBIOS
              </button>
            </form>
        </Modal>
      )}

      {/* MODAL ALTA DE FLOTA */}
      {showFullRegistration && (
        <Modal title="Alta de Nueva Flota" icon={<Plus size={30}/>} onClose={() => setShowFullRegistration(false)}>
            <form onSubmit={handleFullRegistration} className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-5 text-left">
                <p className="font-black text-[10px] tracking-widest text-blue-500 uppercase">DATOS VEHÍCULO</p>
                <input placeholder="N° UNIDAD" className="w-full bg-slate-50 border p-4 rounded-2xl outline-none" onChange={e => setFormData({...formData, numero_unit: e.target.value})} required/>
                <input placeholder="PLACA" className="w-full bg-slate-50 border p-4 rounded-2xl outline-none" onChange={e => setFormData({...formData, placa: e.target.value})} required/>
                <input type="number" placeholder="CAPACIDAD" className="w-full bg-slate-50 border p-4 rounded-2xl outline-none" onChange={e => setFormData({...formData, capacidad: e.target.value})} required/>
              </div>
              <div className="space-y-5 text-left">
                <p className="font-black text-[10px] tracking-widest text-emerald-500 uppercase">DATOS CHOFER</p>
                <input placeholder="NOMBRE" className="w-full bg-slate-50 border p-4 rounded-2xl outline-none" onChange={e => setFormData({...formData, nom_chof: e.target.value})} required/>
                <input placeholder="CÉDULA" className="w-full bg-slate-50 border p-4 rounded-2xl outline-none" onChange={e => setFormData({...formData, ced_chof: e.target.value})} required/>
                <input type="email" placeholder="EMAIL" className="w-full bg-slate-50 border p-4 rounded-2xl outline-none" onChange={e => setFormData({...formData, mail_chof: e.target.value})} required/>
                <input type="password" placeholder="CONTRASEÑA" className="w-full bg-slate-50 border p-4 rounded-2xl outline-none" onChange={e => setFormData({...formData, pass_chof: e.target.value})} required/>
              </div>
              <button type="submit" className="md:col-span-2 bg-[#0D47A1] text-white py-6 rounded-3xl font-black italic text-xl uppercase shadow-2xl active:scale-95 transition-all">
                FINALIZAR REGISTRO
              </button>
            </form>
        </Modal>
      )}

      {/* LIGHTBOX MODAL */}
      {selectedCarnetUrl && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[150] flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <button onClick={() => setSelectedCarnetUrl(null)} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full hover:bg-white/20 text-white transition-all shadow-xl">
            <X size={28} />
          </button>
          <div className="max-w-2xl w-full max-h-[75vh] flex items-center justify-center rounded-[32px] overflow-hidden bg-slate-800 shadow-2xl p-4 border border-white/10">
            <img src={selectedCarnetUrl} alt="Carnet Universitario" className="max-w-full max-h-[70vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}

    </div>
  );
}

// --- COMPONENTES AUXILIARES ---
const DetailCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-7 rounded-[35px] shadow-sm border border-blue-100/50 flex items-center gap-5 text-left w-full">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
      color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
    }`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-base font-black italic text-slate-700 uppercase leading-none">{value}</p>
    </div>
  </div>
);

const Modal = ({ title, icon, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 overflow-y-auto">
    <div className="bg-white p-12 rounded-[50px] w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300 border border-white/20">
      <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6 text-[#0D47A1]">
        <div className="flex items-center gap-4">{icon}<h3 className="text-2xl font-black italic uppercase tracking-tighter">{title}</h3></div>
        <button onClick={onClose} className="p-3 bg-slate-50 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"><X size={24}/></button>
      </div>
      {children}
    </div>
  </div>
);