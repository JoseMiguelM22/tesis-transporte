import React, { useState, useEffect, useRef } from "react";
import { 
  LogOut, MapPin, Bell, Car, Menu, X, 
  User, Camera, Check, Edit2, Loader2, ShieldCheck, CreditCard,
  Image as ImageIcon, ArrowRight, AlertTriangle
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { VehicleCard } from "../components/VehicleCard";

export default function Dashboard() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Estados de Interfaz
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  
  // Estados para el sistema de Reservas y Reportes
  const [loadingReserva, setLoadingReserva] = useState(false);
  const [enviandoReporte, setEnviandoReporte] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState(null);

  // Estados de Datos
  const [userData, setUserData] = useState({ id: "", nombre: "", apellido: "", avatar_url: null });
  const [tempData, setTempData] = useState({ nombre: "", apellido: "" });
  const [unidades, setUnidades] = useState([]);
  
  // Estado para la unidad seleccionada por el usuario
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  // --- LÓGICA DE FILTRADO (OCULTAR UNIDADES FULL) ---
  const unidadesDisponibles = unidades.filter(u => u.puestos_libres > 0 && u.estado !== 'fuera de servicio');

  // Lógica Dinámica: Seleccionar unidad por defecto o la que el usuario tocó
  const proximaUnidad = unidadesDisponibles
    .filter(u => u.estado !== 'en ruta')
    .sort((a, b) => (a.hora_salida > b.hora_salida ? 1 : -1))[0];

  const selectedUnit = selectedUnitId 
    ? unidadesDisponibles.find(u => u.id === selectedUnitId) 
    : proximaUnidad;

  useEffect(() => {
    fetchUser();
    fetchUnidades();

    // Sincronización en Tiempo Real
    const channel = supabase
      .channel('cambios-globales')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'unidades' }, 
        () => fetchUnidades()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
      if (data) {
        setUserData(data);
        setTempData({ nombre: data.nombre, apellido: data.apellido });
      }
    } else { navigate("/login"); }
  };

  const fetchUnidades = async () => {
    const { data } = await supabase.from('unidades').select('*').order('numero_unidad', { ascending: true });
    if (data) setUnidades(data);
  };

  // --- LÓGICA DE REPORTE CON LÍMITE DIARIO ---
  const handleReporteParada = async () => {
    // 1. Verificar el límite en localStorage
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const reportKey = `reportes_parada_${userData.id}_${today}`;
    const reportesHoy = parseInt(localStorage.getItem(reportKey) || "0");

    if (reportesHoy >= 2) {
      alert("Has alcanzado el límite máximo de 2 reportes por día. ¡Gracias por tu valiosa colaboración!");
      return;
    }

    setEnviandoReporte(true);
    try {
      // 2. Enviar el Broadcast a Choferes/Admin
      await supabase.channel('alertas-sistema').send({
        type: 'broadcast',
        event: 'parada_llena',
        payload: { sede: 'Maraven', estudiante: `${userData.nombre} ${userData.apellido}` }
      });
      
      // 3. Incrementar el contador local
      localStorage.setItem(reportKey, (reportesHoy + 1).toString());

      setTimeout(() => {
        alert(`¡Reporte enviado exitosamente! (Has usado ${reportesHoy + 1} de 2 reportes permitidos hoy).`);
        setEnviandoReporte(false);
      }, 1200);
    } catch (err) {
      alert("Hubo un error al enviar el reporte.");
      setEnviandoReporte(false);
    }
  };

  // --- LÓGICA DE RESERVA PROFESIONAL ---
  const handleReserva = async () => {
    if (!selectedUnit) return alert("Por favor selecciona una unidad disponible.");
    
    setLoadingReserva(true);

    try {
      const { data: checkUnit, error: checkError } = await supabase
        .from('unidades')
        .select('puestos_libres')
        .eq('id', selectedUnit.id)
        .single();

      if (checkError) throw checkError;
      if (checkUnit.puestos_libres <= 0) throw new Error("Lo sentimos, se acaban de agotar los puestos en esta unidad.");

      const { error: updateError } = await supabase
        .from('unidades')
        .update({ puestos_libres: checkUnit.puestos_libres - 1 })
        .eq('id', selectedUnit.id);

      if (updateError) throw updateError;

      // Generar Datos del Ticket
      const now = new Date();
      const horaActual = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const fechaActual = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

      setTicketData({
        unidad: selectedUnit.numero_unidad,
        hora: selectedUnit.hora_salida || horaActual,
        fecha: fechaActual,
        nombre: `${userData.nombre} ${userData.apellido}`
      });

      setShowTicket(true);
      fetchUnidades(); 
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingReserva(false);
    }
  };

  // --- LÓGICA DE FOTO Y CÁMARA ---
  const startCamera = async () => {
    setShowPhotoOptions(false);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("No se pudo acceder a la cámara");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.translate(canvasRef.current.width, 0);
    context.scale(-1, 1);
    context.drawImage(videoRef.current, 0, 0);
    
    canvasRef.current.toBlob(async (blob) => {
      const file = new File([blob], "perfil.png", { type: "image/png" });
      await handleUpload(file);
      stopCamera();
    }, 'image/png');
  };

  const handleUpload = async (file) => {
    try {
      setUploading(true);
      const fileName = `${userData.id}-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, file);
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('perfiles').update({ avatar_url: publicUrl }).eq('id', userData.id);
      setUserData({ ...userData, avatar_url: publicUrl });
    } catch (e) { alert(e.message); }
    finally { setUploading(false); setShowPhotoOptions(false); }
  };

  const handleUpdateNames = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('perfiles').update(tempData).eq('id', userData.id);
    if (!error) {
      setUserData({ ...userData, ...tempData });
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#1566D0] font-sans text-white flex flex-col relative overflow-hidden text-left">
      
      {/* --- TICKET DE ABORDAJE (MODAL) --- */}
      {showTicket && ticketData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0D47A1]/90 backdrop-blur-md" onClick={() => setShowTicket(false)}></div>
          
          <div className="relative bg-white text-[#0D47A1] w-full max-w-sm rounded-[40px] shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="bg-emerald-500 p-8 text-white text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl">
                <Check size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">Reserva Exitosa</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-90 mt-1">Pase de Abordaje Confirmado</p>
            </div>

            <div className="p-8 space-y-5">
              <div className="border-b border-gray-100 pb-5">
                <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Pasajero</p>
                <p className="text-xl font-black uppercase leading-none">{ticketData.nombre}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-5">
                <div>
                  <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Unidad</p>
                  <p className="text-3xl font-black italic leading-none">{ticketData.unidad}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Hora Est.</p>
                  <p className="text-xl font-black italic leading-none">{ticketData.hora}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Fecha</p>
                <p className="text-sm font-bold uppercase">{ticketData.fecha}</p>
              </div>
              
              <button 
                onClick={() => setShowTicket(false)} 
                className="w-full mt-4 bg-[#0D47A1] text-white py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-800 transition-all active:scale-95"
              >
                Cerrar Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL CARNET --- */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0D47A1]/80 backdrop-blur-xl" onClick={() => !showCamera && setIsProfileModalOpen(false)}></div>
          
          <div className="relative bg-white text-[#0D47A1] w-full max-w-sm rounded-[45px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-[#1566D0] p-8 pb-24 text-white relative">
              <button onClick={() => { stopCamera(); setIsProfileModalOpen(false); }} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={20} /></button>
              <div className="flex items-center gap-3 opacity-80 mb-4">
                <ShieldCheck size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">UNEFA Transporte</span>
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Mi Carnet Digital</h2>
            </div>

            <div className="px-8 pb-10 -mt-20">
              <div className="relative inline-block mb-6 group">
                <div className="w-40 h-40 rounded-[38px] bg-gray-100 overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center">
                  {showCamera ? (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  ) : userData.avatar_url ? (
                    <img src={userData.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <User size={60} className="text-blue-200" />
                  )}
                  {uploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
                </div>

                {!showCamera ? (
                  <div className="absolute -bottom-2 -right-2 flex flex-col items-end">
                    {showPhotoOptions && (
                      <div className="bg-white rounded-2xl shadow-2xl p-2 mb-2 border border-gray-100 flex flex-col gap-1 animate-in slide-in-from-bottom-2">
                        <button onClick={startCamera} className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded-xl text-[10px] font-black uppercase transition-colors">
                          <Camera size={14} /> Tomar Foto
                        </button>
                        <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded-xl text-[10px] font-black uppercase transition-colors">
                          <ImageIcon size={14} /> Subir Archivo
                        </button>
                      </div>
                    )}
                    <button onClick={() => setShowPhotoOptions(!showPhotoOptions)} className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl hover:scale-110 transition-transform">
                      <Camera size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="absolute -bottom-4 left-0 right-0 flex justify-center gap-2">
                    <button onClick={capturePhoto} className="bg-emerald-500 text-white p-3 rounded-xl shadow-lg"><Check size={20} /></button>
                    <button onClick={stopCamera} className="bg-red-500 text-white p-3 rounded-xl shadow-lg"><X size={20} /></button>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e.target.files[0])} />
              </div>

              <div className="space-y-6 text-left">
                {isEditing ? (
                  <div className="space-y-3 animate-in fade-in">
                    <input className="w-full bg-gray-50 border-2 border-blue-50 rounded-xl px-4 py-2 font-bold focus:border-blue-500 outline-none" value={tempData.nombre} onChange={e => setTempData({...tempData, nombre: e.target.value})} placeholder="Nombre" />
                    <input className="w-full bg-gray-50 border-2 border-blue-50 rounded-xl px-4 py-2 font-bold focus:border-blue-500 outline-none" value={tempData.apellido} onChange={e => setTempData({...tempData, apellido: e.target.value})} placeholder="Apellido" />
                    <button onClick={handleUpdateNames} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">{isSaving ? "Guardando..." : "Confirmar"}</button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-blue-400 tracking-widest mb-1">Nombre Completo</p>
                      <h3 className="text-2xl font-black italic uppercase leading-none">{userData.nombre} {userData.apellido}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div><p className="text-[10px] font-bold uppercase text-blue-400 mb-1">Estado</p><p className="text-xs font-black text-emerald-500 uppercase flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Activo</p></div>
                      <div><p className="text-[10px] font-bold uppercase text-blue-400 mb-1">Cargo</p><p className="text-xs font-black uppercase">Estudiante</p></div>
                    </div>
                    <button onClick={() => setIsEditing(true)} className="w-full bg-gray-50 text-[#0D47A1] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                      <Edit2 size={14} /> Editar Datos
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <div className={`fixed inset-y-0 left-0 w-80 bg-[#0D47A1] z-50 transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-500 shadow-2xl flex flex-col`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex justify-between items-center mb-10">
            <div className="bg-white/10 p-3 rounded-2xl shadow-inner"><CreditCard size={20} className="text-blue-300" /></div>
            <button onClick={() => setIsMenuOpen(false)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><X size={20} /></button>
          </div>
          
          <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-500 overflow-hidden border-2 border-white/20">
                {userData.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover" /> : <User className="m-auto mt-3" />}
              </div>
              <div className="flex-1 min-w-0"><h3 className="font-black italic text-sm uppercase truncate leading-none mb-1">{userData.nombre}</h3><p className="text-[9px] text-blue-400 font-bold uppercase tracking-tighter">Estudiante UNEFA</p></div>
            </div>
            <button onClick={() => { setIsProfileModalOpen(true); setIsMenuOpen(false); }} className="w-full py-3 bg-white text-[#0D47A1] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Ver Mi Perfil</button>
          </div>

          <div className="flex-1 space-y-2">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 ml-2">Navegación</p>
            <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest group"><Car size={18} className="text-blue-400" /> Mis Rutas</button>
            <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest group"><Bell size={18} /> Notificaciones</button>
          </div>

          <button onClick={() => supabase.auth.signOut()} className="flex items-center justify-center gap-3 w-full p-5 bg-red-500/10 rounded-[24px] font-black text-red-400 text-[10px] uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"><LogOut size={16} /> Cerrar Sesión</button>
        </div>
      </div>

      {/* --- DASHBOARD UI --- */}
      <header className="bg-[#0D47A1] pt-14 pb-10 px-8 rounded-b-[55px] shadow-2xl flex justify-between items-center z-20">
        <button onClick={() => setIsMenuOpen(true)} className="bg-white/10 p-3 rounded-2xl border border-white/10 shadow-lg"><Menu size={24} /></button>
        <div className="flex flex-col items-end">
            <h1 className="text-2xl font-black italic tracking-tighter leading-none uppercase">¡HOLA, {userData.nombre}!</h1>
            <p className="text-blue-400 text-[9px] font-black uppercase tracking-widest mt-1">Sambil - Maraven</p>
        </div>
      </header>

      <main className="flex-1 px-8 pt-8 pb-36 overflow-y-auto no-scrollbar">
        
        {/* --- MAPA ACTUALIZADO --- */}
        <div className="relative w-full h-64 bg-[#0a1d3d] rounded-[45px] border-4 border-white/10 shadow-2xl overflow-hidden mb-6 group pointer-events-none">
            <div className="absolute -inset-12 opacity-80 mix-blend-luminosity">
                <iframe 
                    title="mapa-unefa"
                    width="100%" 
                    height="100%" 
                    scrolling="no" 
                    marginHeight="0" 
                    marginWidth="0" 
                    src="https://www.openstreetmap.org/export/embed.html?bbox=-70.2100%2C11.6700%2C-70.1600%2C11.7100&amp;layer=mapnik&amp;marker=11.6934%2C-70.1842" 
                    style={{ border: 0, filter: 'contrast(1.2) saturation(1.5) hue-rotate(0.8)' }}
                    className="pointer-events-none"
                ></iframe>
            </div>
            <div className="absolute inset-0 bg-[#0D47A1]/40 pointer-events-none"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <MapPin size={45} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)] animate-bounce" />
                <span className="mt-2 bg-[#0D47A1] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-lg">Sector Maraven</span>
            </div>
            <div className="absolute top-4 right-4 bg-emerald-500/20 px-3 py-1 rounded-full text-[8px] font-black uppercase shadow-lg border border-emerald-500/50 z-10 flex items-center gap-2 text-emerald-400 backdrop-blur-md">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> GPS Live
            </div>
        </div>

        {/* --- BOTÓN DE REPORTE --- */}
        <button 
          onClick={handleReporteParada}
          disabled={enviandoReporte}
          className="w-full mb-10 bg-orange-500/20 border border-orange-500/50 text-orange-400 hover:bg-orange-500 hover:text-white py-4 rounded-[25px] font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          {enviandoReporte ? <Loader2 className="animate-spin" size={18} /> : <><AlertTriangle size={18} /> Reportar Parada Llena</>}
        </button>

        {/* --- TARJETA DE UNIDAD SELECCIONADA --- */}
        {selectedUnit ? (
          <div className="mb-10 bg-gradient-to-br from-[#2979FF] to-[#1566D0] rounded-[45px] p-9 shadow-2xl relative overflow-hidden border border-white/10 transition-all duration-300">
             <Car className="absolute -right-6 -bottom-6 w-48 h-48 opacity-10 rotate-12" />
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={14} className="text-emerald-300" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 opacity-90">Unidad Seleccionada</p>
                </div>
                <h2 className="text-4xl font-black italic tracking-tighter mb-6 uppercase leading-none">UNIDAD {selectedUnit.numero_unidad}</h2>
                <div className="flex gap-4">
                   <div className="bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex-1 text-center">
                     <p className="text-[9px] font-black uppercase opacity-60 mb-1">Salida</p>
                     <p className="text-xl font-black italic leading-none">{selectedUnit.hora_salida}</p>
                   </div>
                   <div className="bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex-1 text-center">
                     <p className="text-[9px] font-black uppercase opacity-60 mb-1">Libres</p>
                     <p className="text-xl font-black italic leading-none">{selectedUnit.puestos_libres}</p>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="mb-10 text-center text-blue-300 opacity-70 p-6 border-2 border-dashed border-blue-400/30 rounded-[30px]">
             <Car size={32} className="mx-auto mb-2 opacity-50" />
             <p className="text-xs font-bold uppercase tracking-widest">No hay unidades con puestos libres</p>
          </div>
        )}

        {/* --- LISTADO INTERACTIVO --- */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.3em] mb-4 ml-4">Toca para elegir otra unidad</p>
          {unidadesDisponibles.length > 0 ? (
            unidadesDisponibles.map(u => (
              <div 
                key={u.id} 
                onClick={() => setSelectedUnitId(u.id)}
                className={`cursor-pointer transition-all duration-300 rounded-[30px] border-2 ${selectedUnitId === u.id || (selectedUnit?.id === u.id && !selectedUnitId) ? 'border-emerald-400 scale-[1.02] shadow-[0_0_20px_rgba(52,211,153,0.3)] bg-[#1e40af]' : 'border-transparent opacity-70 hover:opacity-100 hover:bg-[#1e40af]/50'}`}
              >
                <VehicleCard nombre={`Unidad ${u.numero_unidad}`} puestos={u.puestos_libres} horaSalida={u.hora_salida || "Pendiente"} />
              </div>
            ))
          ) : (
            <p className="text-center text-[10px] font-bold uppercase tracking-widest text-blue-300/50 mt-6">Esperando nuevas unidades...</p>
          )}
        </div>
      </main>

      {/* --- BOTÓN DE RESERVA --- */}
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#1566D0] via-[#1566D0] to-transparent pt-16 z-30">
        <button 
          onClick={handleReserva}
          disabled={loadingReserva || !selectedUnit}
          className={`w-full bg-white text-[#1566D0] py-6 rounded-[32px] font-black text-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] active:scale-95 uppercase italic flex items-center justify-center gap-4 transition-transform ${loadingReserva || !selectedUnit ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loadingReserva ? (
            <>Procesando <Loader2 className="animate-spin" /></>
          ) : (
            <>Reservar Mi Asiento <ArrowRight size={24} /></>
          )}
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}