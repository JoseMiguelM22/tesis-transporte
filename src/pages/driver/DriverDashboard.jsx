import React, { useState, useEffect, useRef } from "react";
import { 
  LogOut, Car, Menu, X, User, Camera, Check, Edit2, Loader2, 
  ShieldCheck, CreditCard, Image as ImageIcon, ArrowRight, 
  AlertTriangle, FileText, CheckCircle, Clock, Smile, ChevronDown, 
  LayoutDashboard, Settings, Navigation, MinusCircle, PlusCircle,
  ShieldAlert, CheckCircle2, Power, Users, MessageSquare
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const sidebarRef = useRef(null); 
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const kycInputRef = useRef(null); 
  
  // Estados de Interfaz y Navegación Interna
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false); 
  const [kycTypeActive, setKycTypeActive] = useState(""); 
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false); 
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [loadingPagina, setLoadingPagina] = useState(true); 
  const [vistaActiva, setVistaActiva] = useState("inicio"); 
  const [menuAbierto, setMenuAbierto] = useState(false);

  // 🔥 NUEVOS ESTADOS PARA REPORTES
  const [showReporteModal, setShowReporteModal] = useState(false);
  const [enviandoReporte, setEnviandoReporte] = useState(false);
  const [reporteData, setReporteData] = useState({ tipo: "Suministro de Gasolina", mensaje: "" });

  // Estados de Datos Unificados
  const [choferData, setChoferData] = useState({ 
    id: "", nombre: "", apellido: "", avatar_url: null, cedula: "", telefono: "",
    placa_vehiculo: "", kyc_verificado: false, kyc_cedula_url: null, 
    kyc_vehiculo_url: null, kyc_rostro_url: null, capacidad_total: 4, 
    puestos_libres: 4, estado: "disponible", hora_salida: null 
  });
  const [tempData, setTempData] = useState({ nombre: "", apellido: "" });
  
  const [reservasActivas, setReservasActivas] = useState([]);

  useEffect(() => {
    const inicializarDashboard = async () => {
      setLoadingPagina(true);
      await fetchChofer();
      setLoadingPagina(false);
    };
    inicializarDashboard();

    const manejarClicsExteriores = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAbierto(false);
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", manejarClicsExteriores);
    return () => document.removeEventListener("mousedown", manejarClicsExteriores);
  }, []);

  useEffect(() => {
    if (!choferData?.placa_vehiculo) return;

    const fetchReservas = async () => {
      const { data } = await supabase
        .from('reservas') 
        .select('*')
        .eq('placa_vehiculo', choferData.placa_vehiculo)
        .order('created_at', { ascending: false });
      
      if (data) setReservasActivas(data);
    };
    fetchReservas();

    const channelPuestos = supabase
      .channel('sync-reservas-estudiantes')
      .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'unidades', 
          filter: `numero_unidad=eq.${choferData.placa_vehiculo}` 
        }, 
        (payload) => {
          setChoferData(prev => ({ ...prev, puestos_libres: payload.new.puestos_libres }));
        }
      )
      .subscribe();

    const channelHistorial = supabase
      .channel('sync-historial-reservas')
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'reservas', 
          filter: `placa_vehiculo=eq.${choferData.placa_vehiculo}` 
        }, 
        (payload) => {
          setReservasActivas(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channelPuestos); 
      supabase.removeChannel(channelHistorial); 
    };
  }, [choferData?.placa_vehiculo]);

  const fetchChofer = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        navigate("/acceso-chofer");
        return null;
      }

      const { data, error: dbError } = await supabase
        .from('choferes')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (dbError) throw dbError;

      if (data) {
        setChoferData(data);
        setTempData({ nombre: data.nombre, apellido: data.apellido });
        return data.id;
      }
    } catch (err) {
      console.error("Error cargando sesión del operador:", err.message);
    }
    return null;
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' }); 
      navigate("/");
    } catch (err) { navigate("/"); }
  };

  const updatePuestos = async (nuevoValor) => {
    if (!choferData?.kyc_verificado) return;
    if (nuevoValor < 0 || nuevoValor > choferData.capacidad_total) return;
    
    const { error } = await supabase.from('choferes').update({ puestos_libres: nuevoValor }).eq('id', choferData.id);
      
    try {
      await supabase.from('unidades').update({ puestos_libres: nuevoValor }).eq('numero_unidad', choferData.placa_vehiculo);
    } catch (e) { console.error(e); }

    if (!error) setChoferData({ ...choferData, puestos_libres: nuevoValor });
  };

  const toggleRuta = async () => {
    if (!choferData?.kyc_verificado) return;
    const nuevoEstado = choferData.estado === 'disponible' ? 'en ruta' : 'disponible';
    const nuevaHora = nuevoEstado === 'en ruta' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
    
    const { error } = await supabase.from('choferes').update({ estado: nuevoEstado, hora_salida: nuevaHora }).eq('id', choferData.id);
      
    try {
      const { data: unidadExistente } = await supabase.from('unidades').select('id').eq('numero_unidad', choferData.placa_vehiculo).maybeSingle();

      if (unidadExistente) {
        await supabase.from('unidades').update({
          estado: nuevoEstado,
          hora_salida: nuevaHora,
          puestos_libres: choferData.puestos_libres,
          capacidad_total: choferData.capacidad_total
        }).eq('id', unidadExistente.id);
      } else {
        await supabase.from('unidades').insert([{
          numero_unidad: choferData.placa_vehiculo,
          capacidad_total: choferData.capacidad_total,
          puestos_libres: choferData.puestos_libres,
          hora_salida: nuevaHora,
          estado: nuevoEstado
        }]);
      }
    } catch(e) {
      console.error("Error sincronizando unidades:", e);
    }

    if (!error) setChoferData({ ...choferData, estado: nuevoEstado, hora_salida: nuevaHora });
  };

  // 🔥 NUEVA FUNCIÓN: ELIMINA AL ESTUDIANTE DE LA LISTA AL SUBIR AL BUS
  const marcarComoAbordado = async (reservaId) => {
    try {
      // Borramos de la BD para limpiar la lista
      await supabase.from('reservas').delete().eq('id', reservaId);
      // Borramos del estado visual al instante
      setReservasActivas(prev => prev.filter(r => r.id !== reservaId));
    } catch(e) {
      console.error("Error al marcar como abordado", e);
    }
  };

  // 🔥 NUEVA FUNCIÓN: ENVÍA REPORTE AL CHEQUEADOR
  const enviarReporteOperativo = async () => {
    setEnviandoReporte(true);
    try {
      const { error } = await supabase.from('reportes_operativos').insert([{
        placa_vehiculo: choferData.placa_vehiculo,
        tipo_reporte: reporteData.tipo,
        mensaje: reporteData.mensaje,
        emisor: `${choferData.nombre} ${choferData.apellido}`
      }]);
      if (error) throw error;
      
      alert("¡Reporte de incidencia enviado con éxito al chequeador!");
      setShowReporteModal(false);
      setReporteData({ tipo: "Suministro de Gasolina", mensaje: "" });
    } catch (err) {
      alert("Hubo un error enviando el reporte: " + err.message);
    } finally {
      setEnviandoReporte(false);
    }
  };

  const handleUploadFile = async (file, bucketKey, updateField) => {
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${bucketKey}-${choferData.id}-${Date.now()}.${fileExt}`;
      const filePath = `kyc_choferes/${fileName}`;

      const { error: upErr } = await supabase.storage.from('carnets').upload(filePath, file);
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('carnets').getPublicUrl(filePath);
      
      const updates = { [updateField]: publicUrl };
      if (bucketKey !== 'avatar') {
        updates.kyc_verificado = false; 
      }

      const { error: dbErr } = await supabase.from('choferes').update(updates).eq('id', choferData.id);
      if (dbErr) throw dbErr;

      setChoferData(prev => ({ ...prev, ...updates }));
      alert(`Archivo de ${bucketKey.toUpperCase()} procesado correctamente.`);
      setShowKycModal(false);
    } catch (e) { 
      alert("Error en proceso: " + e.message); 
    } finally { 
      setUploading(false); 
      setShowPhotoOptions(false); 
      stopCamera(); 
    }
  };

  const startCamera = async () => {
    setShowPhotoOptions(false);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: kycTypeActive === "rostro" || kycTypeActive === "avatar" ? "user" : "environment" } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { 
      alert("Sin acceso a cámara."); 
      setShowCamera(false); 
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth; 
    canvasRef.current.height = videoRef.current.videoHeight;
    
    if (kycTypeActive === "rostro" || kycTypeActive === "avatar") {
      context.translate(canvasRef.current.width, 0); 
      context.scale(-1, 1);
    }
    
    context.drawImage(videoRef.current, 0, 0);
    canvasRef.current.toBlob(async (blob) => {
      const file = new File([blob], "kyc_capture.png", { type: "image/png" });
      
      if (kycTypeActive === "avatar") {
        await handleUploadFile(file, 'avatar', 'avatar_url');
      } else {
        const campoDB = kycTypeActive === "cedula" ? "kyc_cedula_url" : kycTypeActive === "vehiculo" ? "kyc_vehiculo_url" : "kyc_rostro_url";
        await handleUploadFile(file, kycTypeActive, campoDB);
      }
    }, 'image/png');
  };

  const handleUpdateNames = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('choferes').update(tempData).eq('id', choferData.id);
    if (!error) { setChoferData(prev => ({ ...prev, ...tempData })); setIsEditing(false); }
    setIsSaving(false);
  };

  const totalSubidos = [choferData?.kyc_cedula_url, choferData?.kyc_vehiculo_url, choferData?.kyc_rostro_url].filter(Boolean).length;

  if (loadingPagina) {
    return (
      <div className="min-h-screen bg-[#1566D0] flex flex-col items-center justify-center text-white font-black italic gap-4">
        <Loader2 className="animate-spin w-10 h-10" />
        <span className="tracking-widest text-xs uppercase">Sincronizando Sistema...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1566D0] font-sans text-white flex flex-col relative overflow-hidden text-left">
      
      {/* --- MODAL DE REPORTES INCIDENCIAS --- */}
      {showReporteModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0A1D3D]/90 backdrop-blur-sm" onClick={() => setShowReporteModal(false)}></div>
          <div className="relative bg-white text-[#0D47A1] w-full max-w-sm rounded-[38px] shadow-2xl p-8 animate-in zoom-in duration-200 text-left">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-orange-500" size={24} />
                <h3 className="text-lg font-black italic uppercase leading-none">Reporte Operativo</h3>
              </div>
              <button onClick={() => setShowReporteModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={16}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-blue-400">Tipo de Incidencia</label>
                <select 
                  value={reporteData.tipo} 
                  onChange={e => setReporteData({...reporteData, tipo: e.target.value})}
                  className="w-full bg-gray-50 border-2 border-blue-50 rounded-xl px-4 py-3 font-bold text-slate-700 mt-1 focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="Suministro de Gasolina">⛽ Suministro de Gasolina</option>
                  <option value="Falla Mecánica">🔧 Falla Mecánica</option>
                  <option value="Retraso en Vía">🚦 Retraso / Tráfico Pesado</option>
                  <option value="Incidencia con Pasajero">⚠️ Incidencia con Pasajero</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-blue-400">Detalles adicionales</label>
                <textarea 
                  value={reporteData.mensaje}
                  onChange={e => setReporteData({...reporteData, mensaje: e.target.value})}
                  rows="3"
                  placeholder="Ej: Estoy en la bomba Maraven, demoro 40 minutos..."
                  className="w-full bg-gray-50 border-2 border-blue-50 rounded-xl px-4 py-3 font-bold text-slate-700 mt-1 resize-none focus:ring-2 focus:ring-orange-500 outline-none"
                ></textarea>
              </div>
              <button 
                onClick={enviarReporteOperativo} 
                disabled={enviandoReporte || !reporteData.mensaje}
                className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {enviandoReporte ? <Loader2 className="animate-spin mx-auto" /> : "Enviar al Chequeador"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CÁMARA EN VIVO */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center p-6">
          <button onClick={stopCamera} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full hover:bg-white/20 text-white shadow-xl"><X size={28} /></button>
          <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-[75vh] rounded-[32px] border-4 border-white object-cover" />
          <button onClick={capturePhoto} className="mt-6 p-6 bg-white text-[#1566D0] rounded-full shadow-2xl active:scale-95 transition-all">
            <Camera size={32} />
          </button>
        </div>
      )}

      {/* MODAL TRIPLE SELECCIÓN KYC */}
      {showKycModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0A1D3D]/90 backdrop-blur-sm" onClick={() => !uploading && setShowKycModal(false)}></div>
          <div className="relative bg-[#0D47A1] text-white w-full max-w-sm rounded-[38px] shadow-2xl p-8 border border-white/10 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2 text-blue-300">
                <FileText size={20} />
                <h3 className="text-sm font-black uppercase tracking-wider">Subir {kycTypeActive.toUpperCase()}</h3>
              </div>
              <button disabled={uploading} onClick={() => setShowKycModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><X size={16}/></button>
            </div>
            
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-2xl flex gap-3 text-left">
              <AlertTriangle size={18} className="shrink-0 text-amber-400" />
              <p className="text-[11px] font-medium leading-relaxed">
                {kycTypeActive === "cedula" && "Sube una foto legible de tu cédula de identidad nacional."}
                {kycTypeActive === "vehiculo" && `Captura tu unidad donde se distinga claramente la placa: [${choferData?.placa_vehiculo || "N/A"}].`}
                {kycTypeActive === "rostro" && "Tómate una selfie frontal despejada para validar tu perfil."}
              </p>
            </div>

            {uploading ? (
              <div className="text-center py-10 space-y-3">
                <Loader2 className="animate-spin text-orange-400 mx-auto" size={32} />
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Subiendo Requisito...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <button onClick={startCamera} className="w-full bg-white/5 hover:bg-blue-600 border border-white/10 text-white p-5 rounded-2xl flex items-center justify-between group transition-all">
                  <div className="flex flex-col text-left"><span className="text-sm font-black uppercase tracking-wide">Capturar Foto</span><span className="text-[10px] text-blue-300 font-bold uppercase">Usar cámara integrada</span></div>
                  <Camera size={20} className="text-blue-400 group-hover:text-white" />
                </button>
                <button onClick={() => kycInputRef.current.click()} className="w-full bg-white/5 hover:bg-blue-600 border border-white/10 text-white p-5 rounded-2xl flex items-center justify-between group transition-all">
                  <div className="flex flex-col text-left"><span className="text-sm font-black uppercase tracking-wide">Cargar de Archivos</span><span className="text-[10px] text-blue-300 font-bold uppercase">Formatos: JPG, PNG</span></div>
                  <ImageIcon size={20} className="text-blue-400 group-hover:text-white" />
                </button>
              </div>
            )}
            <input type="file" ref={kycInputRef} className="hidden" accept="image/*" onChange={(e) => {
              const campoDB = kycTypeActive === "cedula" ? "kyc_cedula_url" : kycTypeActive === "vehiculo" ? "kyc_vehiculo_url" : "kyc_rostro_url";
              handleUploadFile(e.target.files[0], kycTypeActive, campoDB);
            }} />
          </div>
        </div>
      )}

      {/* MODAL PERFIL COMPLETO */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0D47A1]/80 backdrop-blur-xl" onClick={() => !showCamera && setIsProfileModalOpen(false)}></div>
          <div className="relative bg-white text-[#0D47A1] w-full max-w-sm rounded-[45px] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="bg-[#1566D0] p-8 pb-24 text-white relative">
              <button onClick={() => { stopCamera(); setIsProfileModalOpen(false); }} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={20} /></button>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Mi Perfil Operador</h2>
            </div>
            <div className="px-8 pb-10 -mt-20 text-center">
              <div className="relative w-40 h-40 mx-auto mb-6">
                <div className="w-40 h-40 rounded-[38px] bg-gray-100 overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center">
                  {choferData?.avatar_url ? <img src={choferData.avatar_url} className="w-full h-full object-cover" /> : <User size={60} className="text-blue-200" />}
                  {uploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-[38px]"><Loader2 className="animate-spin" /></div>}
                </div>
                <div className="absolute -bottom-2 -right-2 flex flex-col items-end">
                  {showPhotoOptions && (
                    <div className="bg-white rounded-2xl shadow-2xl p-2 mb-2 border border-gray-100 flex flex-col gap-1 z-10 text-left">
                      <button onClick={() => { setKycTypeActive("avatar"); startCamera(); }} className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded-xl text-[10px] font-black uppercase"><Camera size={14} /> Cámara</button>
                      <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded-xl text-[10px] font-black uppercase"><ImageIcon size={14} /> Galería</button>
                    </div>
                  )}
                  <button onClick={() => setShowPhotoOptions(!showPhotoOptions)} className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl hover:scale-110 transition-all"><Camera size={20} /></button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleUploadFile(e.target.files[0], 'avatar', 'avatar_url')} />
              </div>
              
              <div className="space-y-6">
                {isEditing ? (
                  <div className="space-y-3">
                    <input className="w-full bg-gray-50 border-2 border-blue-50 rounded-xl px-4 py-2 font-bold text-slate-800" value={tempData.nombre} onChange={e => setTempData({...tempData, nombre: e.target.value})} />
                    <input className="w-full bg-gray-50 border-2 border-blue-50 rounded-xl px-4 py-2 font-bold text-slate-800" value={tempData.apellido} onChange={e => setTempData({...tempData, apellido: e.target.value})} />
                    <button onClick={handleUpdateNames} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-black text-[10px] uppercase transition-all">{isSaving ? "Guardando..." : "Confirmar"}</button>
                  </div>
                ) : (
                  <>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase text-blue-400 mb-1">Conductor</p>
                      <h3 className="text-2xl font-black italic uppercase leading-none">
                        {choferData?.nombre || "Cargando..."} {choferData?.apellido || ""}
                      </h3>
                    </div>
                    <div className="text-left grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
                      <div>CÉDULA: <span className="text-slate-800">{choferData?.cedula || "N/A"}</span></div>
                      <div>PLACA: <span className="text-slate-800">{choferData?.placa_vehiculo || "N/A"}</span></div>
                    </div>
                    <button onClick={() => setIsEditing(true)} className="w-full bg-gray-50 text-[#0D47A1] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"><Edit2 size={14} /> Editar Datos</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- BACKDROP GRIS DE FONDO CUANDO EL SIDEBAR ESTÁ ABIERTO --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-300" />
      )}

      {/* --- SIDEBAR DESPLEGABLE CHOFER --- */}
      <div 
        ref={sidebarRef} 
        className={`fixed inset-y-0 left-0 w-80 bg-[#0D47A1] z-50 transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-500 flex flex-col p-8 shadow-2xl border-r border-white/5`}
      >
        <div className="flex justify-between items-center mb-6">
          <CreditCard size={20} className="text-blue-300" />
          <button 
            onClick={() => setIsMenuOpen(false)} 
            className="p-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        
        <div onClick={() => { setIsProfileModalOpen(true); setIsMenuOpen(false); }} className="bg-white/5 rounded-[32px] p-5 border border-white/10 mb-4 text-center cursor-pointer active:scale-[0.99] group transition-all">
          <div className="w-20 h-20 rounded-2xl bg-blue-500 mx-auto mb-3 overflow-hidden border-2 border-white/20 group-hover:border-white">
            {choferData?.avatar_url ? <img src={choferData.avatar_url} className="w-full h-full object-cover" /> : <User className="m-auto mt-4 text-white" size={40} />}
          </div>
          <h3 className="font-black italic text-white uppercase truncate mb-3 leading-none">{choferData?.nombre || "Operador"}</h3>
          <button className="w-full py-2 bg-white text-[#0D47A1] rounded-xl font-black text-[10px] uppercase tracking-widest">Configurar Cuenta</button>
        </div>

        {/* MONITOR ADJUNTO DE TRIPLE VERIFICACIÓN */}
        <div className="bg-[#0a1d3d]/60 backdrop-blur-md p-5 rounded-[28px] border border-white/5 mb-6 text-left">
          <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-3">🔐 Auditoría Operativa</p>
          {choferData?.kyc_verificado ? (
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase"><CheckCircle size={14} /><span>Línea Validada ✔</span></div>
          ) : totalSubidos === 3 ? (
            <div className="bg-orange-500/20 border border-orange-500/30 text-orange-300 p-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase italic animate-pulse"><Loader2 size={14} className="animate-spin" /><span>Evaluación Pendiente</span></div>
          ) : (
            <div className="text-amber-400 text-[10px] font-black uppercase flex items-center gap-2 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              <AlertTriangle size={14} /><span>Progreso: {totalSubidos}/3 Fotos</span>
            </div>
          )}
        </div>

        {/* ENLACES PRIVADOS SIDEBAR */}
        <div className="flex-1 space-y-2">
          <button onClick={() => { setVistaActiva("inicio"); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-[10px] uppercase text-left transition-colors ${vistaActiva === "inicio" ? 'bg-white text-[#0D47A1]' : 'bg-white/5 text-white hover:bg-white/10'}`}><LayoutDashboard size={18} /> Controles de Ruta</button>
          
          <button onClick={() => { setVistaActiva("reservas"); setIsMenuOpen(false); }} className={`w-full flex items-center justify-between p-4 rounded-2xl font-black text-[10px] uppercase text-left transition-colors ${vistaActiva === "reservas" ? 'bg-white text-[#0D47A1]' : 'bg-white/5 text-white hover:bg-white/10'}`}>
            <div className="flex items-center gap-4"><Users size={18} /> Pasajeros A Bordo</div>
            {reservasActivas.length > 0 && <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full">{reservasActivas.length}</span>}
          </button>
          
          <button onClick={() => { setVistaActiva("historico"); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-[10px] uppercase text-left transition-colors ${vistaActiva === "historico" ? 'bg-white text-[#0D47A1]' : 'bg-white/5 text-white hover:bg-white/10'}`}><Clock size={18} /> Historial de Trayectos</button>
        </div>
        
        <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full p-5 bg-red-500/10 rounded-[24px] font-black text-red-400 text-[10px] uppercase border border-red-500/20 hover:bg-red-50 hover:text-white transition-all"><LogOut size={16} /> Salir del Sistema</button>
      </div>

      {/* NAVBAR SUPERIOR PRINCIPAL */}
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center relative z-30 shadow-sm text-slate-800">
        <button 
          onClick={(e) => {
            e.stopPropagation(); 
            setIsMenuOpen(true);
          }} 
          className="bg-slate-100 p-2.5 rounded-xl border border-slate-200/50 hover:bg-slate-200 text-[#0D47A1] transition-colors flex items-center justify-center"
        >
          <Menu size={20} />
        </button>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider text-slate-700 transition-all active:scale-95 select-none"
          >
            <div className="w-5 h-5 bg-[#0D47A1] text-white text-[10px] rounded-full flex items-center justify-center font-black overflow-hidden relative">
              {choferData?.avatar_url ? <img src={choferData.avatar_url} className="w-full h-full object-cover" /> : choferData?.nombre ? choferData.nombre[0].toUpperCase() : "U"}
              {reservasActivas.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>}
            </div>
            Hola, {choferData?.nombre ? choferData.nombre.split(" ")[0] : "Operador"} <ChevronDown size={14} className={`transition-transform duration-200 ${menuAbierto ? 'rotate-180' : ''}`} />
          </button>

          {/* MENU DESPLEGABLE SUPERIOR */}
          {menuAbierto && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-3 duration-200 z-50">
              <div className="px-3 py-2 border-b border-slate-50 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operador Activo</p>
                <p className="text-xs font-bold text-slate-700 truncate">{choferData?.email || "correo@unefa.edu"}</p>
              </div>
              
              <div className="space-y-0.5 mt-1.5">
                <button onClick={() => { setVistaActiva("inicio"); setMenuAbierto(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                  <LayoutDashboard size={14} className="text-slate-400" /> Mi Panel
                </button>
                
                <button onClick={() => { setVistaActiva("reservas"); setMenuAbierto(false); }} className="w-full flex items-center justify-between text-left px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3"><Users size={14} className="text-slate-400" /> Pasajeros a bordo</div>
                  {reservasActivas.length > 0 && <span className="bg-orange-100 text-orange-600 text-[9px] px-2 py-0.5 rounded-full font-black">{reservasActivas.length}</span>}
                </button>

                <button onClick={() => { setIsProfileModalOpen(true); setMenuAbierto(false); }} className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                  <Settings size={14} className="text-slate-400" /> Configuración
                </button>
              </div>

              <div className="border-t border-slate-50 mt-1.5 pt-1.5">
                <button 
                  onClick={handleLogout} 
                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Power size={14} /> Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* --- VISTA MAESTRA CENTRAL --- */}
      <main className="flex-1 px-8 pt-8 pb-48 overflow-y-auto no-scrollbar">
        
        {/* BLOQUEO EN CALIENTE: INTERFAZ MÚLTIPLE DE CARGA KYC */}
        {!choferData?.kyc_verificado ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-5 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-[30px] flex items-center gap-4 text-left">
              <ShieldAlert size={36} className="shrink-0 text-amber-400" />
              <div>
                <p className="font-black text-xs uppercase tracking-tight">Acceso Bloqueado</p>
                <p className="text-[11px] opacity-80 font-medium">Debes completar el triple envío para que la administración del circuito te habilite en los tableros de reservas.</p>
              </div>
            </div>

            <div className="bg-[#0D47A1] border border-white/10 rounded-3xl p-5 space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-blue-200">
                <span>Fotografías Reglamentarias</span>
                <span>{totalSubidos} de 3 Cargadas</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(totalSubidos / 3) * 100}%` }}></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${choferData?.kyc_cedula_url ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'}`}><FileText size={20} /></div>
                  <div><h4 className="text-xs font-black uppercase">Cédula del Conductor</h4><p className="text-[10px] text-blue-200">Foto nítida del documento.</p></div>
                </div>
                {choferData?.kyc_cedula_url ? <CheckCircle size={20} className="text-emerald-400" /> : <button onClick={() => { setKycTypeActive("cedula"); setShowKycModal(true); }} className="bg-white text-[#1566D0] font-black text-[10px] uppercase px-4 py-2 rounded-xl">Cargar</button>}
              </div>

              <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${choferData?.kyc_vehiculo_url ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'}`}><Car size={20} /></div>
                  <div><h4 className="text-xs font-black uppercase">Unidad Operativa</h4><p className="text-[10px] text-blue-200">Debe verse la placa: {choferData?.placa_vehiculo || "N/A"}</p></div>
                </div>
                {choferData?.kyc_vehiculo_url ? <CheckCircle size={20} className="text-emerald-400" /> : <button onClick={() => { setKycTypeActive("vehiculo"); setShowKycModal(true); }} className="bg-white text-[#1566D0] font-black text-[10px] uppercase px-4 py-2 rounded-xl">Cargar</button>}
              </div>

              <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${choferData?.kyc_rostro_url ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'}`}><Smile size={20} /></div>
                  <div><h4 className="text-xs font-black uppercase">Foto del Rostro</h4><p className="text-[10px] text-blue-200">Selfie de frente tipo carnet.</p></div>
                </div>
                {choferData?.kyc_rostro_url ? <CheckCircle size={20} className="text-emerald-400" /> : <button onClick={() => { setKycTypeActive("rostro"); setShowKycModal(true); }} className="bg-white text-[#1566D0] font-black text-[10px] uppercase px-4 py-2 rounded-xl">Cargar</button>}
              </div>
            </div>

            {totalSubidos === 3 && (
              <div className="p-4 bg-orange-500/20 border border-orange-500/40 text-orange-200 text-xs font-bold rounded-2xl uppercase tracking-wide text-center animate-pulse">
                ⏳ Documentación completa. En revisión administrativa.
              </div>
            )}
          </div>
        ) : (
          /* VISTA OPERATIVA ACTIVADA CUANDO KYC ES TRUE */
          <>
            {vistaActiva === "inicio" && (
              <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
                <div className={`bg-gradient-to-br ${choferData?.estado === 'en ruta' ? 'from-orange-500 to-red-600' : 'from-[#2979FF] to-[#1566D0]'} rounded-[45px] p-9 shadow-2xl relative border border-white/10 transition-colors duration-500 text-left`}>
                  <Car className="absolute -right-6 -bottom-6 w-48 h-48 opacity-10 rotate-12" />
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Unidad de Transporte Activa</p>
                    <h2 className="text-4xl font-black italic tracking-tighter mb-6 uppercase leading-none">PLACA: {choferData?.placa_vehiculo}</h2>
                    <div className="flex gap-4">
                      <div className="bg-white/15 px-5 py-3 rounded-2xl flex-1 text-center"><p className="text-[9px] font-black uppercase opacity-60 mb-1">Estado</p><p className="text-sm font-black italic uppercase tracking-wider">{choferData?.estado}</p></div>
                      <div className="bg-white/15 px-5 py-3 rounded-2xl flex-1 text-center"><p className="text-[9px] font-black uppercase opacity-60 mb-1">Salida registrada</p><p className="text-sm font-black italic">{choferData?.hora_salida || '--:--'}</p></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white text-[#0D47A1] rounded-[40px] p-8 shadow-2xl flex flex-col items-center">
                  <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">Puestos Libres Disponibles</p>
                  <div className="flex items-center gap-8 mb-4">
                    <button onClick={() => updatePuestos(choferData.puestos_libres - 1)} className="text-slate-200 hover:text-red-500 transition-colors active:scale-90"><MinusCircle size={56} strokeWidth={1.5} /></button>
                    <div className="text-center">
                      <span className="text-7xl font-black italic leading-none">{choferData?.puestos_libres}</span>
                      <p className="text-[9px] font-black text-slate-400 uppercase mt-1">De {choferData?.capacidad_total} Totales</p>
                    </div>
                    <button onClick={() => updatePuestos(choferData.puestos_libres + 1)} className="text-slate-200 hover:text-green-500 transition-colors active:scale-90"><PlusCircle size={56} strokeWidth={1.5} /></button>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0D47A1] transition-all duration-500" style={{ width: `${(choferData?.puestos_libres / choferData?.capacidad_total) * 100}%` }}></div>
                  </div>
                </div>

                {/* 🔥 BOTÓN PARA REPORTAR INCIDENCIAS */}
                <button 
                  onClick={() => setShowReporteModal(true)} 
                  className="w-full bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 text-orange-400 rounded-[30px] p-5 shadow-sm flex items-center justify-between transition-all active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-orange-500/20 p-3 rounded-2xl"><AlertTriangle size={24} /></div>
                    <div className="text-left">
                      <h4 className="text-sm font-black uppercase">Reportar Incidencia</h4>
                      <p className="text-[10px] font-bold opacity-80">Gasolina, averías, retrasos</p>
                    </div>
                  </div>
                  <ArrowRight size={20} />
                </button>
              </div>
            )}

            {/* 🔥 VISTA: LISTA DE ESTUDIANTES RESERVADOS CON BOTÓN ABORDÓ 🔥 */}
            {vistaActiva === "reservas" && (
              <div className="space-y-4 animate-in slide-in-from-bottom duration-300 text-left">
                <div className="flex justify-between items-center px-2">
                  <h2 className="text-xl font-black italic uppercase tracking-tight">Pasajeros a Bordo</h2>
                  <button onClick={() => setVistaActiva("inicio")} className="text-[10px] bg-white/10 px-3 py-1.5 rounded-xl uppercase font-black hover:bg-white/20">Volver</button>
                </div>
                
                {reservasActivas.length === 0 ? (
                  <div className="bg-white/5 p-8 rounded-[30px] border border-white/10 text-center text-blue-200 mt-6 shadow-inner">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-sm font-bold uppercase tracking-widest">Sin reservas pendientes</p>
                    <p className="text-[10px] mt-2 opacity-70">Los estudiantes que reserven su cupo aparecerán aquí en tiempo real.</p>
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {reservasActivas.map((reserva, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-[24px] shadow-xl flex items-center justify-between text-[#0D47A1] animate-in fade-in duration-300">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-100 p-3 rounded-full text-blue-600"><User size={20}/></div>
                          <div>
                            <p className="text-sm font-black uppercase leading-tight">{reserva.nombre_estudiante || "Estudiante Unefista"}</p>
                            <p className="text-[10px] font-bold text-slate-400">C.I: {reserva.cedula_estudiante || "N/A"}</p>
                            <p className="text-[10px] font-black text-orange-500 uppercase mt-1">
                              Asientos reservados: {reserva.puestos || 1}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <button 
                            onClick={() => marcarComoAbordado(reserva.id)}
                            className="bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1"
                          >
                            <CheckCircle2 size={14} /> Abordó
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {vistaActiva === "historico" && (
              <div className="space-y-4 animate-in slide-in-from-bottom duration-300 text-left">
                <div className="flex justify-between items-center px-2"><h2 className="text-xl font-black italic uppercase tracking-tight">Historial de Recorridos</h2><button onClick={() => setVistaActiva("inicio")} className="text-[10px] bg-white/10 px-3 py-1.5 rounded-xl uppercase font-black">Volver</button></div>
                <div className="bg-[#0D47A1] p-6 rounded-[30px] border border-white/10 flex items-center justify-between shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-500/20 p-3 rounded-2xl text-emerald-400"><CheckCircle size={24}/></div>
                    <div><p className="text-sm font-black italic uppercase">Ruta Maraven - Centro</p><p className="text-[10px] text-blue-300 font-bold uppercase">Estatus: Finalizado con éxito</p></div>
                  </div>
                  <div className="text-right text-[10px] font-bold text-white/60"><Clock size={12} className="inline mr-1 opacity-60"/>{new Date().toLocaleDateString()}</div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* --- SECTOR INFERIOR DE ACCIÓN (DISPARADOR DE RUTA) --- */}
      {vistaActiva === "inicio" && choferData?.kyc_verificado && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1566D0] via-[#1566D0] to-transparent pt-16 z-30 flex flex-col">
          <button 
            onClick={toggleRuta}
            className={`w-full py-6 rounded-[32px] font-black text-xl shadow-2xl uppercase italic flex items-center justify-center gap-4 transition-all ${
              choferData.estado === 'en ruta' 
                ? 'bg-orange-500 text-white border-4 border-white/20 active:scale-95'
                : 'bg-white text-[#1566D0] active:scale-95' 
            }`}
          >
            {choferData.estado === 'disponible' ? <Navigation size={24} /> : <CheckCircle size={24} />}
            {choferData.estado === 'disponible' ? "Iniciar Trayecto de Ruta" : "Finalizar Trayecto"}
          </button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}