import React, { useState, useEffect, useRef } from "react";
import { 
  LogOut, Car, Menu, X, User, Camera, Check, Edit2, Loader2, 
  CreditCard, Image as ImageIcon, ArrowRight, AlertTriangle, FileText, CheckCircle, Clock
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { VehicleCard } from "../../components/VehicleCard";

export default function Dashboard() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const carnetInputRef = useRef(null); 
  
  // Estados de Interfaz y Navegación Interna
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showKycOptionsModal, setShowKycOptionsModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [loadingPagina, setLoadingPagina] = useState(true); 
  const [vistaActiva, setVistaActiva] = useState("inicio");
  
  // Estados para el sistema de Reservas y KYC
  const [loadingReserva, setLoadingReserva] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [puestosA_Reservar, setPuestosA_Reservar] = useState(1); 
  const [subiendoCarnet, setSubiendoCarnet] = useState(false);

  // Estados de Datos
  const [userData, setUserData] = useState({ 
    id: "", nombre: "", apellido: "", avatar_url: null, kyc_verificado: false, carnet_url: null 
  });
  const [tempData, setTempData] = useState({ nombre: "", apellido: "" });
  const [unidades, setUnidades] = useState([]);
  const [misReservasHistorial, setMisReservasHistorial] = useState([]); 
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  // --- 🔒 CANDADO ESTRICTO DE FILTRADO ---
  // Solo muestra choferes verificados Y que estén actualmente "en ruta"
  const unidadesDisponibles = unidades.filter(u => 
    u.puestos_libres > 0 && 
    u.estado?.toLowerCase() === 'en ruta' &&
    u.kyc_verificado === true
  );

  const proximaUnidad = unidadesDisponibles
    .sort((a, b) => (a.hora_salida > b.hora_salida ? 1 : -1))[0];

  const selectedUnit = selectedUnitId 
    ? unidadesDisponibles.find(u => u.id === selectedUnitId) 
    : proximaUnidad;

  useEffect(() => {
    const inicializarDashboard = async () => {
      setLoadingPagina(true);
      const idUsuario = await fetchUser();
      await fetchUnidades();
      if (idUsuario) {
        await fetchMisReservas(idUsuario);
      }
      setLoadingPagina(false);
    };

    inicializarDashboard();

    // SUSCRIPCIÓN A LA TABLA CHOFERES EN TIEMPO REAL
    const channel = supabase
      .channel('cambios-globales')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'choferes' }, 
        () => fetchUnidades()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        navigate("/acceso-estudiante");
        return null;
      }

      const { data, error: profileError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (data) {
        setUserData(data);
        setTempData({ nombre: data.nombre, apellido: data.apellido });
        return data.id;
      }
    } catch (err) {
      console.error("Error cargando sesión:", err.message);
    }
    return null;
  };

  const fetchUnidades = async () => {
    const { data } = await supabase.from('choferes').select('*').order('placa_vehiculo', { ascending: true });
    if (data) setUnidades(data);
  };

  const fetchMisReservas = async (userId) => {
    try {
      const { data } = await supabase
        .from('reservas')
        .select('*, unidades(numero_unidad, hora_salida)')
        .eq('estudiante_id', userId)
        .order('creado_at', { ascending: false });
      
      if (data && data.length > 0) {
        setMisReservasHistorial(data);
      } else {
        // Mock data para demo inicial
        setMisReservasHistorial([
          {
            id: 1,
            creado_at: new Date().toISOString(),
            puestos: puestosA_Reservar || 1,
            unidades: { numero_unidad: selectedUnit?.placa_vehiculo || "Asignando...", hora_salida: selectedUnit?.hora_salida || "--:--" }
          }
        ]);
      }
    } catch (e) {}
  };

  const handleLogout = async () => {
    try {
      setUserData({ id: "", nombre: "", apellido: "", avatar_url: null, kyc_verificado: false, carnet_url: null });
      setTempData({ nombre: "", apellido: "" });
      await supabase.auth.signOut({ scope: 'local' }); 
      navigate("/");
    } catch (err) { navigate("/"); }
  };

  const handleReserva = async () => {
    if (!userData.kyc_verificado) { alert("Bloqueado por KYC."); return; }
    setLoadingReserva(true);
    try {
      const { data: checkUnit } = await supabase.from('choferes').select('puestos_libres').eq('id', selectedUnit.id).single();
      await supabase.from('choferes').update({ puestos_libres: checkUnit.puestos_libres - puestosA_Reservar }).eq('id', selectedUnit.id);
      
      try { 
        await supabase.from('unidades').update({ puestos_libres: checkUnit.puestos_libres - puestosA_Reservar }).eq('numero_unidad', selectedUnit.placa_vehiculo);
        await supabase.from('reservas').insert([{ estudiante_id: userData.id, unidad_id: selectedUnit.id, puestos: puestosA_Reservar }]); 
      } catch(e){}
      
      const now = new Date();
      setTicketData({ 
        unidad: selectedUnit.placa_vehiculo, 
        hora: selectedUnit.hora_salida || now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
        fecha: now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }), 
        nombre: `${userData.nombre} ${userData.apellido}`, 
        puestos: puestosA_Reservar 
      });
      setShowTicket(true); 
      fetchUnidades(); 
      fetchMisReservas(userData.id);
    } catch (err) { alert(err.message); }
    finally { setLoadingReserva(false); }
  };

  const handleUploadFile = async (file, bucketKey, updateField) => {
    if (!file) return;
    setUploading(true);
    if (bucketKey === 'carnet') setSubiendoCarnet(true);
    try {
      const fileName = `${bucketKey}-${userData.id}-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('perfiles').update({ [updateField]: publicUrl }).eq('id', userData.id);
      setUserData({ ...userData, [updateField]: publicUrl });
      if (bucketKey === 'carnet') {
        alert("¡Carnet universitario cargado con éxito! El administrador verificará tu identidad pronto.");
        setShowKycOptionsModal(false);
      }
    } catch (e) { alert(e.message); }
    finally { setUploading(false); setSubiendoCarnet(false); setShowPhotoOptions(false); stopCamera(); }
  };

  const startCamera = async (isForKyc = false) => {
    setShowPhotoOptions(false);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: isForKyc ? "environment" : "user" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { alert("Sin acceso a cámara."); setShowCamera(false); }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    setShowCamera(false);
  };

  const capturePhoto = (bucketKey, updateField) => {
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth; 
    canvasRef.current.height = videoRef.current.videoHeight;
    context.translate(canvasRef.current.width, 0); 
    context.scale(-1, 1); 
    context.drawImage(videoRef.current, 0, 0);
    canvasRef.current.toBlob(async (blob) => {
      const file = new File([blob], "perfil.png", { type: "image/png" });
      await handleUploadFile(file, bucketKey, updateField);
    }, 'image/png');
  };

  const handleUpdateNames = async () => {
    setIsSaving(true);
    const { error = null } = await supabase.from('perfiles').update(tempData).eq('id', userData.id);
    if (!error) { setUserData({ ...userData, ...tempData }); setIsEditing(false); }
    setIsSaving(false);
  };

  if (loadingPagina) {
    return (
      <div className="min-h-screen bg-[#1566D0] flex flex-col items-center justify-center text-white font-black italic gap-4">
        <Loader2 className="animate-spin w-10 h-10" />
        <span className="tracking-widest text-xs uppercase">Sincronizando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1566D0] font-sans text-white flex flex-col relative overflow-hidden text-left">
      
      {/* CÁMARA EN VIVO PANTALLA COMPLETA */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center p-6">
          <button onClick={stopCamera} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full hover:bg-white/20 text-white shadow-xl"><X size={28} /></button>
          <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-[75vh] rounded-[32px] border-4 border-white object-cover" />
          <button 
            onClick={() => {
              if (isProfileModalOpen) capturePhoto('avatar', 'avatar_url');
              else if (showKycOptionsModal) capturePhoto('carnet', 'carnet_url');
            }}
            className="mt-6 p-6 bg-white text-[#1566D0] rounded-full shadow-2xl active:scale-95 transition-all"
          >
            <Camera size={32} />
          </button>
        </div>
      )}

      {/* TICKET MODAL */}
      {showTicket && ticketData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0D47A1]/90 backdrop-blur-md" onClick={() => setShowTicket(false)}></div>
          <div className="relative bg-white text-[#0D47A1] w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-emerald-500 p-8 text-white text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl"><Check size={40} className="text-emerald-500" /></div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Reserva Exitosa</h2>
            </div>
            <div className="p-8 space-y-5">
              <div className="border-b border-gray-100 pb-5">
                <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Pasajero</p>
                <p className="text-xl font-black uppercase leading-none">{ticketData.nombre}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-5">
                <div><p className="text-[10px] font-black uppercase text-blue-400 mb-1">Unidad</p><p className="text-3xl font-black italic leading-none">{ticketData.unidad}</p></div>
                <div><p className="text-[10px] font-black uppercase text-blue-400 mb-1">Asientos</p><p className="text-2xl font-black italic leading-none">{ticketData.puestos} P.</p></div>
              </div>
              <button onClick={() => setShowTicket(false)} className="w-full bg-[#0D47A1] text-white py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-lg transition-all">Cerrar Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELECCIÓN KYC (TOMAR FOTO / GALERÍA) */}
      {showKycOptionsModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0A1D3D]/90 backdrop-blur-sm" onClick={() => !subiendoCarnet && setShowKycOptionsModal(false)}></div>
          <div className="relative bg-[#0D47A1] text-white w-full max-w-sm rounded-[38px] shadow-2xl p-8 border border-white/10 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2 text-blue-300">
                <FileText size={20} />
                <h3 className="text-sm font-black uppercase tracking-wider">Validar Carnet UNEFA</h3>
              </div>
              <button disabled={subiendoCarnet} onClick={() => setShowKycOptionsModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><X size={16}/></button>
            </div>
            
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-2xl flex gap-3 text-left">
              <AlertTriangle size={18} className="shrink-0 text-amber-400" />
              <p className="text-[11px] font-medium leading-relaxed">
                <span className="font-black uppercase tracking-tight text-amber-100">⚠️ REQUISITO:</span> La foto del carnet debe ser perfectamente NÍTIDA y legible para la validación del administrador.
              </p>
            </div>

            {subiendoCarnet ? (
              <div className="text-center py-10 space-y-3">
                <Loader2 className="animate-spin text-orange-400 mx-auto" size={32} />
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Procesando Archivo...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <button onClick={() => startCamera(true)} className="w-full bg-white/5 hover:bg-blue-600 border border-white/10 text-white p-5 rounded-2xl flex items-center justify-between group transition-all">
                  <div className="flex flex-col text-left"><span className="text-sm font-black uppercase tracking-wide">Capturar con Cámara</span><span className="text-[10px] text-blue-300 font-bold uppercase">Usar lente trasero</span></div>
                  <Camera size={20} className="text-blue-400 group-hover:text-white" />
                </button>

                <button onClick={() => carnetInputRef.current.click()} className="w-full bg-white/5 hover:bg-blue-600 border border-white/10 text-white p-5 rounded-2xl flex items-center justify-between group transition-all">
                  <div className="flex flex-col text-left"><span className="text-sm font-black uppercase tracking-wide">Cargar de Galería</span><span className="text-[10px] text-blue-300 font-bold uppercase">Formatos: JPG, PNG</span></div>
                  <ImageIcon size={20} className="text-blue-400 group-hover:text-white" />
                </button>
              </div>
            )}
            <input type="file" ref={carnetInputRef} className="hidden" accept="image/*" onChange={(e) => handleUploadFile(e.target.files[0], 'carnet', 'carnet_url')} />
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
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Mi Perfil Estudiantil</h2>
            </div>
            <div className="px-8 pb-10 -mt-20 text-center">
              <div className="relative w-40 h-40 mx-auto mb-6">
                <div className="w-40 h-40 rounded-[38px] bg-gray-100 overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center">
                  {userData.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover" /> : <User size={60} className="text-blue-200" />}
                  {uploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-[38px]"><Loader2 className="animate-spin" /></div>}
                </div>
                <div className="absolute -bottom-2 -right-2 flex flex-col items-end">
                  {showPhotoOptions && (
                    <div className="bg-white rounded-2xl shadow-2xl p-2 mb-2 border border-gray-100 flex flex-col gap-1 z-10 animate-in fade-in duration-150">
                      <button onClick={() => startCamera(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded-xl text-[10px] font-black uppercase text-left"><Camera size={14} /> Cámara</button>
                      <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded-xl text-[10px] font-black uppercase text-left"><ImageIcon size={14} /> Galería</button>
                    </div>
                  )}
                  <button onClick={() => setShowPhotoOptions(!showPhotoOptions)} className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl hover:scale-110 transition-all"><Camera size={20} /></button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleUploadFile(e.target.files[0], 'avatar', 'avatar_url')} />
              </div>
              <div className="space-y-6">
                {isEditing ? (
                  <div className="space-y-3">
                    <input className="w-full bg-gray-50 border-2 border-blue-50 rounded-xl px-4 py-2 font-bold" value={tempData.nombre} onChange={e => setTempData({...tempData, nombre: e.target.value})} />
                    <input className="w-full bg-gray-50 border-2 border-blue-50 rounded-xl px-4 py-2 font-bold" value={tempData.apellido} onChange={e => setTempData({...tempData, apellido: e.target.value})} />
                    <button onClick={handleUpdateNames} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-black text-[10px] uppercase transition-all">{isSaving ? "Guardando..." : "Confirmar"}</button>
                  </div>
                ) : (
                  <>
                    <div className="text-left"><p className="text-[10px] font-bold uppercase text-blue-400 mb-1">Estudiante</p><h3 className="text-2xl font-black italic uppercase leading-none">{userData.nombre} {userData.apellido}</h3></div>
                    <button onClick={() => setIsEditing(true)} className="w-full bg-gray-50 text-[#0D47A1] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"><Edit2 size={14} /> Editar Datos</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SIDEBAR DESPLEGABLE --- */}
      <div className={`fixed inset-y-0 left-0 w-80 bg-[#0D47A1] z-50 transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-500 flex flex-col p-8 shadow-2xl`}>
        <div className="flex justify-between items-center mb-6">
          <CreditCard size={20} className="text-blue-300" />
          <button onClick={() => setIsMenuOpen(false)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"><X size={20} /></button>
        </div>
        
        <div onClick={() => { setIsProfileModalOpen(true); setIsMenuOpen(false); }} className="bg-white/5 rounded-[32px] p-5 border border-white/10 mb-4 text-center cursor-pointer active:scale-[0.99] group transition-all">
          <div className="w-20 h-20 rounded-2xl bg-blue-500 mx-auto mb-3 overflow-hidden border-2 border-white/20 group-hover:border-white">
            {userData.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover" /> : <User className="m-auto mt-4 text-white" size={40} />}
          </div>
          <h3 className="font-black italic text-white uppercase truncate mb-3 leading-none">{userData.nombre}</h3>
          <button className="w-full py-2 bg-white text-[#0D47A1] rounded-xl font-black text-[10px] uppercase tracking-widest">Ver Perfil / Foto</button>
        </div>

        {/* VERIFICACIÓN KYC */}
        <div className="bg-[#0a1d3d]/60 backdrop-blur-md p-5 rounded-[28px] border border-white/5 mb-6 text-left">
          <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-3">🔐 Verificación KYC</p>
          {userData.kyc_verificado ? (
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase"><CheckCircle size={14} /><span>Carnet Validado</span></div>
          ) : userData.carnet_url ? (
            <div className="bg-orange-500/20 border border-orange-500/30 text-orange-300 p-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase italic"><Loader2 size={14} className="animate-spin" /><span>Revisión Pendiente</span></div>
          ) : (
            <button onClick={() => { setShowKycOptionsModal(true); setIsMenuOpen(false); }} className="w-full bg-[#1566D0] hover:bg-blue-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
              <FileText size={12} /> Validar Carnet UNEFA
            </button>
          )}
        </div>

        {/* NAVEGACIÓN SIDEBAR LIMPIA */}
        <div className="flex-1 space-y-2">
          <button onClick={() => { setVistaActiva("inicio"); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-[10px] uppercase text-left transition-colors ${vistaActiva === "inicio" ? 'bg-white text-[#0D47A1]' : 'bg-white/5 text-white hover:bg-white/10'}`}><Car size={18} /> Panel Reservas</button>
          <button onClick={() => { setVistaActiva("rutas"); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-[10px] uppercase text-left transition-colors ${vistaActiva === "rutas" ? 'bg-white text-[#0D47A1]' : 'bg-white/5 text-white hover:bg-white/10'}`}><Car size={18} /> Mis Rutas (Histórico)</button>
        </div>
        
        <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full p-5 bg-red-500/10 rounded-[24px] font-black text-red-400 text-[10px] uppercase border border-red-500/20 hover:bg-red-50 hover:text-white transition-all"><LogOut size={16} /> Salir del Sistema</button>
      </div>

      {/* HEADER */}
      <header className="bg-[#0D47A1] pt-14 pb-10 px-8 rounded-b-[55px] flex justify-between items-center z-20 shadow-xl">
        <button onClick={() => setIsMenuOpen(true)} className="bg-white/10 p-3 rounded-2xl border border-white/10 hover:bg-white/15 transition-colors"><Menu size={24} /></button>
        <div className="text-right">
          <h1 className="text-2xl font-black italic tracking-tighter leading-none uppercase">HOLA, {userData.nombre}</h1>
          <p className="text-blue-400 text-[9px] font-black uppercase tracking-widest mt-1">Maraven - Centro / Punta Cardón</p>
        </div>
      </header>

      {/* --- CONTENIDO DE VISTA MAESTRA --- */}
      <main className="flex-1 px-8 pt-8 pb-48 overflow-y-auto no-scrollbar">
        
        {/* VISTA 1: RESERVAS PRINCIPALES */}
        {vistaActiva === "inicio" && (
          <>
            {!userData.kyc_verificado && (
              <div className="mb-8 p-5 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-[30px] flex items-center gap-4 animate-in fade-in duration-300">
                <AlertTriangle size={28} className="shrink-0 text-amber-400" />
                <div className="text-left">
                  <p className="font-black text-xs uppercase tracking-tight">Acceso Limitado</p>
                  <p className="text-[11px] opacity-80 font-medium">Despliega el menú lateral izquierdo y valida tu carnet para habilitar la reserva de asientos.</p>
                </div>
              </div>
            )}

            {selectedUnit ? (
              <div className="mb-8 bg-gradient-to-br from-[#2979FF] to-[#1566D0] rounded-[45px] p-9 shadow-2xl relative border border-white/10">
                 <Car className="absolute -right-6 -bottom-6 w-48 h-48 opacity-10 rotate-12" />
                 <div className="relative z-10 text-left">
                    <h2 className="text-4xl font-black italic tracking-tighter mb-6 uppercase leading-none">UNIDAD {selectedUnit.placa_vehiculo || selectedUnit.numero_unidad}</h2>
                    <div className="flex gap-4">
                       <div className="bg-white/15 px-5 py-3 rounded-2xl flex-1 text-center"><p className="text-[9px] font-black uppercase opacity-60 mb-1">Salida</p><p className="text-xl font-black italic">{selectedUnit.hora_salida}</p></div>
                       <div className="bg-white/15 px-5 py-3 rounded-2xl flex-1 text-center"><p className="text-[9px] font-black uppercase opacity-60 mb-1">Disponibles</p><p className="text-xl font-black italic">{selectedUnit.puestos_libres} Asientos</p></div>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="mb-8 text-center text-blue-300 opacity-70 p-6 border-2 border-dashed border-blue-400/30 rounded-[30px]"><p className="text-xs font-bold uppercase italic">No hay unidades en ruta</p></div>
            )}

            <div className="space-y-4">
              <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.3em] ml-4 mb-2">Vehículos Disponibles</p>
              {unidadesDisponibles.length > 0 ? (
                unidadesDisponibles.map(u => (
                  <div key={u.id} onClick={() => setSelectedUnitId(u.id)} className={`cursor-pointer transition-all duration-300 rounded-[30px] border-2 ${selectedUnitId === u.id || (selectedUnit?.id === u.id && !selectedUnitId) ? 'border-emerald-400 bg-[#1e40af] scale-[1.02]' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <VehicleCard nombre={`Unidad ${u.placa_vehiculo || u.numero_unidad} (${u.capacidad_total || 5} puestos)`} puestos={u.puestos_libres} horaSalida={u.hora_salida || "Pendiente"} />
                  </div>
                ))
              ) : (
                <p className="text-center text-xs opacity-50 uppercase tracking-widest font-bold">No hay choferes activos actualmente</p>
              )}
            </div>
          </>
        )}

        {/* VISTA 2: HISTORIAL DE RESERVAS */}
        {vistaActiva === "rutas" && (
          <div className="space-y-5 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black italic uppercase tracking-tight">Historial de Abordajes</h2>
              <button onClick={() => setVistaActiva("inicio")} className="text-[10px] bg-white/10 px-3 py-1.5 rounded-xl uppercase font-black">Volver</button>
            </div>
            {misReservasHistorial.map((res, index) => (
              <div key={res.id || index} className="bg-[#0D47A1] p-6 rounded-[30px] border border-white/10 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-500/20 p-3 rounded-2xl text-emerald-400"><CheckCircle size={24}/></div>
                  <div className="text-left">
                    <p className="text-sm font-black italic uppercase">Unidad {res.unidades?.numero_unidad || "Asignada"}</p>
                    <p className="text-[10px] font-bold text-blue-300 uppercase">Puestos: {res.puestos || 1} Asiento(s)</p>
                  </div>
                </div>
                <div className="text-right text-[10px] font-bold text-white/60"><Clock size={12} className="inline mr-1 opacity-60"/>{new Date(res.creado_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- SECTOR INFERIOR RESERVA --- */}
      {vistaActiva === "inicio" && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1566D0] via-[#1566D0] to-transparent pt-16 z-30 flex flex-col gap-3">
          {selectedUnit && userData.kyc_verificado && (
            <div className="flex items-center justify-between bg-[#0D47A1] px-6 py-3 rounded-2xl border border-white/10 max-w-sm mx-auto w-full shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Asientos:</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button key={num} disabled={num > selectedUnit.puestos_libres} onClick={() => setPuestosA_Reservar(num)} className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center transition-all ${puestosA_Reservar === num ? 'bg-emerald-500 text-white shadow-md scale-110' : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-20'}`}>{num}</button>
                ))}
              </div>
            </div>
          )}
          <button onClick={handleReserva} disabled={loadingReserva || !selectedUnit || !userData.kyc_verificado} className={`w-full py-6 rounded-[32px] font-black text-xl shadow-2xl uppercase italic flex items-center justify-center gap-4 transition-all ${!userData.kyc_verificado ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-40 shadow-none' : 'bg-white text-[#1566D0] active:scale-95'}`}>
            {loadingReserva ? <>Procesando <Loader2 className="animate-spin" /></> : !userData.kyc_verificado ? <>Bloqueado por KYC 🔒</> : <>Reservar {puestosA_Reservar} {puestosA_Reservar === 1 ? 'Asiento' : 'Asientos'} <ArrowRight size={24} /></>}
          </button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}