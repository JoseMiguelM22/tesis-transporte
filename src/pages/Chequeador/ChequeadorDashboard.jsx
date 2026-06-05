import React, { useState, useEffect, useRef } from "react";
import { 
  LogOut, Menu, X, User, Camera, ShieldCheck, CreditCard, Image as ImageIcon, 
  ArrowRight, AlertTriangle, FileText, CheckCircle, Clock, Smile, 
  ChevronDown, LayoutDashboard, Settings, Loader2, Bus, Users, 
  ShieldAlert, Power, ClipboardList, Send, Edit2, Inbox, MapPin
} from "lucide-react";
import { supabase } from "../../lib/supabase"; 
import { useNavigate } from "react-router-dom";

export default function ChequeadorDashboard() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const sidebarRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const kycInputRef = useRef(null); 
  
  // --- Estados de Interfaz ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false); 
  const [kycTypeActive, setKycTypeActive] = useState(""); 
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false); 
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  
  // 🎯 VISTAS: "inicio", "reportes", "historico"
  const [vistaActiva, setVistaActiva] = useState("inicio"); 
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [loadingPagina, setLoadingPagina] = useState(true);

  // --- Estados de Datos ---
  const [chequeadorData, setChequeadorData] = useState({ 
    id: "", nombre: "", apellido: "", avatar_url: null, cedula: "", email: "", telefono: "",
    kyc_verificado: false, kyc_cedula_url: null, kyc_rostro_url: null 
  });
  const [tempData, setTempData] = useState({ nombre: "", apellido: "" });

  const [unidades, setUnidades] = useState([]);
  const [recorridos, setRecorridos] = useState([]);
  const [reportes, setReportes] = useState([]); 
  const [misAlertas, setMisAlertas] = useState([]); 

  // --- Sincronización y Eventos ---
  useEffect(() => {
    const inicializarPanel = async () => {
      setLoadingPagina(true);
      await fetchChequeador();
      await cargarDatosOperativos();
      setLoadingPagina(false);
    };
    inicializarPanel();

    const intervalo = setInterval(() => { cargarDatosOperativos(); }, 15000);

    const manejarClicsExteriores = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAbierto(false);
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", manejarClicsExteriores);
    return () => {
      document.removeEventListener("mousedown", manejarClicsExteriores);
      clearInterval(intervalo);
    };
  }, []);

  const fetchChequeador = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { navigate("/acceso-chequeador"); return; }

      const { data, error: dbError } = await supabase.from('chequeadores').select('*').eq('id', user.id).maybeSingle();
      if (dbError) throw dbError;
      if (data) {
        setChequeadorData(data);
        setTempData({ nombre: data.nombre, apellido: data.apellido });
      }
    } catch (err) { console.error("Error cargando sesión:", err.message); }
  };

  const cargarDatosOperativos = async () => {
    try {
      // 1. Choferes en ruta
      const { data: choferesEnRuta } = await supabase.from('choferes').select('id, nombre, apellido, placa_vehiculo, hora_salida').eq('estado', 'en ruta');
      if (choferesEnRuta) {
        setUnidades(choferesEnRuta.map(c => ({
          id: c.id, chofer: `${c.nombre} ${c.apellido}`, placa: c.placa_vehiculo, ruta: "Circuito UNEFA", hora_salida: c.hora_salida 
        })));
      }

      // 2. Historial de Recorridos Permanente
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: historialGuardado, error: histError } = await supabase
          .from('historial_recorridos')
          .select('*')
          .eq('chequeador_id', user.id)
          .order('creado_at', { ascending: false });

        if (!histError && historialGuardado) {
          setRecorridos(historialGuardado.map(h => ({
            id: h.id,
            chofer: h.chofer_nombre,
            placa: h.placa,
            ruta: h.ruta,
            hora_llegada: h.hora_llegada,
            fecha: new Date(h.creado_at).toLocaleDateString()
          })));
        }
      }

      // 3. Reportes de Estudiantes
      const { data: reportesActivos } = await supabase
        .from('reportes_parada')
        .select('id, parada_nombre, creado_at, perfiles(nombre, apellido)')
        .eq('activo', true)
        .order('creado_at', { ascending: false });

      if (reportesActivos) {
        setReportes(reportesActivos.map(r => ({
          id: r.id,
          usuario: `${r.perfiles?.nombre || 'Estudiante'} ${r.perfiles?.apellido || ''}`,
          hora: new Date(r.creado_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mensaje: `Reporte de saturación: ${r.parada_nombre}`
        })));
      }
    } catch (error) { console.error("Error obteniendo datos:", error); }
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut({ scope: 'local' }); navigate("/"); } catch (err) { navigate("/"); }
  };

  // --- FUNCIONES OPERATIVAS ---
  
  const registrarLlegada = async (unidad) => {
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setUploading(true); 
    
    try {
      // Guardar en la tabla histórica
      const { error: histError } = await supabase.from('historial_recorridos').insert([{
        chofer_nombre: unidad.chofer,
        placa: unidad.placa,
        ruta: unidad.ruta,
        chequeador_id: chequeadorData.id,
        hora_llegada: horaActual
      }]);
      if (histError) throw histError;

      // Liberar al chofer
      const { error: chofError } = await supabase.from('choferes').update({ estado: 'disponible' }).eq('id', unidad.id);
      if (chofError) throw chofError;

      // Sincronizar en cascada la tabla unidades
      try {
        await supabase.from('unidades').update({ estado: 'disponible', puestos_libres: 4 }).eq('numero_unidad', unidad.placa);
      } catch(e) {}

      // Actualizar UI en caliente
      setUnidades(unidades.filter(u => u.id !== unidad.id));
      setRecorridos([{ ...unidad, hora_llegada: horaActual, fecha: new Date().toLocaleDateString() }, ...recorridos]);
      
      alert(`✔ Llegada registrada: Unidad ${unidad.placa} guardada en bitácora.`);
    } catch (error) {
      alert("Error al guardar en el historial: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const atenderReporteEstudiante = async (id) => {
    setReportes(reportes.filter(r => r.id !== id));
    await supabase.from('reportes_parada').update({ activo: false }).eq('id', id);
  };

  const enviarAlertaDeSaturacion = async () => {
    const nombreParada = prompt("Indique la parada saturada a reportar (ej: Maraven):", "Maraven - Principal");
    if (!nombreParada) return;

    setUploading(true); 
    try {
      const { data, error } = await supabase.from('alertas_paradas').insert([{ parada_nombre: nombreParada, chequeador_id: chequeadorData.id, estado: 'activa' }]).select();
      if (error) throw error;
      alert(`🚨 ¡Alerta enviada a la administración central para la parada: ${nombreParada}!`);
      setMisAlertas([{ ...data[0] }, ...misAlertas]);
    } catch (error) { alert("Error al enviar alerta: " + error.message); } 
    finally { setUploading(false); }
  };

  const handleUpdateNames = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('chequeadores').update(tempData).eq('id', chequeadorData.id);
    if (!error) { setChequeadorData(prev => ({ ...prev, ...tempData })); setIsEditing(false); }
    setIsSaving(false);
  };

  // --- SISTEMA KYC ---
  const handleUploadFile = async (file, bucketKey, updateField) => {
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${bucketKey}-${chequeadorData.id}-${Date.now()}.${fileExt}`;
      const filePath = `kyc_chequeadores/${fileName}`;

      const { error: upErr } = await supabase.storage.from('carnets').upload(filePath, file);
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('carnets').getPublicUrl(filePath);
      const updates = { [updateField]: publicUrl };
      if (bucketKey !== 'avatar') updates.kyc_verificado = false; 

      await supabase.from('chequeadores').update(updates).eq('id', chequeadorData.id);
      setChequeadorData(prev => ({ ...prev, ...updates }));
      setShowKycModal(false);
    } catch (e) { alert("Error: " + e.message); } 
    finally { setUploading(false); setShowPhotoOptions(false); stopCamera(); }
  };

  const startCamera = async () => { setShowPhotoOptions(false); setShowCamera(true); try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }); if (videoRef.current) videoRef.current.srcObject = stream; } catch (err) { alert("Sin acceso a cámara."); setShowCamera(false); } };
  const stopCamera = () => { if (videoRef.current && videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(track => track.stop()); setShowCamera(false); };
  const capturePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth; canvasRef.current.height = videoRef.current.videoHeight;
    context.translate(canvasRef.current.width, 0); context.scale(-1, 1);
    context.drawImage(videoRef.current, 0, 0);
    canvasRef.current.toBlob(async (blob) => {
      const file = new File([blob], "kyc_capture.png", { type: "image/png" });
      if (kycTypeActive === "avatar") await handleUploadFile(file, 'avatar', 'avatar_url');
      else { const campoDB = kycTypeActive === "cedula" ? "kyc_cedula_url" : "kyc_rostro_url"; await handleUploadFile(file, kycTypeActive, campoDB); }
    }, 'image/png');
  };

  if (loadingPagina) return <div className="min-h-screen bg-[#1566D0] flex flex-col items-center justify-center text-white space-y-4"><Loader2 className="animate-spin" size={48} /><p className="font-black tracking-widest uppercase text-xs">Cargando credenciales...</p></div>;

  return (
    <div className="min-h-screen bg-[#1566D0] font-sans text-white flex flex-col relative overflow-hidden text-left">
      
      {/* MODALES Y CÁMARA */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center p-6">
          <button onClick={stopCamera} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full hover:bg-white/20 text-white shadow-xl"><X size={28} /></button>
          <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-[75vh] rounded-[32px] border-4 border-white object-cover" />
          <button onClick={capturePhoto} className="mt-6 p-6 bg-white text-[#1566D0] rounded-full shadow-2xl active:scale-95 transition-all"><Camera size={32} /></button>
        </div>
      )}

      {showKycModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0A1D3D]/90 backdrop-blur-sm" onClick={() => !uploading && setShowKycModal(false)}></div>
          <div className="relative bg-[#0D47A1] text-white w-full max-w-sm rounded-[38px] shadow-2xl p-8 border border-white/10 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4"><div className="flex items-center gap-2 text-blue-300"><FileText size={20} /><h3 className="text-sm font-black uppercase tracking-wider">Subir {kycTypeActive.toUpperCase()}</h3></div><button disabled={uploading} onClick={() => setShowKycModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><X size={16}/></button></div>
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-2xl flex gap-3 text-left"><AlertTriangle size={18} className="shrink-0 text-amber-400" /><p className="text-xs font-medium leading-relaxed">{kycTypeActive === "cedula" ? "Sube una foto legible de tu cédula." : "Tómate una selfie frontal."}</p></div>
            {uploading ? <div className="text-center py-10 space-y-3"><Loader2 className="animate-spin text-blue-400 mx-auto" size={32} /><span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Subiendo Requisito...</span></div> : <div className="space-y-3"><button onClick={startCamera} className="w-full bg-white/5 hover:bg-[#1566D0] border border-white/10 text-white p-5 rounded-2xl flex items-center justify-between group transition-all"><div className="flex flex-col text-left"><span className="text-sm font-black uppercase tracking-wide">Cámara Frontal</span></div><Camera size={20} className="text-blue-400 group-hover:text-white" /></button><button onClick={() => kycInputRef.current.click()} className="w-full bg-white/5 hover:bg-[#1566D0] border border-white/10 text-white p-5 rounded-2xl flex items-center justify-between group transition-all"><div className="flex flex-col text-left"><span className="text-sm font-black uppercase tracking-wide">Galería</span></div><ImageIcon size={20} className="text-blue-400 group-hover:text-white" /></button></div>}
            <input type="file" ref={kycInputRef} className="hidden" accept="image/*" onChange={(e) => { const campoDB = kycTypeActive === "cedula" ? "kyc_cedula_url" : "kyc_rostro_url"; handleUploadFile(e.target.files[0], kycTypeActive, campoDB); }} />
          </div>
        </div>
      )}

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0D47A1]/80 backdrop-blur-xl" onClick={() => !showCamera && setIsProfileModalOpen(false)}></div>
          <div className="relative bg-white text-[#0D47A1] w-full max-w-sm rounded-[45px] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="bg-[#1566D0] p-8 pb-24 text-white relative"><button onClick={() => { stopCamera(); setIsProfileModalOpen(false); }} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={20} /></button><h2 className="text-2xl font-black italic uppercase tracking-tighter">Mi Perfil Chequeador</h2></div>
            <div className="px-8 pb-10 -mt-20 text-center">
              <div className="relative w-40 h-40 mx-auto mb-6">
                <div className="w-40 h-40 rounded-[38px] bg-gray-100 overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center text-4xl font-black">{chequeadorData?.avatar_url ? <img src={chequeadorData.avatar_url} className="w-full h-full object-cover" /> : chequeadorData?.nombre ? chequeadorData.nombre[0].toUpperCase() : <User size={60} className="text-blue-200" />}{uploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-[38px]"><Loader2 className="animate-spin text-[#0D47A1]" /></div>}</div>
                <div className="absolute -bottom-2 -right-2 flex flex-col items-end">{showPhotoOptions && <div className="bg-white rounded-2xl shadow-2xl p-2 mb-2 border border-gray-100 flex flex-col gap-1 z-10 text-left"><button onClick={() => { setKycTypeActive("avatar"); startCamera(); }} className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded-xl text-[10px] font-black uppercase"><Camera size={14} /> Cámara</button><button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded-xl text-[10px] font-black uppercase"><ImageIcon size={14} /> Galería</button></div>}<button onClick={() => setShowPhotoOptions(!showPhotoOptions)} className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl hover:scale-110 transition-all"><Camera size={20} /></button></div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleUploadFile(e.target.files[0], 'avatar', 'avatar_url')} />
              </div>
              <div className="space-y-6">
                {isEditing ? (
                  <div className="space-y-3"><input className="w-full bg-gray-50 border-2 border-blue-50 rounded-xl px-4 py-2 font-bold text-slate-800" value={tempData.nombre} onChange={e => setTempData({...tempData, nombre: e.target.value})} /><input className="w-full bg-gray-50 border-2 border-blue-50 rounded-xl px-4 py-2 font-bold text-slate-800" value={tempData.apellido} onChange={e => setTempData({...tempData, apellido: e.target.value})} /><button onClick={handleUpdateNames} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-black text-xs uppercase transition-all">{isSaving ? "Guardando..." : "Confirmar"}</button></div>
                ) : (
                  <><div className="text-left"><p className="text-[10px] font-bold uppercase text-blue-400 mb-1">Operador de Control</p><h3 className="text-2xl font-black italic uppercase leading-none text-[#0D47A1]">{chequeadorData?.nombre || "Cargando..."} {chequeadorData?.apellido || ""}</h3></div><div className="text-left grid grid-cols-2 gap-2 border-t border-gray-100 pt-4 text-xs font-bold text-slate-500"><div>CÉDULA: <span className="text-slate-800">{chequeadorData?.cedula || "N/A"}</span></div><div>TELÉFONO: <span className="text-slate-800">{chequeadorData?.telefono || "N/A"}</span></div></div><button onClick={() => setIsEditing(true)} className="w-full bg-gray-50 text-[#0D47A1] py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"><Edit2 size={14} /> Editar Datos</button></>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- BACKDROP SIDEBAR Y MENÚ --- */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300" />}
      <div ref={sidebarRef} className={`fixed inset-y-0 left-0 w-80 bg-[#0D47A1] z-50 transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-500 flex flex-col p-8 shadow-2xl border-r border-white/5`}>
        <div className="flex justify-between items-center mb-6"><ShieldCheck size={24} className="text-blue-300" /><button onClick={() => setIsMenuOpen(false)} className="p-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center"><X size={20} strokeWidth={2.5} /></button></div>
        
        <div onClick={() => { setIsProfileModalOpen(true); setIsMenuOpen(false); }} className="bg-white/5 rounded-[32px] p-5 border border-white/10 mb-4 text-center cursor-pointer active:scale-[0.99] group transition-all">
          <div className="w-20 h-20 rounded-2xl bg-blue-500 mx-auto mb-3 overflow-hidden border-2 border-white/20 group-hover:border-white flex items-center justify-center text-4xl font-black">{chequeadorData?.avatar_url ? <img src={chequeadorData.avatar_url} className="w-full h-full object-cover" /> : chequeadorData?.nombre ? chequeadorData.nombre[0].toUpperCase() : <User className="text-white" size={40} />}</div>
          <h3 className="font-black italic text-white uppercase truncate mb-1">{chequeadorData?.nombre || "Cargando..."}</h3>
          <p className="text-[10px] text-blue-300 font-black uppercase tracking-widest mb-3">Chequeador</p>
          <div className="flex justify-center mb-3">
            {chequeadorData?.kyc_verificado ? <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"><CheckCircle size={12} /> Verificado</div> : <div className="bg-amber-500/20 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest animate-pulse"><AlertTriangle size={12} /> Pendiente</div>}
          </div>
        </div>

        <div className="flex-1 space-y-2 mt-2">
          <button onClick={() => { setVistaActiva("inicio"); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-xs uppercase text-left transition-colors ${vistaActiva === "inicio" ? 'bg-white text-[#0D47A1]' : 'bg-white/5 text-white hover:bg-white/10'}`}><LayoutDashboard size={18} /> Panel de Control</button>
          
          <button onClick={() => { setVistaActiva("reportes"); setIsMenuOpen(false); }} className={`flex items-center justify-between w-full p-4 rounded-2xl font-black text-xs uppercase text-left transition-colors ${vistaActiva === "reportes" ? 'bg-white text-[#0D47A1]' : 'bg-white/5 text-white hover:bg-white/10'}`}>
            <div className="flex items-center gap-4"><Inbox size={18} /> Alertas Estudiantes</div>
            {reportes.length > 0 && <span className="bg-red-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px]">{reportes.length}</span>}
          </button>

          <button onClick={() => { setVistaActiva("historico"); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-xs uppercase text-left transition-colors ${vistaActiva === "historico" ? 'bg-white text-[#0D47A1]' : 'bg-white/5 text-white hover:bg-white/10'}`}><ClipboardList size={18} /> Historial Operativo</button>
        </div>
        
        <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full p-5 bg-red-500/10 rounded-[24px] font-black text-red-400 text-[10px] uppercase border border-red-500/20 hover:bg-red-50 hover:text-white transition-all"><LogOut size={16} /> Salir del Sistema</button>
      </div>

      {/* NAVBAR SUPERIOR */}
      <nav className="bg-[#0D47A1] border-b border-white/5 px-6 py-4 flex justify-between items-center relative z-30 shadow-sm text-white">
        <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(true); }} className="bg-white/10 p-2.5 rounded-xl border border-white/10 hover:bg-white/20 transition-colors flex items-center justify-center relative">
          <Menu size={20} />
          {reportes.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0D47A1]"></span>}
        </button>
        
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuAbierto(!menuAbierto)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all select-none border border-white/10">
            <div className="w-6 h-6 bg-[#1566D0] text-white text-[10px] rounded-full flex items-center justify-center font-black overflow-hidden">{chequeadorData?.avatar_url ? <img src={chequeadorData.avatar_url} className="w-full h-full object-cover" /> : chequeadorData?.nombre ? chequeadorData.nombre[0].toUpperCase() : "C"}</div>
            Hola, {chequeadorData?.nombre ? chequeadorData.nombre.split(" ")[0] : "Operador"} <ChevronDown size={14} className={`transition-transform duration-200 ${menuAbierto ? 'rotate-180' : ''}`} />
          </button>

          {menuAbierto && (
            <div className="absolute right-0 mt-2 w-52 bg-[#0D47A1] rounded-2xl shadow-xl border border-white/10 p-2 animate-in fade-in slide-in-from-top-3 duration-200 z-50">
              <div className="px-3 py-2 border-b border-white/5 text-left"><p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Cuenta Activa</p><p className="text-xs font-bold text-white truncate">{chequeadorData?.email}</p></div>
              <div className="space-y-0.5 mt-1.5">
                <button onClick={() => { setVistaActiva("inicio"); setMenuAbierto(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-xs font-bold text-blue-100 hover:bg-white/10 rounded-xl transition-colors"><LayoutDashboard size={14} /> Mi Panel</button>
                <button onClick={() => { setIsProfileModalOpen(true); setMenuAbierto(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-xs font-bold text-blue-100 hover:bg-white/10 rounded-xl transition-colors"><Settings size={14} /> Configuración</button>
              </div>
              <div className="border-t border-white/5 mt-1.5 pt-1.5"><button onClick={handleLogout} className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-xs font-black text-red-400 uppercase tracking-widest hover:bg-red-500/20 rounded-xl transition-colors"><Power size={14} /> Cerrar Sesión</button></div>
            </div>
          )}
        </div>
      </nav>

      {/* --- VISTA MAESTRA CENTRAL --- */}
      <main className="flex-1 px-5 md:px-8 pt-6 pb-32 overflow-y-auto no-scrollbar">
        {!chequeadorData?.kyc_verificado ? (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto">
            <div className="p-5 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-[30px] flex items-center gap-4 text-left"><ShieldAlert size={36} className="shrink-0 text-amber-400" /><div><p className="font-black text-sm uppercase tracking-tight">Verificación Requerida</p><p className="text-xs opacity-80 font-medium">Sube tu documentación KYC para habilitar el control.</p></div></div>
            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center justify-between"><div className="flex items-center gap-3"><div className={`p-3 rounded-2xl ${chequeadorData?.kyc_cedula_url ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'}`}><FileText size={20} /></div><div><h4 className="text-sm font-black uppercase">Cédula de Identidad</h4></div></div>{chequeadorData?.kyc_cedula_url ? <CheckCircle size={20} className="text-emerald-400" /> : <button onClick={() => { setKycTypeActive("cedula"); setShowKycModal(true); }} className="bg-white text-[#1566D0] font-black text-xs uppercase px-4 py-2 rounded-xl">Cargar</button>}</div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center justify-between"><div className="flex items-center gap-3"><div className={`p-3 rounded-2xl ${chequeadorData?.kyc_rostro_url ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'}`}><Smile size={20} /></div><div><h4 className="text-sm font-black uppercase">Foto del Rostro</h4></div></div>{chequeadorData?.kyc_rostro_url ? <CheckCircle size={20} className="text-emerald-400" /> : <button onClick={() => { setKycTypeActive("rostro"); setShowKycModal(true); }} className="bg-white text-[#1566D0] font-black text-xs uppercase px-4 py-2 rounded-xl">Cargar</button>}</div>
            </div>
          </div>
        ) : (
          <>
            {/* 🎯 PESTAÑA 1: INICIO */}
            {vistaActiva === "inicio" && (
              <div className="space-y-6 animate-in slide-in-from-bottom duration-300 max-w-4xl mx-auto">
                
                {/* BOTÓN ALERTA OFICIAL */}
                <div className="bg-gradient-to-r from-red-600 to-red-900 p-6 rounded-[32px] shadow-lg border border-red-500/30 flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="text-center sm:text-left">
                    <h3 className="font-black italic uppercase text-lg text-white">¿Parada Saturada?</h3>
                    <p className="text-red-200 text-sm font-medium mt-1">Envía una alerta oficial a la administración del circuito.</p>
                  </div>
                  <button onClick={enviarAlertaDeSaturacion} disabled={uploading} className="w-full sm:w-auto bg-white text-red-700 px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0">
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <ShieldAlert size={18} />} 
                    Emitir Alerta Oficial
                  </button>
                </div>

                {/* TARJETAS DE UNIDADES EN RUTA */}
                <div className="space-y-4">
                  <h2 className="text-sm font-black text-blue-200 uppercase flex items-center gap-2 tracking-wider"><Bus size={18}/> Unidades en Aproximación</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unidades.length > 0 ? unidades.map((u) => (
                      <div key={u.id} className="bg-[#0D47A1] p-6 rounded-[30px] border border-white/10 flex flex-col gap-4 shadow-xl relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-400"></div>
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-black text-white text-lg leading-tight">{u.chofer}</h3>
                            <p className="text-xs font-bold text-blue-300 uppercase mt-1 tracking-wider">{u.placa} • {u.ruta}</p>
                          </div>
                          <div className="bg-blue-500/20 text-blue-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase animate-pulse border border-blue-500/30">
                            En Tránsito
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center mt-2 pt-4 border-t border-white/5 gap-4">
                          <span className="text-xs text-blue-100 font-bold w-full sm:w-auto text-center sm:text-left bg-white/10 py-2 px-3 rounded-lg">
                            Salida: {u.hora_salida || '--:--'}
                          </span>
                          <button onClick={() => registrarLlegada(u)} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-3 rounded-xl text-xs font-black uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                            <CheckCircle size={16}/> Registrar Llegada
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full text-center py-16 bg-white/5 rounded-[32px] border border-dashed border-white/20">
                        <Bus size={48} className="mx-auto mb-4 text-blue-300 opacity-50" /> 
                        <p className="text-blue-200 font-bold uppercase text-xs tracking-widest opacity-80">Ninguna unidad en ruta actualmente</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 🎯 PESTAÑA 2: REPORTES ESTUDIANTES */}
            {vistaActiva === "reportes" && (
              <div className="space-y-4 animate-in slide-in-from-bottom duration-300 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg sm:text-xl font-black italic uppercase tracking-tight text-amber-400 flex items-center gap-2"><Inbox size={22}/> Buzón de Reportes</h2>
                  <button onClick={() => setVistaActiva("inicio")} className="text-[10px] bg-white/10 px-4 py-2 rounded-xl uppercase font-black hover:bg-white/20 transition-colors">Volver</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportes.length > 0 ? reportes.map((r) => (
                    <div key={r.id} className="bg-[#0D47A1] p-6 rounded-[30px] border border-amber-500/30 shadow-xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4 text-xs">
                          <span className="font-black text-amber-400 uppercase flex items-center gap-1.5"><Users size={16}/> {r.usuario}</span>
                          <span className="font-bold text-blue-200 flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md"><Clock size={12}/> {r.hora}</span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-white mb-6 bg-white/5 p-4 rounded-xl border border-white/5">{r.mensaje}</p>
                      </div>
                      <button onClick={() => atenderReporteEstudiante(r.id)} className="w-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-black py-3.5 rounded-xl uppercase transition-all flex items-center justify-center gap-2 border border-emerald-500/30 active:scale-95">
                        <CheckCircle size={16}/> Marcar Revisado
                      </button>
                    </div>
                  )) : (
                    <div className="col-span-full text-center py-20 text-blue-200 border border-dashed border-amber-500/30 rounded-[32px] bg-amber-500/10">
                      <CheckCircle size={48} className="mx-auto mb-4 opacity-40 text-amber-400" /> 
                      <p className="text-xs uppercase font-bold tracking-widest text-amber-200/80">Todo despejado. No hay reportes.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 🎯 PESTAÑA 3: HISTÓRICO PERMANENTE */}
            {vistaActiva === "historico" && (
              <div className="space-y-6 animate-in slide-in-from-bottom duration-300 text-left max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg sm:text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-2"><ClipboardList size={22}/> Auditoría de Llegadas</h2>
                  <button onClick={() => setVistaActiva("inicio")} className="text-[10px] bg-white/10 px-4 py-2 rounded-xl uppercase font-black hover:bg-white/20 transition-colors">Volver</button>
                </div>
                
                <div className="space-y-3">
                  {recorridos.length > 0 ? recorridos.map((r, index) => (
                    <div key={index} className="bg-[#0D47A1] p-5 sm:p-6 rounded-[30px] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-500/20 p-3.5 rounded-2xl text-emerald-400 shrink-0"><MapPin size={22}/></div>
                        <div>
                          <p className="text-base font-black italic uppercase text-white leading-tight">{r.chofer}</p>
                          <p className="text-[10px] sm:text-xs text-blue-300 font-bold uppercase mt-1 tracking-wider">{r.placa} • {r.ruta}</p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-1 bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-white/5 sm:border-none">
                        <span className="text-xs font-bold text-blue-200">{r.fecha}</span>
                        <div className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                          <Clock size={14} /> LLEGADA: {r.hora_llegada}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-20 text-blue-200 border border-dashed border-white/20 rounded-[32px] bg-white/5">
                      <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-xs uppercase font-bold tracking-widest opacity-80">Bitácora vacía. No hay llegadas registradas hoy.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}