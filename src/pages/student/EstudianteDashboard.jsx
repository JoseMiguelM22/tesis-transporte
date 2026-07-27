import React, { useState, useEffect, useRef } from "react";
import { 
  LogOut, Car, Menu, X, User, Camera, Check, Edit2, Loader2, 
  CreditCard, Image as ImageIcon, ArrowRight, AlertTriangle, FileText, 
  MapPin, MessageSquare, Code, Clock
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { VehicleCard } from "../../components/VehicleCard";

// 🌍 REACT-LEAFLET: ESTABLE Y CONFIABLE
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 📍 COORDENADAS EXCLUSIVAS (Sin Maraven)
const COORDENADAS_PUNTOS = {
  PuntaCardon: [11.6214, -70.2152],
  UNEFA: [11.6934, -70.1872],
  Centro: [11.7042, -70.1805]
};

// 🔥 TRAYECTOS VIALES REALES CURVOS (UNEFA -> CENTRO)
const RUTA_UNEFA_CENTRO = [
  [11.6934, -70.1872], // UNEFA
  [11.6948, -70.1866], // Bajando Av. Bolívar / Intercomunal
  [11.6962, -70.1858],
  [11.6975, -70.1849],
  [11.6988, -70.1840],
  [11.7001, -70.1831],
  [11.7015, -70.1822],
  [11.7028, -70.1813],
  [11.7042, -70.1805]  // Centro
];

// 🔥 TRAYECTOS VIALES REALES CURVOS (PUNTA CARDON -> UNEFA)
// Más de 18 puntos siguiendo la curva de la Av. Ollarvides
const RUTA_PUNTACARDON_UNEFA = [
  [11.6214, -70.2152], // Punta Cardón
  [11.6238, -70.2131], // Saliendo
  [11.6265, -70.2106], // Curva 1
  [11.6292, -70.2085], // Curva 2
  [11.6322, -70.2066],
  [11.6355, -70.2050],
  [11.6390, -70.2036],
  [11.6426, -70.2023], // Distribuidor Redoma
  [11.6465, -70.2012],
  [11.6505, -70.2001],
  [11.6548, -70.1991],
  [11.6592, -70.1980],
  [11.6638, -70.1968], // Paso por Zona Maraven
  [11.6685, -70.1955],
  [11.6732, -70.1940],
  [11.6780, -70.1924], // Intercomunal Alí Primera
  [11.6830, -70.1907],
  [11.6882, -70.1890],
  [11.6934, -70.1872]  // Llegada UNEFA
];

// 🚀 ALGORITMO DE INTERPOLACIÓN (Genera micropuntos para animación Uber)
const interpolateRoute = (routeCoords, steps = 15) => {
  const interpolated = [];
  for (let i = 0; i < routeCoords.length - 1; i++) {
    const [lat1, lon1] = routeCoords[i];
    const [lat2, lon2] = routeCoords[i + 1];
    for (let j = 0; j < steps; j++) {
      const fraction = j / steps;
      interpolated.push([ lat1 + (lat2 - lat1) * fraction, lon1 + (lon2 - lon1) * fraction ]);
    }
  }
  interpolated.push(routeCoords[routeCoords.length - 1]);
  return interpolated;
};

// COMPONENTE PARA QUE LA CÁMARA SIGA AL BUS SUAVEMENTE
function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    // panTo mantiene el zoom alto y desliza la cámara
    if (coords) map.panTo(coords, { animate: true, duration: 0.5 });
  }, [coords, map]);
  return null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const carnetInputRef = useRef(null); 
  
  const nombreEstudianteRef = useRef("");
  
  // Estados de Interfaz
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
  const [showNotification, setShowNotification] = useState(false);
  
  // Estados de Reservas
  const [loadingReserva, setLoadingReserva] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [puestosA_Reservar, setPuestosA_Reservar] = useState(1); 
  const [ubicacion, setUbicacion] = useState("UNEFA"); 
  const [subiendoCarnet, setSubiendoCarnet] = useState(false);
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(null);

  // Estados de Datos
  const [userData, setUserData] = useState({ id: "", nombre: "", apellido: "", avatar_url: null, kyc_verificado: false, carnet_url: null, cedula: "" });
  const [tempData, setTempData] = useState({ nombre: "", apellido: "" });
  const [unidades, setUnidades] = useState([]);
  const [misReservasHistorial, setMisReservasHistorial] = useState([]); 
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  // GPS en tiempo real
  const [busLocation, setBusLocation] = useState(COORDENADAS_PUNTOS.UNEFA);

  const unidadesDisponibles = unidades.filter(u => u.puestos_libres > 0 && u.estado?.toLowerCase() === 'en ruta' && u.kyc_verificado === true);
  const proximaUnidad = unidadesDisponibles.sort((a, b) => (a.hora_salida > b.hora_salida ? 1 : -1))[0];
  const selectedUnit = selectedUnitId ? unidadesDisponibles.find(u => u.id === selectedUnitId) : proximaUnidad;

  // ==========================================
  // 🚗 ANIMACIÓN DEL AUTOBÚS
  // ==========================================
  useEffect(() => {
    if (!selectedUnit) return;
    const esRutaCentro = selectedUnit.ruta?.toLowerCase().includes("centro");
    const rutaBase = esRutaCentro ? RUTA_UNEFA_CENTRO : RUTA_PUNTACARDON_UNEFA;
      
    // Ruta densa con interpolación para animación Uber
    const rutaDensa = interpolateRoute(rutaBase, 15);
    let index = 0;
    setBusLocation(rutaDensa[0]);

    // Intervalo de 300ms + CSS Transition = Movimiento Ultra Fluido
    const intervaloGps = setInterval(() => {
      index = (index + 1) % rutaDensa.length;
      setBusLocation(rutaDensa[index]);
    }, 300); 

    return () => clearInterval(intervaloGps);
  }, [selectedUnitId, selectedUnit?.id]);

  // Resto de la lógica del sistema
  useEffect(() => {
    let channelChoferes, channelReservas;

    const inicializarDashboard = async () => {
      setLoadingPagina(true);
      const usuario = await fetchUser();
      
      if (usuario) {
        const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.trim();
        nombreEstudianteRef.current = nombreCompleto;
        await fetchUnidades();
        await fetchMisReservas(nombreCompleto);
      }
      setLoadingPagina(false);

      channelChoferes = supabase.channel('cambios-globales')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'choferes' }, () => fetchUnidades()).subscribe();

      channelReservas = supabase.channel('cambios-mis-reservas')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => {
            if (nombreEstudianteRef.current) fetchMisReservas(nombreEstudianteRef.current);
        }).subscribe();
    };

    inicializarDashboard();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) navigate("/acceso-estudiante");
    });

    return () => {
      if (channelChoferes) supabase.removeChannel(channelChoferes);
      if (channelReservas) supabase.removeChannel(channelReservas);
      if (authListener && authListener.subscription) authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) { navigate("/acceso-estudiante"); return null; }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { navigate("/acceso-estudiante"); return null; }

      const { data, error: profileError } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
      if (profileError || !data) { await supabase.auth.signOut(); navigate("/acceso-estudiante"); return null; }

      setUserData(data); setTempData({ nombre: data.nombre, apellido: data.apellido });
      return data;
    } catch (err) { navigate("/acceso-estudiante"); return null; }
  };

  const fetchUnidades = async () => {
    const { data } = await supabase.from('choferes').select('*').order('placa_vehiculo', { ascending: true });
    if (data) setUnidades(data);
  };

  const fetchMisReservas = async (nombreCompleto) => {
    try {
      const { data } = await supabase.from('reservas').select('*').eq('nombre_estudiante', nombreCompleto).order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        const ahora = new Date();
        const haceUnaHora = new Date(ahora.getTime() - 60 * 60 * 1000);
        const reservasUltimaHora = data.filter(r => new Date(r.created_at) >= haceUnaHora);
        
        if (reservasUltimaHora.length >= 3) {
          setLimiteAlcanzado(true);
          const masAntiguaDeLasRecientes = new Date(reservasUltimaHora[reservasUltimaHora.length - 1].created_at);
          const liberacion = new Date(masAntiguaDeLasRecientes.getTime() + (60 * 60 * 1000));
          const minutosFaltantes = Math.ceil((liberacion.getTime() - ahora.getTime()) / 60000);
          setTiempoRestante(minutosFaltantes);
        } else {
          setLimiteAlcanzado(false); setTiempoRestante(null);
        }

        const formateado = data.map(res => {
          const dateObj = new Date(res.created_at);
          return {
            id: res.id, creado_at: res.created_at, hora: dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            fecha: dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
            puestos: res.puestos || 1, unidad: res.placa_vehiculo, nombre: res.nombre_estudiante,
            ubicacion: res.ubicacion || "Parada General", estado_conductor: res.estado_conductor || 'Pendiente', mensaje_conductor: res.mensaje_conductor || ''
          };
        });
        setMisReservasHistorial(formateado);
      } else {
        setMisReservasHistorial([]); setLimiteAlcanzado(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    try {
      setUserData({ id: "", nombre: "", apellido: "", avatar_url: null, kyc_verificado: false, carnet_url: null });
      await supabase.auth.signOut({ scope: 'local' }); navigate("/");
    } catch (err) { navigate("/"); }
  };

  const handleReserva = async () => {
    if (!userData.kyc_verificado) { alert("Bloqueado por KYC."); return; }
    if (limiteAlcanzado) { alert(`Has superado el límite. Intenta en ${tiempoRestante} minutos.`); return; }
    
    setLoadingReserva(true);
    try {
      const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: verifSpam } = await supabase.from('reservas').select('id').eq('nombre_estudiante', `${userData.nombre} ${userData.apellido}`.trim()).gte('created_at', haceUnaHora);
      
      if (verifSpam && verifSpam.length >= 3) { alert("Límite de seguridad alcanzado."); setLoadingReserva(false); return; }

      const { data: checkUnit } = await supabase.from('choferes').select('puestos_libres').eq('id', selectedUnit.id).single();
      await supabase.from('choferes').update({ puestos_libres: checkUnit.puestos_libres - puestosA_Reservar }).eq('id', selectedUnit.id);
      await supabase.from('unidades').update({ puestos_libres: checkUnit.puestos_libres - puestosA_Reservar }).eq('numero_unidad', selectedUnit.placa_vehiculo);
      
      await supabase.from('reservas').insert([{ 
        placa_vehiculo: selectedUnit.placa_vehiculo, nombre_estudiante: `${userData.nombre} ${userData.apellido}`.trim(),
        cedula_estudiante: userData.cedula || "Pasajero Regular", puestos: puestosA_Reservar, ubicacion: ubicacion, estado_conductor: 'Pendiente'
      }]); 
      
      const now = new Date();
      setTicketData({ 
        unidad: selectedUnit.placa_vehiculo, hora: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
        fecha: now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }), 
        nombre: `${userData.nombre} ${userData.apellido}`, puestos: puestosA_Reservar, ubicacion: ubicacion
      });

      setShowTicket(true); fetchUnidades(); fetchMisReservas(`${userData.nombre} ${userData.apellido}`.trim());
    } catch (err) { alert("Error: " + err.message); }
    finally { setLoadingReserva(false); }
  };

  const marcarComoResuelto = async (reservaId) => {
    try {
      await supabase.from('reservas').delete().eq('id', reservaId);
      setMisReservasHistorial(prev => prev.filter(r => r.id !== reservaId));
    } catch(e) { console.error(e); }
  };

  const handleUploadFile = async (file, bucketKey, updateField) => {
    if (!file) return;
    setUploading(true); if (bucketKey === 'carnet') setSubiendoCarnet(true);
    try {
      const fileName = `${bucketKey}-${userData.id}-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('perfiles').update({ [updateField]: publicUrl }).eq('id', userData.id);
      setUserData({ ...userData, [updateField]: publicUrl });
      if (bucketKey === 'carnet') { alert("¡Carnet cargado con éxito!"); setShowKycOptionsModal(false); }
    } catch (e) { alert(e.message); }
    finally { setUploading(false); setSubiendoCarnet(false); setShowPhotoOptions(false); stopCamera(); }
  };

  const startCamera = async (isForKyc = false) => {
    setShowPhotoOptions(false); setShowCamera(true);
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
    canvasRef.current.width = videoRef.current.videoWidth; canvasRef.current.height = videoRef.current.videoHeight;
    context.translate(canvasRef.current.width, 0); context.scale(-1, 1); context.drawImage(videoRef.current, 0, 0);
    canvasRef.current.toBlob(async (blob) => {
      await handleUploadFile(new File([blob], "perfil.png", { type: "image/png" }), bucketKey, updateField);
    }, 'image/png');
  };

  const handleUpdateNames = async () => {
    setIsSaving(true);
    const { error = null } = await supabase.from('perfiles').update(tempData).eq('id', userData.id);
    if (!error) { setUserData({ ...userData, ...tempData }); setIsEditing(false); }
    setIsSaving(false);
  };

  // 🎨 CONFIGURACIÓN DE ÍCONOS DE LEAFLET
  const iconAutobus = L.divIcon({
    html: `<div class="bg-orange-500 text-white p-2.5 rounded-full shadow-2xl border-2 border-white flex items-center justify-center w-10 h-10"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg></div>`,
    className: "smooth-marker", // 🔥 Clase CSS Mágica
    iconSize: [40, 40], iconAnchor: [20, 40]
  });

  const iconParada = L.divIcon({
    html: `<div class="bg-[#0D47A1] text-white p-2 rounded-xl shadow-lg border-2 border-white flex items-center justify-center w-8 h-8"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
    className: "", iconSize: [32, 32], iconAnchor: [16, 32]
  });

  const viajeActual = misReservasHistorial.length > 0 ? misReservasHistorial[0] : null;
  const choferViajeActual = viajeActual ? unidades.find(u => u.placa_vehiculo === viajeActual.unidad) : null;
  const nombreChoferViaje = choferViajeActual ? `${choferViajeActual.nombre} ${choferViajeActual.apellido}`.trim() : "El conductor";

  useEffect(() => {
    if (viajeActual?.estado_conductor && viajeActual.estado_conductor !== 'Pendiente') {
      setShowNotification(true);
      const timer = setTimeout(() => { setShowNotification(false); }, 6000); 
      return () => clearTimeout(timer);
    }
  }, [viajeActual?.mensaje_conductor, viajeActual?.estado_conductor]);

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
      
      {/* 🔥 MAGIA CSS PARA LEAFLET 🔥 */}
      <style>{`
        .smooth-marker { transition: transform 0.3s linear !important; }
      `}</style>

      {showNotification && viajeActual && viajeActual.estado_conductor !== 'Pendiente' && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border-l-[6px] border-orange-500 flex items-start gap-4 animate-in slide-in-from-top-10 fade-in duration-500">
          <div className="bg-orange-100 p-3 rounded-full text-orange-600 shrink-0 shadow-inner">
            <MessageSquare size={20} className="animate-pulse" />
          </div>
          <div className="flex-1 cursor-pointer" onClick={() => { setShowNotification(false); setVistaActiva("rutas"); }}>
            <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">{nombreChoferViaje} envió un aviso:</p>
            <p className="text-sm font-bold text-[#0D47A1] leading-tight">"{viajeActual.mensaje_conductor}"</p>
          </div>
          <button onClick={() => setShowNotification(false)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-100 hover:bg-red-50 rounded-full transition-colors shrink-0 active:scale-95">
            <X size={16} />
          </button>
        </div>
      )}

      {/* MODALES EXTRAS */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center p-6">
          <button onClick={stopCamera} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full hover:bg-white/20 text-white shadow-xl"><X size={28} /></button>
          <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-[75vh] rounded-[32px] border-4 border-white object-cover" />
          <button onClick={() => isProfileModalOpen ? capturePhoto('avatar', 'avatar_url') : capturePhoto('carnet', 'carnet_url')} className="mt-6 p-6 bg-white text-[#1566D0] rounded-full shadow-2xl active:scale-95 transition-all"><Camera size={32} /></button>
        </div>
      )}

      {showTicket && ticketData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0D47A1]/90 backdrop-blur-md" onClick={() => setShowTicket(false)}></div>
          <div className="relative bg-white text-[#0D47A1] w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col">
            <div className="bg-emerald-500 p-8 text-white text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl"><Check size={40} className="text-emerald-500" /></div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Reserva Confirmada</h2>
            </div>
            <div className="p-8 space-y-5 flex-1">
              <div className="flex justify-between items-center border-b border-gray-100 pb-5">
                <div className="flex-1 pr-4">
                  <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Pasajero</p>
                  <p className="text-xl font-black uppercase leading-none truncate">{ticketData.nombre}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">{ticketData.fecha}</p>
                  <p className="text-sm font-black uppercase leading-none">{ticketData.hora}</p>
                </div>
              </div>
              <div className="border-b border-gray-100 pb-5">
                <p className="text-[10px] font-black uppercase text-blue-400 mb-1 flex items-center gap-1"><MapPin size={12}/> Punto de Abordaje</p>
                <p className="text-2xl font-black italic leading-none">{ticketData.ubicacion}</p>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-5">
                <div className="flex-1 overflow-hidden pr-4">
                  <p className="text-[10px] font-black uppercase text-blue-400 mb-1">Unidad</p>
                  <p className="text-2xl font-black italic leading-none truncate">{ticketData.unidad}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black uppercase text-blue-400 mb-1">Asientos</p>
                  <p className="text-2xl font-black italic leading-none">{ticketData.puestos} P.</p>
                </div>
              </div>
              <button onClick={() => setShowTicket(false)} className="w-full bg-[#0D47A1] text-white py-4 mt-2 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95">Cerrar Ticket</button>
            </div>
          </div>
        </div>
      )}

      {showKycOptionsModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0A1D3D]/90 backdrop-blur-sm" onClick={() => !subiendoCarnet && setShowKycOptionsModal(false)}></div>
          <div className="relative bg-[#0D47A1] text-white w-full max-w-sm rounded-[38px] shadow-2xl p-8 border border-white/10 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4"><div className="flex items-center gap-2 text-blue-300"><FileText size={20} /><h3 className="text-sm font-black uppercase tracking-wider">Validar Identidad</h3></div><button disabled={subiendoCarnet} onClick={() => setShowKycOptionsModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><X size={16}/></button></div>
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-2xl flex gap-3 text-left"><AlertTriangle size={18} className="shrink-0 text-amber-400" /><p className="text-[11px] font-medium leading-relaxed"><span className="font-black uppercase tracking-tight text-amber-100">⚠️ REQUISITO:</span> La foto del carnet debe ser perfectly NÍTIDA.</p></div>
            {subiendoCarnet ? <div className="text-center py-10 space-y-3"><Loader2 className="animate-spin text-orange-400 mx-auto" size={32} /><span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Procesando...</span></div> : <div className="space-y-3"><button onClick={() => startCamera(true)} className="w-full bg-white/5 hover:bg-blue-600 border border-white/10 text-white p-5 rounded-2xl flex items-center justify-between group transition-all"><div className="flex flex-col text-left"><span className="text-sm font-black uppercase tracking-wide">Capturar con Cámara</span></div><Camera size={20} className="text-blue-400 group-hover:text-white" /></button><button onClick={() => carnetInputRef.current.click()} className="w-full bg-white/5 hover:bg-blue-600 border border-white/10 text-white p-5 rounded-2xl flex items-center justify-between group transition-all"><div className="flex flex-col text-left"><span className="text-sm font-black uppercase tracking-wide">Cargar de Galería</span></div><ImageIcon size={20} className="text-blue-400 group-hover:text-white" /></button></div>}
            <input type="file" ref={carnetInputRef} className="hidden" accept="image/*" onChange={(e) => handleUploadFile(e.target.files[0], 'carnet', 'carnet_url')} />
          </div>
        </div>
      )}

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0D47A1]/80 backdrop-blur-xl" onClick={() => !showCamera && setIsProfileModalOpen(false)}></div>
          <div className="relative bg-white text-[#0D47A1] w-full max-w-sm rounded-[45px] overflow-hidden shadow-2xl p-8 text-center animate-in zoom-in duration-200">
            <div className="bg-[#1566D0] p-8 pb-24 text-white relative -mx-8 -mt-8 rounded-b-[40px]"><button onClick={() => setIsProfileModalOpen(false)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={20} /></button><h2 className="text-2xl font-black italic uppercase tracking-tighter">Mi Perfil</h2></div>
            <div className="px-0 pb-2 -mt-20">
              <div className="relative w-40 h-40 mx-auto mb-6">
                <div className="w-40 h-40 rounded-[38px] bg-gray-100 overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center">{userData.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover" /> : <User size={60} className="text-blue-200" />}{uploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-[38px]"><Loader2 className="animate-spin" /></div>}</div>
                <button onClick={() => setShowPhotoOptions(!showPhotoOptions)} className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-4 rounded-2xl shadow-xl hover:scale-110 transition-all"><Camera size={20} /></button>
                {showPhotoOptions && <div className="absolute right-12 bottom-0 bg-white rounded-2xl shadow-2xl p-2 border border-gray-100 flex flex-col gap-1 z-10 text-left"><button onClick={() => startCamera(false)} className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded-xl text-[10px] font-black uppercase"><Camera size={14} /> Cámara</button><button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 rounded-xl text-[10px] font-black uppercase"><ImageIcon size={14} /> Galería</button></div>}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleUploadFile(e.target.files[0], 'avatar', 'avatar_url')} />
              </div>
              <div className="space-y-6">
                {isEditing ? (
                  <div className="space-y-3"><input className="w-full bg-gray-50 border-2 border-blue-50 rounded-xl px-4 py-2 font-bold" value={tempData.nombre} onChange={e => setTempData({...tempData, nombre: e.target.value})} /><input className="w-full bg-gray-50 border-2 border-blue-50 rounded-xl px-4 py-2 font-bold" value={tempData.apellido} onChange={e => setTempData({...tempData, apellido: e.target.value})} /><button onClick={handleUpdateNames} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-black text-[10px] uppercase">{isSaving ? "Guardando..." : "Confirmar"}</button></div>
                ) : (
                  <><div className="text-left"><p className="text-[10px] font-bold uppercase text-blue-400 mb-1">Estudiante</p><h3 className="text-2xl font-black italic uppercase leading-none">{userData.nombre} {userData.apellido}</h3></div><button onClick={() => setIsEditing(true)} className="w-full bg-gray-50 text-[#0D47A1] py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all"><Edit2 size={14} /> Editar Datos</button></>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 w-80 bg-[#0D47A1] z-50 transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-500 flex flex-col p-8 shadow-2xl`}>
        <div className="flex justify-between items-center mb-6">
          <CreditCard size={20} className="text-blue-300" />
          <button onClick={() => setIsMenuOpen(false)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"><X size={20} /></button>
        </div>
        <div onClick={() => { setIsProfileModalOpen(true); setIsMenuOpen(false); }} className="bg-white/5 rounded-[32px] p-5 border border-white/10 mb-4 text-center cursor-pointer group transition-all">
          <div className="w-20 h-20 rounded-2xl bg-blue-500 mx-auto mb-3 overflow-hidden border-2 border-white/20">{userData.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover" /> : <User className="m-auto mt-4 text-white" size={40} />}</div>
          <h3 className="font-black italic text-white uppercase truncate mb-3 leading-none">{userData.nombre}</h3>
          <button className="w-full py-2 bg-white text-[#0D47A1] rounded-xl font-black text-[10px] uppercase tracking-widest">Ver Perfil</button>
        </div>
        
        <div className="flex-1 space-y-2 mt-4">
          <button onClick={() => { setVistaActiva("inicio"); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-[10px] uppercase text-left ${vistaActiva === "inicio" ? 'bg-white text-[#0D47A1]' : 'bg-white/5 text-white hover:bg-white/10'}`}><Car size={18} /> Panel Reservas</button>
          <button onClick={() => { setVistaActiva("rutas"); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-[10px] uppercase text-left ${vistaActiva === "rutas" ? 'bg-white text-[#0D47A1]' : 'bg-white/5 text-white hover:bg-white/10'}`}><Clock size={18} /> Historial Abordajes</button>
        </div>

        <div className="mt-auto pt-6 border-t border-white/10 text-left">
          <p className="text-[9px] font-black uppercase text-blue-300 mb-2 flex items-center gap-1"><Code size={12}/> Desarrolladores</p>
          <p className="text-xs font-bold text-white leading-tight">José Miguel Medina</p>
          <p className="text-xs font-bold text-white mb-5 leading-tight">Starling Chirino</p>
          <button onClick={handleLogout} className="w-full p-4 bg-red-500/10 rounded-[20px] font-black text-red-400 text-[10px] uppercase border border-red-500/20 hover:bg-red-50 hover:text-white transition-all flex items-center justify-center gap-2"><LogOut size={16} /> Salir del Sistema</button>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-[#0D47A1] pt-20 pb-8 px-8 rounded-b-[45px] flex justify-between items-center z-20 shadow-xl shrink-0">
        <button onClick={() => setIsMenuOpen(true)} className="bg-white/10 p-3 rounded-2xl border border-white/10 hover:bg-white/15"><Menu size={24} /></button>
        <div className="text-right">
          <h1 className="text-2xl font-black italic tracking-tighter leading-none uppercase">HOLA, {userData.nombre}</h1>
          <p className="text-blue-400 text-[9px] font-black uppercase tracking-widest mt-1">SISTEMA UNIROUTE ACTIVO</p>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 px-6 pt-6 pb-96 overflow-y-auto no-scrollbar space-y-6">
        
        {/* VISTA 1: INICIO */}
        {vistaActiva === "inicio" && (
          <>
            {!userData.kyc_verificado && (
              <div className="p-5 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-[30px] flex items-center gap-4">
                <AlertTriangle size={28} className="shrink-0 text-amber-400" />
                <p className="text-[11px] font-medium">Valida tu carnet en el menú lateral para reservar asientos.</p>
              </div>
            )}

            {selectedUnit ? (
              <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                
                {/* 🌍 MAPA INTERACTIVO ZOOM X15 Y CURVAS REALES */}
                <div className="bg-white rounded-[40px] p-2 shadow-2xl border-4 border-white/10 relative overflow-hidden">
                  <div className="w-full h-72 rounded-[32px] overflow-hidden z-10 relative border border-slate-100 shadow-inner">
                    <MapContainer center={COORDENADAS_PUNTOS.UNEFA} zoom={15} scrollWheelZoom={false} className="w-full h-full z-0">
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      
                      {/* 🔥 RUTAS CON TRAZADO DENSO (CURVAS) 🔥 */}
                      <Polyline positions={RUTA_UNEFA_CENTRO} color="#1E3A8A" weight={8} opacity={0.3} />
                      <Polyline positions={RUTA_UNEFA_CENTRO} color="#3B82F6" weight={4} opacity={1} />
                      
                      <Polyline positions={RUTA_PUNTACARDON_UNEFA} color="#047857" weight={8} opacity={0.3} />
                      <Polyline positions={RUTA_PUNTACARDON_UNEFA} color="#10B981" weight={4} opacity={1} />
                      
                      {/* 🔥 SÓLO 3 MARCADORES FIJOS 🔥 */}
                      <Marker position={COORDENADAS_PUNTOS.UNEFA} icon={iconParada}><Popup><span className="font-bold text-[#0D47A1]">Sede UNEFA</span></Popup></Marker>
                      <Marker position={COORDENADAS_PUNTOS.Centro} icon={iconParada}><Popup><span className="font-bold text-[#0D47A1]">Parada Centro</span></Popup></Marker>
                      <Marker position={COORDENADAS_PUNTOS.PuntaCardon} icon={iconParada}><Popup><span className="font-bold text-[#0D47A1]">Parada Punta Cardón</span></Popup></Marker>

                      {/* EL VEHÍCULO EN MOVIMIENTO ULTRA FLUIDO */}
                      <Marker position={busLocation} icon={iconAutobus}>
                        <Popup>
                          <div className="text-center font-bold text-slate-800">
                            <p className="text-xs text-[#0D47A1] uppercase font-black">Unidad: {selectedUnit.placa_vehiculo}</p>
                          </div>
                        </Popup>
                      </Marker>
                      <RecenterMap coords={busLocation} />
                    </MapContainer>
                  </div>
                </div>

                {/* INFO DE LA UNIDAD ACTIVA */}
                <div className="bg-gradient-to-br from-[#2979FF] to-[#1566D0] rounded-[40px] p-8 shadow-2xl relative border border-white/10">
                  <div className="relative z-10 text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1 flex items-center gap-1"><Car size={12}/> Detalles de Viaje</p>
                    <h2 className="text-4xl font-black italic tracking-tighter mb-6 uppercase leading-none">UNIDAD {selectedUnit.placa_vehiculo}</h2>
                    <div className="flex gap-4">
                      <div className="bg-white/15 px-5 py-3 rounded-2xl flex-1 text-center"><p className="text-[9px] font-black uppercase opacity-60 mb-1">Próxima Salida</p><p className="text-xl font-black italic">{selectedUnit.hora_salida}</p></div>
                      <div className="bg-white/15 px-5 py-3 rounded-2xl flex-1 text-center"><p className="text-[9px] font-black uppercase opacity-60 mb-1">Disponibles</p><p className="text-xl font-black italic">{selectedUnit.puestos_libres} Puestos</p></div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center text-blue-300 opacity-70 p-6 border-2 border-dashed border-blue-400/30 rounded-[30px]"><p className="text-xs font-bold uppercase italic">No hay unidades en ruta en este momento</p></div>
            )}

            {/* LISTADO DE VEHÍCULOS */}
            <div className="space-y-4 pt-4">
              <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.3em] ml-4 mb-2">Otras Unidades Activas</p>
              {unidadesDisponibles.length > 0 ? (
                unidadesDisponibles.map(u => {
                  const nombreChoferCompleto = u.nombre ? `${u.nombre} ${u.apellido || ''}`.trim() : "Conductor Asignado";
                  return (
                    <div key={u.id} onClick={() => setSelectedUnitId(u.id)} className={`cursor-pointer transition-all duration-300 rounded-[30px] border-2 overflow-hidden flex flex-col bg-white/5 backdrop-blur-sm ${selectedUnitId === u.id || (selectedUnit?.id === u.id && !selectedUnitId) ? 'border-emerald-400 bg-[#1e40af] scale-[1.02] shadow-2xl' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                      <div className="bg-black/20 px-5 py-3 flex justify-between items-center border-b border-white/5">
                        <span className="font-black uppercase text-[11px] text-white/90 flex items-center gap-1.5"><User size={12}/> {nombreChoferCompleto}</span>
                        <span className="bg-white text-[#0D47A1] px-3 py-0.5 rounded text-[10px] font-black tracking-wider shadow-sm">{u.placa_vehiculo}</span>
                      </div>
                      <div className="p-2"><VehicleCard nombre={u.ruta || "Circuito"} puestos={u.puestos_libres} horaSalida={u.hora_salida || "Pendiente"} /></div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs opacity-50 uppercase tracking-widest font-bold">No hay choferes activos actualmente</p>
              )}
            </div>
          </>
        )}

        {/* VISTA 2: HISTORIAL */}
        {vistaActiva === "rutas" && (
          <div className="space-y-5 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center px-2"><h2 className="text-xl font-black italic uppercase tracking-tight">Historial de Abordajes</h2><button onClick={() => setVistaActiva("inicio")} className="text-[10px] bg-white/10 px-3 py-1.5 rounded-xl uppercase font-black">Volver</button></div>
            {misReservasHistorial.map((res, index) => {
              const choferRes = unidades.find(u => u.placa_vehiculo === res.unidad);
              const nombreChof = choferRes ? `${choferRes.nombre} ${choferRes.apellido}`.trim() : 'El conductor';

              return (
                <div key={res.id || index} className="bg-white rounded-[24px] shadow-2xl text-[#0D47A1] p-6 flex flex-col">
                  <div className="flex justify-between items-center border-b pb-4 mb-4">
                    <div><p className="text-sm font-black italic uppercase text-[#1566D0]">Unidad {res.unidad}</p><p className="text-[10px] font-bold text-gray-400 uppercase">Puestos: {res.puestos} Asiento(s)</p></div>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{res.fecha} - {res.hora}</span>
                  </div>
                  
                  {res.estado_conductor !== 'Pendiente' && (
                    <div className={`p-4 rounded-xl mb-4 text-xs font-bold italic ${res.estado_conductor === 'Confirmado' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      {nombreChof} dice: "{res.mensaje_conductor || 'Tu puesto te espera en la unidad.'}"
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => { setTicketData(res); setShowTicket(true); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#1566D0] py-3 rounded-xl font-black text-[10px] uppercase">Revisar Ticket</button>
                    <button onClick={() => marcarComoResuelto(res.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-black text-[10px] uppercase">Marcar Completado</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* SECTOR INFERIOR ACCIÓN */}
      {vistaActiva === "inicio" && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1566D0] via-[#1566D0] to-transparent pt-32 z-30 flex flex-col gap-3">
          {selectedUnit && userData.kyc_verificado && !limiteAlcanzado && (
            <div className="flex flex-col gap-3 bg-[#0D47A1] p-4 rounded-3xl border border-white/10 shadow-2xl max-w-sm mx-auto w-full">
              <span className="text-[10px] font-black uppercase text-blue-200">¿Dónde abordarás?</span>
              
              {/* 🔥 BOTONES DE RUTAS FIJOS (SÓLO 3) 🔥 */}
              <div className="flex gap-2">
                {['UNEFA', 'Centro', 'P. Cardón'].map((loc) => (
                  <button key={loc} onClick={() => setUbicacion(loc)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase ${ubicacion === loc ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white'}`}>{loc}</button>
                ))}
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-black uppercase text-blue-200">Asientos:</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button key={num} disabled={num > selectedUnit.puestos_libres} onClick={() => setPuestosA_Reservar(num)} className={`w-8 h-8 rounded-lg font-black text-xs ${puestosA_Reservar === num ? 'bg-blue-500 text-white scale-110' : 'bg-white/10 text-white disabled:opacity-20'}`}>{num}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {limiteAlcanzado ? (
            <div className="w-full py-5 rounded-[32px] bg-red-500 text-white font-black text-xs uppercase text-center tracking-widest animate-pulse shadow-2xl">⏳ Antispam: Espera {tiempoRestante} min</div>
          ) : (
            <button onClick={handleReserva} disabled={loadingReserva || !selectedUnit || !userData.kyc_verificado} className={`w-full py-6 rounded-[32px] font-black text-xl shadow-2xl uppercase italic flex items-center justify-center gap-4 transition-all ${!userData.kyc_verificado ? 'bg-gray-500 text-gray-300 opacity-40 shadow-none' : 'bg-white text-[#1566D0] active:scale-95'}`}>
              {loadingReserva ? <>Procesando <Loader2 className="animate-spin" /></> : !userData.kyc_verificado ? <>Bloqueado por KYC 🔒</> : <>Confirmar Ticket <ArrowRight size={24} /></>}
            </button>
          )}
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}