import React, { useState, useEffect, useRef } from "react";
import { 
  LogOut, Car, Menu, X, User, Camera, Check, Edit2, Loader2, 
  ShieldCheck, CreditCard, Image as ImageIcon, ArrowRight, 
  AlertTriangle, FileText, CheckCircle, Clock, Smile, ChevronDown, 
  LayoutDashboard, Settings, Navigation, MinusCircle, PlusCircle,
  ShieldAlert, CheckCircle2, Power, Users, MessageSquare, Send, MapPin, ListOrdered, Calendar, UserMinus
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

  const [showReporteModal, setShowReporteModal] = useState(false);
  const [enviandoReporte, setEnviandoReporte] = useState(false);
  const [reporteData, setReporteData] = useState({ tipo: "Suministro de Gasolina", mensaje: "" });

  const [showAvisoModal, setShowAvisoModal] = useState(false);
  const [reservaActiva, setReservaActiva] = useState(null);
  const [avisoData, setAvisoData] = useState({ estado: "Confirmado", mensaje: "" });
  const [enviandoAviso, setEnviandoAviso] = useState(false);

  const [choferData, setChoferData] = useState({ 
    id: "", nombre: "", apellido: "", avatar_url: null, cedula: "", telefono: "",
    placa_vehiculo: "", kyc_verificado: false, kyc_cedula_url: null, 
    kyc_vehiculo_url: null, kyc_rostro_url: null, capacidad_total: 4, 
    puestos_libres: 4, estado: "disponible", hora_salida: null, ruta: "Maraven - Centro", alerta_admin: null 
  });
  const [tempData, setTempData] = useState({ nombre: "", apellido: "" });
  
  const [reservasActivas, setReservasActivas] = useState([]);
  const [historialViajes, setHistorialViajes] = useState([]); 

  useEffect(() => {
    const inicializarDashboard = async () => {
      setLoadingPagina(true);
      await fetchUser();
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
    if (!choferData?.placa_vehiculo || !choferData?.id) return;

    const fetchDataOperativa = async () => {
      const { data: resData } = await supabase
        .from('reservas') 
        .select('*')
        .eq('placa_vehiculo', choferData.placa_vehiculo)
        .order('created_at', { ascending: false });
      if (resData) setReservasActivas(resData);

      const { data: histData } = await supabase
        .from('historial_recorridos')
        .select('*')
        .eq('placa', choferData.placa_vehiculo)
        .order('created_at', { ascending: false });
      
      if (histData) setHistorialViajes(histData);
    };
    fetchDataOperativa();

    // 🔥 SUSCRIPCIÓN BLINDADA A LA TABLA CHOFERES (Actualiza Puestos Libres, Alertas Admin y KYC en tiempo real)
    const channelChofer = supabase
      .channel('sync-chofer-puestos-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'choferes', filter: `id=eq.${choferData.id}` }, 
        (payload) => {
          setChoferData(prev => ({ 
            ...prev, 
            puestos_libres: payload.new.puestos_libres,
            alerta_admin: payload.new.alerta_admin,
            kyc_verificado: payload.new.kyc_verificado // 🔥 Desbloquea la pantalla automáticamente si el admin lo aprueba
          }));
        }
      ).subscribe();

    const channelReservas = supabase
      .channel('sync-reservas-chofer-lista')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas', filter: `placa_vehiculo=eq.${choferData.placa_vehiculo}` }, 
        (payload) => {
          if (payload.eventType === 'INSERT') setReservasActivas(prev => [payload.new, ...prev]);
          else if (payload.eventType === 'DELETE') setReservasActivas(prev => prev.filter(r => r.id !== payload.old.id));
          else if (payload.eventType === 'UPDATE') setReservasActivas(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
        }
      ).subscribe();

    return () => { 
      supabase.removeChannel(channelChofer); 
      supabase.removeChannel(channelReservas); 
    };
  }, [choferData?.placa_vehiculo, choferData?.id]);

  const fetchUser = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { navigate("/acceso-chofer"); return null; }

      const { data, error: dbError } = await supabase.from('choferes').select('*').eq('id', user.id).maybeSingle();
      if (dbError) throw dbError;
      if (data) {
        setChoferData(data);
        setTempData({ nombre: data.nombre, apellido: data.apellido });
        return data.id;
      }
    } catch (err) { console.error("Error cargando sesión:", err.message); }
    return null;
  };

  const handleLogout = async () => {
    try { await supabase.auth.signOut({ scope: 'local' }); navigate("/"); } 
    catch (err) { navigate("/"); }
  };

  const updatePuestos = async (nuevoValor) => {
    if (!choferData?.kyc_verificado || nuevoValor < 0 || nuevoValor > choferData.capacidad_total) return;
    setChoferData(prev => ({ ...prev, puestos_libres: nuevoValor }));
    const { error } = await supabase.from('choferes').update({ puestos_libres: nuevoValor }).eq('id', choferData.id);
    try { await supabase.from('unidades').update({ puestos_libres: nuevoValor }).eq('numero_unidad', choferData.placa_vehiculo); } catch (e) { console.error(e); }
  };

  const toggleRuta = async () => {
    if (!choferData?.kyc_verificado) return;
    
    const estadoActual = choferData.estado;
    const nuevoEstado = estadoActual === 'disponible' ? 'en ruta' : 'disponible';
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nuevaHoraSalida = nuevoEstado === 'en ruta' ? horaActual : null;

    try {
      if (nuevoEstado === 'disponible') {
        const pasajerosLlevados = choferData.capacidad_total - choferData.puestos_libres;
        
        const { data: nuevoRegistro, error: histError } = await supabase.from('historial_recorridos').insert([{
          chofer_id: choferData.id,
          placa: choferData.placa_vehiculo, 
          chofer_nombre: `${choferData.nombre} ${choferData.apellido}`, 
          ruta: choferData.ruta || "Ruta General",
          hora_salida: choferData.hora_salida || "--:--",
          hora_llegada: horaActual,
          pasajeros_transportados: pasajerosLlevados,
          fecha: new Date().toISOString().split('T')[0] 
        }]).select().single();

        if (histError) {
          console.error("Error en Supabase:", histError);
          alert(`¡Trayecto finalizado con ${pasajerosLlevados} pasajeros!\nNota: Ocurrió un error guardando el historial: ${histError.message}`);
        } else if (nuevoRegistro) {
          setHistorialViajes(prev => [nuevoRegistro, ...prev]);
          alert(`¡Trayecto finalizado con éxito!\nPasajeros transportados: ${pasajerosLlevados}`);
        }

        await supabase.from('reservas').delete().eq('placa_vehiculo', choferData.placa_vehiculo);
        setReservasActivas([]);
      }

      const puestosNuevos = nuevoEstado === 'disponible' ? choferData.capacidad_total : choferData.puestos_libres;

      await supabase.from('choferes').update({ 
        estado: nuevoEstado, 
        hora_salida: nuevaHoraSalida,
        puestos_libres: puestosNuevos
      }).eq('id', choferData.id);
        
      const { data: unidadExistente } = await supabase.from('unidades').select('id').eq('numero_unidad', choferData.placa_vehiculo).maybeSingle();

      if (unidadExistente) {
        await supabase.from('unidades').update({
          estado: nuevoEstado, hora_salida: nuevaHoraSalida, puestos_libres: puestosNuevos, capacidad_total: choferData.capacidad_total
        }).eq('id', unidadExistente.id);
      } else {
        await supabase.from('unidades').insert([{
          numero_unidad: choferData.placa_vehiculo, capacidad_total: choferData.capacidad_total, puestos_libres: puestosNuevos, hora_salida: nuevaHoraSalida, estado: nuevoEstado
        }]);
      }

      setChoferData({ ...choferData, estado: nuevoEstado, hora_salida: nuevaHoraSalida, puestos_libres: puestosNuevos });
    } catch(e) {
      alert("Error cambiando ruta: " + e.message);
    }
  };

  const removerPasajero = async (reservaId, puestosOcupados) => {
    try {
      await supabase.from('reservas').delete().eq('id', reservaId);
      setReservasActivas(prev => prev.filter(r => r.id !== reservaId));
      
      const nuevosPuestos = Math.min(choferData.capacidad_total, choferData.puestos_libres + puestosOcupados);
      updatePuestos(nuevosPuestos);
      
    } catch(e) { console.error("Error al remover pasajero", e); }
  };

  const enviarAvisoEstudiante = async () => {
    if (!reservaActiva) return;
    setEnviandoAviso(true);
    try {
      await supabase.from('reservas').update({ estado_conductor: avisoData.estado, mensaje_conductor: avisoData.mensaje }).eq('id', reservaActiva.id);
      setReservasActivas(prev => prev.map(r => r.id === reservaActiva.id ? {...r, estado_conductor: avisoData.estado, mensaje_conductor: avisoData.mensaje} : r));
      setShowAvisoModal(false); setReservaActiva(null); setAvisoData({ estado: "Confirmado", mensaje: "" });
    } catch (err) { alert(err.message); } finally { setEnviandoAviso(false); }
  };

  const abrirModalAviso = (reserva) => {
    setReservaActiva(reserva);
    setAvisoData({ estado: reserva.estado_conductor && reserva.estado_conductor !== 'Pendiente' ? reserva.estado_conductor : "Confirmado", mensaje: reserva.mensaje_conductor || "" });
    setShowAvisoModal(true);
  };

  const enviarReporteOperativo = async () => {
    setEnviandoReporte(true);
    try {
      await supabase.from('reportes_operativos').insert([{ placa_vehiculo: choferData.placa_vehiculo, tipo_reporte: reporteData.tipo, mensaje: reporteData.mensaje, emisor: `${choferData.nombre} ${choferData.apellido}` }]);
      alert("¡Reporte enviado exitosamente!");
      setShowReporteModal(false); setReporteData({ tipo: "Suministro de Gasolina", mensaje: "" });
    } catch (err) { alert(err.message); } finally { setEnviandoReporte(false); }
  };

  const handleUploadFile = async (file, bucketKey, updateField) => {
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `${bucketKey}-${choferData.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: upErr } = await supabase.storage.from('carnets').upload(`kyc_choferes/${fileName}`, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('carnets').getPublicUrl(`kyc_choferes/${fileName}`);
      const updates = { [updateField]: publicUrl };
      if (bucketKey !== 'avatar') updates.kyc_verificado = false; 
      await supabase.from('choferes').update(updates).eq('id', choferData.id);
      setChoferData(prev => ({ ...prev, ...updates }));
      alert(`Archivo procesado.`); setShowKycModal(false);
    } catch (e) { alert(e.message); } finally { setUploading(false); setShowPhotoOptions(false); stopCamera(); }
  };

  const startCamera = async () => {
    setShowPhotoOptions(false); setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: kycTypeActive === "rostro" || kycTypeActive === "avatar" ? "user" : "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { alert("Sin acceso a cámara."); setShowCamera(false); }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth; canvasRef.current.height = videoRef.current.videoHeight;
    if (kycTypeActive === "rostro" || kycTypeActive === "avatar") { context.translate(canvasRef.current.width, 0); context.scale(-1, 1); }
    context.drawImage(videoRef.current, 0, 0);
    canvasRef.current.toBlob(async (blob) => {
      const file = new File([blob], "kyc_capture.png", { type: "image/png" });
      if (kycTypeActive === "avatar") await handleUploadFile(file, 'avatar', 'avatar_url');
      else await handleUploadFile(file, kycTypeActive, kycTypeActive === "cedula" ? "kyc_cedula_url" : kycTypeActive === "vehiculo" ? "kyc_vehiculo_url" : "kyc_rostro_url");
    }, 'image/png');
  };

  const handleUpdateNames = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('choferes').update(tempData).eq('id', choferData.id);
    if (!error) { setChoferData(prev => ({ ...prev, ...tempData })); setIsEditing(false); }
    setIsSaving(false);
  };

  const hoyStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  const obtenerFechaSegura = (viaje) => {
    if (viaje.fecha) return new Date(viaje.fecha);
    if (viaje.created_at) return new Date(viaje.created_at);
    return new Date(); 
  };

  const viajesHoy = historialViajes.filter(v => obtenerFechaSegura(v).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) === hoyStr);
  const totalPasajerosHoy = viajesHoy.reduce((acc, curr) => acc + (curr.pasajeros_transportados || 0), 0);

  const historialAgrupado = historialViajes.reduce((groups, viaje) => {
    const dateObj = obtenerFechaSegura(viaje);
    const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    const key = dateStr === new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) ? "Hoy" : dateStr;
    if (!groups[key]) groups[key] = [];
    groups[key].push(viaje);
    return groups;
  }, {});

  if (loadingPagina) return <div className="min-h-screen bg-[#1566D0] flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin w-10 h-10 mb-4" /><span className="text-xs uppercase tracking-widest font-black">Sincronizando...</span></div>;

  return (
    <div className="min-h-screen bg-[#1566D0] font-sans text-white flex flex-col relative overflow-hidden text-left">
      
      {/* 🔥 NUEVO: MODAL GIGANTE DE ALERTA DE DESPACHO DESDE ADMINISTRACIÓN */}
      {choferData?.alerta_admin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-red-900/90 backdrop-blur-md">
          <div className="bg-white text-slate-800 w-full max-w-md rounded-[40px] shadow-2xl p-8 animate-in zoom-in duration-300 border-4 border-red-500 text-center">
            <ShieldAlert size={60} className="mx-auto text-red-500 mb-4 animate-bounce" />
            <h2 className="text-3xl font-black italic uppercase text-red-600 mb-2 leading-none">¡ALERTA DE DESPACHO!</h2>
            <p className="text-sm font-bold text-slate-600 mb-6 bg-red-50 p-4 rounded-2xl border border-red-100">
              {choferData.alerta_admin}
            </p>
            <button
              onClick={async () => {
                 const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                 await supabase.from('choferes').update({ alerta_admin: null, estado: 'en ruta', hora_salida: horaActual }).eq('id', choferData.id);
                 await supabase.from('unidades').update({ estado: 'en ruta', hora_salida: horaActual }).eq('numero_unidad', choferData.placa_vehiculo);
                 setChoferData({...choferData, alerta_admin: null, estado: 'en ruta', hora_salida: horaActual});
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              Confirmar y Cubrir Ruta
            </button>
          </div>
        </div>
      )}

      {/* MODALES REUTILIZADOS */}
      {showAvisoModal && reservaActiva && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-[#0A1D3D]/90 backdrop-blur-sm">
          <div className="bg-white text-[#0D47A1] w-full max-w-sm rounded-[38px] shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4"><div className="flex items-center gap-2"><MessageSquare className="text-blue-500" size={24} /><h3 className="text-lg font-black italic uppercase leading-none">Avisar a Pasajero</h3></div><button onClick={() => setShowAvisoModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={16}/></button></div>
            <div className="mb-5"><p className="text-[10px] font-black uppercase text-blue-400">Estudiante</p><p className="font-bold text-slate-800 text-sm truncate">{reservaActiva.nombre_estudiante}</p><p className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1"><MapPin size={12}/> Ubicación: <span className="text-blue-600">{reservaActiva.ubicacion || "N/A"}</span></p></div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-blue-400">Estado</label>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setAvisoData({...avisoData, estado: "Confirmado"})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border-2 flex items-center justify-center gap-1 ${avisoData.estado === "Confirmado" ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-50 border-transparent text-gray-400'}`}>{avisoData.estado === "Confirmado" && <Check size={14}/>} Confirmado</button>
                  <button onClick={() => setAvisoData({...avisoData, estado: "En camino"})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase border-2 flex items-center justify-center gap-1 ${avisoData.estado === "En camino" ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-gray-50 border-transparent text-gray-400'}`}>{avisoData.estado === "En camino" && <Navigation size={14}/>} En camino</button>
                </div>
              </div>
              <div><label className="text-[10px] font-black uppercase text-blue-400">Mensaje</label><textarea value={avisoData.mensaje} onChange={e => setAvisoData({...avisoData, mensaje: e.target.value})} rows="3" placeholder="Ej: Atento a la parada..." className="w-full bg-gray-50 border-2 border-blue-50 rounded-xl px-4 py-3 font-bold text-slate-700 mt-2 resize-none outline-none text-sm"></textarea></div>
              <button onClick={enviarAvisoEstudiante} disabled={enviandoAviso} className="w-full bg-[#1566D0] hover:bg-blue-800 text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2">{enviandoAviso ? <Loader2 className="animate-spin" /> : <><Send size={16}/> Enviar Aviso</>}</button>
            </div>
          </div>
        </div>
      )}

      {showReporteModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-[#0A1D3D]/90 backdrop-blur-sm">
          <div className="bg-white text-[#0D47A1] w-full max-w-sm rounded-[38px] shadow-2xl p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4"><div className="flex items-center gap-2"><AlertTriangle className="text-orange-500" size={24} /><h3 className="text-lg font-black italic uppercase leading-none">Reporte Operativo</h3></div><button onClick={() => setShowReporteModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={16}/></button></div>
            <div className="space-y-4">
              <select value={reporteData.tipo} onChange={e => setReporteData({...reporteData, tipo: e.target.value})} className="w-full bg-gray-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700"><option>⛽ Suministro de Gasolina</option><option>🔧 Falla Mecánica</option><option>🚦 Retraso en Vía</option><option>⚠️ Incidencia con Pasajero</option></select>
              <textarea value={reporteData.mensaje} onChange={e => setReporteData({...reporteData, mensaje: e.target.value})} rows="3" placeholder="Detalles..." className="w-full bg-gray-50 border-2 rounded-xl px-4 py-3 font-bold text-slate-700 resize-none"></textarea>
              <button onClick={enviarReporteOperativo} disabled={enviandoReporte || !reporteData.mensaje} className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-xs uppercase disabled:opacity-50">
                {enviandoReporte ? <Loader2 className="animate-spin mx-auto" /> : "Enviar Reporte"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center p-6"><button onClick={stopCamera} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full text-white"><X size={28} /></button><video ref={videoRef} autoPlay playsInline className="max-w-full max-h-[75vh] rounded-[32px] border-4 border-white object-cover" /><button onClick={capturePhoto} className="mt-6 p-6 bg-white text-[#1566D0] rounded-full"><Camera size={32} /></button></div>
      )}

      {showKycModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-[#0A1D3D]/90 backdrop-blur-sm">
          <div className="bg-[#0D47A1] text-white w-full max-w-sm rounded-[38px] p-8 border border-white/10 animate-in zoom-in">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4"><h3 className="text-sm font-black uppercase">Subir {kycTypeActive}</h3><button onClick={() => setShowKycModal(false)} className="p-2 bg-white/5 rounded-full"><X size={16}/></button></div>
            {uploading ? <Loader2 className="animate-spin mx-auto mb-4" size={32} /> : (
              <div className="space-y-3">
                <button onClick={startCamera} className="w-full bg-white/5 p-5 rounded-2xl flex items-center justify-between"><span className="text-sm font-black uppercase">Cámara</span><Camera size={20} /></button>
                <button onClick={() => kycInputRef.current.click()} className="w-full bg-white/5 p-5 rounded-2xl flex items-center justify-between"><span className="text-sm font-black uppercase">Galería</span><ImageIcon size={20} /></button>
              </div>
            )}
            <input type="file" ref={kycInputRef} className="hidden" accept="image/*" onChange={(e) => handleUploadFile(e.target.files[0], kycTypeActive, kycTypeActive === "cedula" ? "kyc_cedula_url" : kycTypeActive === "vehiculo" ? "kyc_vehiculo_url" : "kyc_rostro_url")} />
          </div>
        </div>
      )}

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0D47A1]/80 backdrop-blur-xl">
          <div className="bg-white text-[#0D47A1] w-full max-w-sm rounded-[45px] overflow-hidden">
            <div className="bg-[#1566D0] p-8 pb-24 text-white relative"><button onClick={() => setIsProfileModalOpen(false)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full"><X size={20} /></button><h2 className="text-2xl font-black italic uppercase">Mi Perfil</h2></div>
            <div className="px-8 pb-10 -mt-20 text-center">
              <div className="relative w-40 h-40 mx-auto mb-6"><div className="w-full h-full rounded-[38px] bg-gray-100 overflow-hidden border-4 border-white">{choferData?.avatar_url ? <img src={choferData.avatar_url} className="w-full h-full object-cover" /> : <User size={60} className="text-blue-200 m-auto mt-10" />}</div></div>
              <div className="text-left grid grid-cols-2 gap-2 text-xs font-bold text-slate-500"><div>CÉDULA: <span className="text-slate-800">{choferData?.cedula}</span></div><div>PLACA: <span className="text-slate-800">{choferData?.placa_vehiculo}</span></div></div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR & NAVBAR */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40" onClick={() => setIsMenuOpen(false)}/>}
      <div className={`fixed inset-y-0 left-0 w-80 bg-[#0D47A1] z-50 transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-500 flex flex-col p-8 border-r border-white/5`}>
        <div className="flex justify-between items-center mb-6"><CreditCard size={20} className="text-blue-300" /><button onClick={() => setIsMenuOpen(false)} className="p-2.5 bg-white/10 rounded-xl"><X size={20} /></button></div>
        <div className="bg-white/5 rounded-[32px] p-5 mb-4 text-center cursor-pointer" onClick={() => { setIsProfileModalOpen(true); setIsMenuOpen(false); }}>
          <div className="w-20 h-20 bg-blue-500 mx-auto mb-3 rounded-2xl overflow-hidden">{choferData?.avatar_url ? <img src={choferData.avatar_url} className="w-full h-full object-cover" /> : <User className="m-auto mt-4" size={40} />}</div>
          <h3 className="font-black italic uppercase truncate mb-1">{choferData?.nombre}</h3>
          <p className="text-[10px] text-blue-300 font-black uppercase tracking-widest mb-3">Operador</p>
          <div className="flex justify-center mb-3">
            {choferData?.kyc_verificado ? (
              <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"><CheckCircle size={12} /> Verificado</div>
            ) : (
              <div className="bg-amber-500/20 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest animate-pulse"><AlertTriangle size={12} /> Pendiente</div>
            )}
          </div>
          <button className="w-full py-2 bg-white text-[#0D47A1] rounded-xl font-black text-[10px] uppercase tracking-widest mt-2">Configurar Cuenta</button>
        </div>
        <div className="flex-1 space-y-2 mt-4">
          <button onClick={() => { setVistaActiva("inicio"); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-[10px] uppercase text-left transition-colors ${vistaActiva === "inicio" ? 'bg-white text-[#0D47A1]' : 'bg-white/5 text-white hover:bg-white/10'}`}><LayoutDashboard size={18} /> Controles de Ruta</button>
          <button onClick={() => { setVistaActiva("reservas"); setIsMenuOpen(false); }} className={`w-full flex items-center justify-between p-4 rounded-2xl font-black text-[10px] uppercase text-left transition-colors ${vistaActiva === "reservas" ? 'bg-white text-[#0D47A1]' : 'bg-white/5 text-white hover:bg-white/10'}`}><div className="flex gap-4"><Users size={18}/> A Bordo</div>{reservasActivas.length > 0 && <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full">{reservasActivas.length}</span>}</button>
          <button onClick={() => { setVistaActiva("historico"); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-[10px] uppercase text-left transition-colors ${vistaActiva === "historico" ? 'bg-white text-[#0D47A1]' : 'bg-white/5 text-white hover:bg-white/10'}`}><ListOrdered size={18} /> Tu Historial</button>
        </div>
        <button onClick={handleLogout} className="flex justify-center gap-3 w-full p-5 bg-red-500/10 rounded-[24px] font-black text-red-400 text-[10px] uppercase border border-red-500/20"><LogOut size={16} /> Salir</button>
      </div>

      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-30 shadow-sm text-slate-800">
        <button onClick={() => setIsMenuOpen(true)} className="bg-slate-100 p-2.5 rounded-xl border border-slate-200/50 text-[#0D47A1]"><Menu size={20} /></button>
        <button onClick={() => setMenuAbierto(!menuAbierto)} className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full font-bold text-xs uppercase text-slate-700 relative">
          <div className="w-5 h-5 bg-[#0D47A1] text-white text-[10px] rounded-full flex items-center justify-center">{choferData?.nombre ? choferData.nombre[0].toUpperCase() : "U"}</div>
          {choferData?.nombre} <ChevronDown size={14} />
          {menuAbierto && (
            <div className="absolute top-12 right-0 w-48 bg-white rounded-2xl shadow-xl border p-2 z-50">
              <div onClick={handleLogout} className="px-3 py-2 text-red-500 text-xs font-black uppercase hover:bg-red-50 rounded-xl cursor-pointer">Cerrar Sesión</div>
            </div>
          )}
        </button>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 px-8 pt-8 pb-48 overflow-y-auto no-scrollbar">
        {!choferData?.kyc_verificado ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-5 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-[30px] flex gap-4"><ShieldAlert size={36} /><div><p className="font-black text-xs uppercase">Acceso Bloqueado</p><p className="text-[11px] opacity-80">El administrador está evaluando tus documentos KYC.</p></div></div>
            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex justify-between"><div className="flex gap-3"><FileText size={20} /> <div><h4 className="text-xs font-black uppercase">Cédula</h4></div></div>{choferData?.kyc_cedula_url ? <CheckCircle className="text-emerald-400" /> : <button onClick={() => { setKycTypeActive("cedula"); setShowKycModal(true); }} className="bg-white text-[#1566D0] font-black text-[10px] uppercase px-4 py-2 rounded-xl">Cargar</button>}</div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex justify-between"><div className="flex gap-3"><Car size={20} /> <div><h4 className="text-xs font-black uppercase">Unidad</h4></div></div>{choferData?.kyc_vehiculo_url ? <CheckCircle className="text-emerald-400" /> : <button onClick={() => { setKycTypeActive("vehiculo"); setShowKycModal(true); }} className="bg-white text-[#1566D0] font-black text-[10px] uppercase px-4 py-2 rounded-xl">Cargar</button>}</div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex justify-between"><div className="flex gap-3"><Smile size={20} /> <div><h4 className="text-xs font-black uppercase">Rostro</h4></div></div>{choferData?.kyc_rostro_url ? <CheckCircle className="text-emerald-400" /> : <button onClick={() => { setKycTypeActive("rostro"); setShowKycModal(true); }} className="bg-white text-[#1566D0] font-black text-[10px] uppercase px-4 py-2 rounded-xl">Cargar</button>}</div>
            </div>
          </div>
        ) : (
          <>
            {vistaActiva === "inicio" && (
              <div className="space-y-6">
                <div className={`bg-gradient-to-br ${choferData?.estado === 'en ruta' ? 'from-orange-500 to-red-600' : 'from-[#2979FF] to-[#1566D0]'} rounded-[45px] p-9 shadow-2xl relative border border-white/10 transition-colors duration-500 text-left`}>
                  <Car className="absolute -right-6 -bottom-6 w-48 h-48 opacity-10 rotate-12" />
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Unidad Activa</p>
                    <h2 className="text-4xl font-black italic tracking-tighter mb-6 uppercase">PLACA: {choferData?.placa_vehiculo}</h2>
                    <div className="flex gap-4">
                      <div className="bg-white/15 px-5 py-3 rounded-2xl flex-1 text-center"><p className="text-[9px] font-black uppercase opacity-60 mb-1">Estado</p><p className="text-sm font-black italic uppercase">{choferData?.estado}</p></div>
                      <div className="bg-white/15 px-5 py-3 rounded-2xl flex-1 text-center"><p className="text-[9px] font-black uppercase opacity-60 mb-1">Salida</p><p className="text-sm font-black italic">{choferData?.hora_salida || '--:--'}</p></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white text-[#0D47A1] rounded-[40px] p-8 shadow-2xl flex flex-col items-center">
                  <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">Puestos Libres Disponibles</p>
                  <div className="flex items-center gap-8 mb-4">
                    <button onClick={() => updatePuestos(choferData.puestos_libres - 1)} className="text-slate-200 hover:text-red-500 transition-colors"><MinusCircle size={56} strokeWidth={1.5} /></button>
                    <div className="text-center"><span className="text-7xl font-black italic leading-none">{choferData?.puestos_libres}</span></div>
                    <button onClick={() => updatePuestos(choferData.puestos_libres + 1)} className="text-slate-200 hover:text-green-500 transition-colors"><PlusCircle size={56} strokeWidth={1.5} /></button>
                  </div>
                </div>

                <button onClick={() => setShowReporteModal(true)} className="w-full bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 text-orange-400 rounded-[30px] p-5 flex items-center justify-between transition-all">
                  <div className="flex items-center gap-4"><div className="bg-orange-500/20 p-3 rounded-2xl"><AlertTriangle size={24} /></div><div className="text-left"><h4 className="text-sm font-black uppercase">Reportar Incidencia</h4></div></div><ArrowRight size={20} />
                </button>
              </div>
            )}

            {/* 🔥 VISTA: PASAJEROS A BORDO CON BOTÓN CORREGIDO 🔥 */}
            {vistaActiva === "reservas" && (
              <div className="space-y-4 text-left">
                <h2 className="text-xl font-black italic uppercase tracking-tight mb-4">Pasajeros a Bordo</h2>
                {reservasActivas.map((reserva, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-[24px] shadow-xl text-[#0D47A1]">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600"><User size={20}/></div>
                        <div>
                          <p className="text-sm font-black uppercase">{reserva.nombre_estudiante}</p>
                          <p className="text-[10px] font-bold text-slate-400"><MapPin size={10} className="inline"/> {reserva.ubicacion}</p>
                        </div>
                      </div>
                      <div className="text-right"><p className="text-[10px] font-black text-orange-500 uppercase">{reserva.puestos} P.</p></div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => abrirModalAviso(reserva)} className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white py-2.5 rounded-xl text-[10px] font-black uppercase"><MessageSquare size={14} className="inline" /> Avisar</button>
                      <button onClick={() => removerPasajero(reserva.id, reserva.puestos || 1)} className="flex-1 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white py-2.5 rounded-xl text-[10px] font-black uppercase"><UserMinus size={14} className="inline" /> Ausente</button>
                    </div>
                  </div>
                ))}
                {reservasActivas.length === 0 && <p className="text-center text-xs opacity-50 uppercase tracking-widest font-bold mt-10">Sin reservas pendientes</p>}
              </div>
            )}

            {vistaActiva === "historico" && (
              <div className="space-y-6 text-left pb-10 animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-black italic uppercase tracking-tight">Tu Historial</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 border border-white/20 p-5 rounded-[24px] shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Viajes Hoy</p>
                    <p className="text-3xl font-black italic">{viajesHoy.length}</p>
                  </div>
                  <div className="bg-white/10 border border-white/20 p-5 rounded-[24px] shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-1">Pasajeros Hoy</p>
                    <p className="text-3xl font-black italic text-emerald-400">{totalPasajerosHoy}</p>
                  </div>
                </div>
                
                <div className="w-full h-px bg-white/10 my-6"></div>

                {historialViajes.length > 0 ? (
                  Object.keys(historialAgrupado).map((fecha, index) => (
                    <div key={index} className="space-y-4">
                      <div className="flex items-center gap-2 text-blue-200 opacity-80">
                        <Calendar size={14} />
                        <h3 className="text-xs font-black uppercase tracking-widest">{fecha}</h3>
                      </div>

                      <div className="space-y-4">
                        {historialAgrupado[fecha].map((viaje, idx) => (
                          <div key={idx} className="bg-white text-[#0D47A1] rounded-[24px] p-5 shadow-xl relative overflow-hidden flex flex-col gap-3 transition-all hover:scale-[1.01]">
                            
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-0.5">Ruta</p>
                                <p className="text-sm font-black uppercase leading-tight">{viaje.ruta}</p>
                              </div>
                              <div className="text-right bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-100">
                                <p className="text-sm font-black leading-none">{viaje.pasajeros_transportados || 0} P.</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-1 border-t border-slate-100 pt-3">
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Clock size={10}/> Salida</p>
                                <p className="text-sm font-black italic text-slate-700">{viaje.hora_salida || "--:--"}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={10}/> Llegada</p>
                                <p className="text-sm font-black italic text-slate-700">{viaje.hora_llegada || "--:--"}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <ListOrdered size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-xs opacity-50 uppercase tracking-widest font-bold">Aún no has completado ningún trayecto</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {vistaActiva === "inicio" && choferData?.kyc_verificado && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1566D0] to-transparent pt-16 z-30">
          <button onClick={toggleRuta} className={`w-full py-6 rounded-[32px] font-black text-xl shadow-2xl uppercase italic flex items-center justify-center gap-4 transition-all ${choferData.estado === 'en ruta' ? 'bg-orange-500 text-white active:scale-95' : 'bg-white text-[#1566D0] active:scale-95'}`}>
            {choferData.estado === 'disponible' ? <Navigation size={24} /> : <CheckCircle size={24} />}
            {choferData.estado === 'disponible' ? "Iniciar Trayecto" : "Finalizar Trayecto"}
          </button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}