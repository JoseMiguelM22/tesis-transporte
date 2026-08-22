import React, { useState, useEffect, useCallback } from "react";
import { Lock, ArrowRight, ShieldAlert, KeyRound, LogOut, PackagePlus, Users, Edit2, Trash2, Search, LoaderCircle, AlertTriangle, LayoutDashboard, ImagePlus, MonitorSmartphone, Menu, X, CheckCircle2, Megaphone } from "lucide-react";
import { supabase } from "../../lib/supabase"; 
import imageCompression from 'browser-image-compression';

export default function GinevaAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [showSign, setShowSign] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const CORRECT_PIN = "Gineva2026";

  const [activeTab, setActiveTab] = useState('inventory'); 
  const [productos, setProductos] = useState([]);
  const [clientEntries, setClientEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  const [searchTerm, setSearchTerm] = useState("");

  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, message: "", onConfirm: null });

  const [promoUrl, setPromoUrl] = useState("");

  const [editingProduct, setEditingProduct] = useState(null);
  
  // 🔥 NUEVOS ESTADOS PARA MÚLTIPLES IMÁGENES 🔥
  const [imageFiles, setImageFiles] = useState([]); // Fotos nuevas seleccionadas
  const [existingImages, setExistingImages] = useState([]); // Fotos que ya estaban en la base de datos
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoria: 'Blusas',
    colores: '', 
    es_nuevo: true
  });

  useEffect(() => {
    const adminSession = localStorage.getItem("gineva_admin_auth");
    if (adminSession === "true") {
      setIsAuthenticated(true);
    }
    setTimeout(() => setShowSign(true), 500);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, activeTab]);

  const logoutUserAuto = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem("gineva_admin_auth");
    setSessionExpired(true);
  }, []);

  useEffect(() => {
    let timeoutId;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(logoutUserAuto, 15000);
    };

    if (isAuthenticated) {
      resetTimer();
      const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
      events.forEach(event => window.addEventListener(event, resetTimer));
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        events.forEach(event => window.removeEventListener(event, resetTimer));
      };
    }
  }, [isAuthenticated, logoutUserAuto]);

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 4000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      setIsAuthenticated(true);
      setLoginError(false);
      setSessionExpired(false);
      localStorage.setItem("gineva_admin_auth", "true");
    } else {
      setLoginError(true);
      setSessionExpired(false);
      setPin("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("gineva_admin_auth");
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'inventory' || activeTab === 'upload') {
        const { data, error: prodError } = await supabase.from('gineva_productos').select('*').order('created_at', { ascending: false });
        if (prodError) throw prodError;
        setProductos(data);
      } else if (activeTab === 'clients') {
        const { data, error: clientError } = await supabase.from('gineva_clientes').select('*').order('created_at', { ascending: false });
        if (clientError) throw clientError;
        setClientEntries(data);
      } else if (activeTab === 'marketing') {
        const { data, error: configError } = await supabase.from('gineva_config').select('*').eq('clave', 'ig_promo').single();
        if (configError && configError.code !== 'PGRST116') throw configError;
        if (data) setPromoUrl(data.valor);
      }
    } catch (err) {
      setError("Fallo de conexión con Supabase.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('gineva_config').upsert({ clave: 'ig_promo', valor: promoUrl });
      if (error) throw error;
      showToast("Enlace de publicidad actualizado en la tienda.");
    } catch (err) {
      setError("Error al guardar enlace: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  // 🔥 NUEVO MANEJADOR DE MÚLTIPLES ARCHIVOS 🔥
  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeNewFile = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({ nombre: '', descripcion: '', precio: '', stock: '', categoria: 'Blusas', colores: '', es_nuevo: true });
    setImageFiles([]);
    setExistingImages([]);
    setEditingProduct(null);
  };

  const prepareEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      precio: product.precio,
      stock: product.stock !== undefined ? product.stock : 0,
      categoria: product.categoria || 'Blusas',
      colores: product.colores || '',
      es_nuevo: product.es_nuevo
    });
    
    // Convertir el string separado por comas en un array de imágenes existentes
    setExistingImages(product.imagen_url ? product.imagen_url.split(',').filter(url => url.trim() !== '') : []);
    setImageFiles([]);
    setActiveTab('upload');
    setIsSidebarOpen(false); 
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.nombre || !formData.precio || formData.stock === '') {
      showToast("Campos obligatorios incompletos.", "error");
      setLoading(false);
      return;
    }

    try {
      let finalUploadedUrls = [...existingImages]; // Empezamos con las imágenes que decidimos conservar

      // 🔥 LÓGICA DE SUBIDA MÚLTIPLE COMPRIMIDA 🔥
      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1280, useWebWorker: true };
          let fileToUpload = file;
          try { fileToUpload = await imageCompression(file, options); } catch (compError) { console.error("Error compresión:", compError); }

          const fileExt = fileToUpload.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${i}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage.from('productos').upload(fileName, fileToUpload);
          if (uploadError) throw new Error(`Error subiendo imagen ${i + 1}: ${uploadError.message}`);

          const { data: publicUrlData } = supabase.storage.from('productos').getPublicUrl(fileName);
          finalUploadedUrls.push(publicUrlData.publicUrl);
        }
      }

      // Combinamos todas las URLs en un solo string separado por comas
      const urlsToSave = finalUploadedUrls.join(',');

      const productDataToSave = {
        nombre: formData.nombre, 
        descripcion: formData.descripcion, 
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock), 
        categoria: formData.categoria, 
        colores: formData.colores, 
        imagen_url: urlsToSave, // Array de URLs en string
        es_nuevo: formData.es_nuevo
      };

      if (editingProduct) {
        const { error: updateError } = await supabase.from('gineva_productos').update(productDataToSave).eq('id', editingProduct.id);
        if (updateError) throw new Error(`Error BD: ${updateError.message}`);
        showToast("Producto actualizado exitosamente.");
      } else {
        const { error: insertError } = await supabase.from('gineva_productos').insert([productDataToSave]);
        if (insertError) throw new Error(`Error BD: ${insertError.message}`);
        showToast("Producto registrado exitosamente.");
      }
      resetForm();
      setActiveTab('inventory');
    } catch (err) {
      console.error("Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmProductDelete = (id) => {
    setConfirmDialog({ visible: true, message: "Estás a punto de eliminar este producto del inventario. Esta acción no se puede deshacer.", onConfirm: () => executeProductDelete(id) });
  };

  const executeProductDelete = async (id) => {
    setConfirmDialog({ visible: false, message: "", onConfirm: null });
    setLoading(true);
    try {
      const { error: deleteError } = await supabase.from('gineva_productos').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setProductos(productos.filter(p => p.id !== id));
      showToast("Producto eliminado del sistema.");
    } catch (err) { setError("Fallo al eliminar el registro."); } finally { setLoading(false); }
  };

  const confirmClientDelete = (id) => {
    setConfirmDialog({ visible: true, message: "Estás a punto de eliminar el registro de este cliente. Esta acción no se puede deshacer.", onConfirm: () => executeClientDelete(id) });
  };

  const executeClientDelete = async (id) => {
    setConfirmDialog({ visible: false, message: "", onConfirm: null });
    setLoading(true);
    try {
      const { error: deleteError } = await supabase.from('gineva_clientes').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setClientEntries(clientEntries.filter(c => c.id !== id));
      showToast("Registro de cliente eliminado.");
    } catch (err) { setError("Fallo al eliminar el cliente."); } finally { setLoading(false); }
  };

  const formatMoney = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const parseDevice = (userAgent) => {
    if (!userAgent) return "Desconocido";
    const ua = userAgent.toLowerCase();
    if (ua.includes("android")) return "Android";
    if (ua.includes("iphone") || ua.includes("ipad")) return "iPhone / iOS";
    if (ua.includes("windows")) return "Windows PC";
    if (ua.includes("mac")) return "Mac OS";
    return "Otro Dispositivo";
  };

  const selectTab = (tab) => {
    if (tab === 'upload') resetForm();
    setActiveTab(tab);
    setSearchTerm(""); 
    setIsSidebarOpen(false);
  };

  const filteredProducts = productos.filter((product) => {
    return product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
           (product.categoria && product.categoria.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans bg-black">
        <div className="absolute inset-0 z-0">
          <img src="/comprageor.jpg" alt="Fondo Admin" className="w-full h-full object-cover opacity-60 scale-105 blur-md" />
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 w-full max-w-sm p-8 sm:p-10 mx-4 bg-white/95 backdrop-blur-xl rounded-[32px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-white/50 text-center animate-in zoom-in duration-500">
          <img src="/logoginegro.png" alt="Gineva" className="w-20 sm:w-24 h-auto mx-auto rounded-[14px] shadow-sm mb-6" />
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Lock size={20} className="text-neutral-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-black mb-1">Acceso Restringido</h2>
          <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-neutral-400 mb-8">Gineva Admin Workspace</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <div className="relative">
                <KeyRound size={16} className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${loginError || sessionExpired ? 'text-red-400' : 'text-neutral-400'}`} />
                <input type="password" placeholder="PIN de Seguridad" value={pin} onChange={(e) => { setPin(e.target.value); setLoginError(false); setSessionExpired(false); }} className={`w-full pl-12 pr-5 py-4 rounded-2xl bg-neutral-50 outline-none text-center tracking-[0.3em] font-black text-sm transition-all border-2 ${loginError || sessionExpired ? 'border-red-200 focus:border-red-400 bg-red-50/50' : 'border-transparent focus:border-[#E57B83] focus:bg-white'}`} autoComplete="off"/>
              </div>
              
              {loginError && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-2">PIN Incorrecto</p>}
              {sessionExpired && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-4 bg-red-50 py-2 px-3 rounded-lg border border-red-100">Sesión expirada por inactividad (15s)</p>}

            </div>
            <button type="submit" className="w-full py-4 mt-2 bg-black text-white rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center gap-3 active:scale-95 shadow-xl">
              Desbloquear Panel <ArrowRight size={16} />
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-neutral-100">
            <a href="/" className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 hover:text-[#E57B83] transition-colors">Volver a la Tienda</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F6] text-neutral-900 font-sans flex relative overflow-x-hidden">
      
      {toast.visible && (
        <div className="fixed bottom-6 right-6 md:top-6 md:bottom-auto md:right-6 z-[200] animate-in slide-in-from-right fade-in duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${toast.type === 'success' ? 'bg-black text-white border-neutral-800' : 'bg-red-50 text-red-600 border-red-200'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={20} className="text-[#E57B83]" /> : <AlertTriangle size={20} />}
            <span className="text-xs font-bold uppercase tracking-widest">{toast.message}</span>
            <button onClick={() => setToast({ ...toast, visible: false })} className="ml-4 text-neutral-400 hover:text-white transition-colors"><X size={16} /></button>
          </div>
        </div>
      )}

      {confirmDialog.visible && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-neutral-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto mb-6"><AlertTriangle size={28} /></div>
            <h3 className="text-2xl font-serif mb-3">Acción Crítica</h3>
            <p className="text-sm text-neutral-500 mb-8 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex flex-col gap-3">
              <button onClick={confirmDialog.onConfirm} className="w-full py-4 bg-red-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 active:scale-95">Sí, Eliminar Definitivamente</button>
              <button onClick={() => setConfirmDialog({ visible: false, message: "", onConfirm: null })} className="w-full py-4 bg-neutral-100 text-neutral-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors active:scale-95">Cancelar y Regresar</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER MÓVIL */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-center z-30 shadow-sm">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-neutral-100 rounded-lg text-neutral-600 hover:bg-neutral-200 transition-colors">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg font-bold">Admin</span>
          <img src="/logoginegro.png" alt="Gineva" className="h-8 w-auto rounded-lg object-contain" />
        </div>
      </div>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-in fade-in" onClick={() => setIsSidebarOpen(false)}></div>}

      <aside className={`fixed top-0 left-0 h-full md:h-auto md:top-6 md:bottom-6 md:left-6 w-[280px] md:w-64 bg-white md:rounded-[32px] shadow-2xl md:shadow-[0_8px_30px_rgb(0,0,0,0.08)] md:border border-neutral-100 flex flex-col z-50 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 right-4 p-2 text-neutral-400 hover:text-black bg-neutral-50 rounded-full"><X size={18} /></button>
        <div className="p-8 md:p-8 pt-12 md:pt-8 border-b border-neutral-100 flex flex-col items-center">
          <img src="/logoginegro.png" alt="Gineva" className="h-12 md:h-14 w-auto rounded-[12px] object-contain mb-4 shadow-sm" />
          <h1 className="font-serif text-lg text-center">Admin Workspace</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <button onClick={() => selectTab('upload')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'upload' ? 'bg-black text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}><PackagePlus size={18} /> Nuevo Registro</button>
          <button onClick={() => selectTab('inventory')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-black text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}><LayoutDashboard size={18} /> Inventario</button>
          <button onClick={() => selectTab('clients')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'clients' ? 'bg-black text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'}`}><Users size={18} /> Clientes</button>
          <button onClick={() => selectTab('marketing')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'marketing' ? 'bg-[#E57B83] text-white shadow-md' : 'text-neutral-500 hover:bg-neutral-50 hover:text-[#E57B83]'}`}><Megaphone size={18} /> Publicidad</button>
        </nav>
        <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 md:bg-transparent">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-neutral-200 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-neutral-600"><LogOut size={14} /> Salir del Panel</button>
        </div>
      </aside>

      <main className="flex-1 ml-0 md:ml-[300px] p-6 pt-24 md:p-10 md:pt-10 min-h-screen w-full overflow-x-hidden">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 md:mb-10 pb-6 border-b border-neutral-200">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif">¡Hola, Georgina!</h2>
            <p className="text-xs md:text-sm text-neutral-500 mt-2">Gestión operativa conectada a Supabase.</p>
          </div>
        </header>

        <div className="bg-white rounded-[24px] md:rounded-3xl p-6 md:p-10 shadow-sm border border-neutral-100 min-h-[600px] w-full">
          
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8 md:mb-10 pb-5 border-b border-neutral-100">
            <h3 className="text-xl md:text-2xl font-serif">
              {activeTab === 'inventory' && "Colección de Inventario"}
              {activeTab === 'clients' && "Directorio de Clientes"}
              {activeTab === 'marketing' && "Configuración de Publicidad"}
              {activeTab === 'upload' && (editingProduct ? `Edición de Pieza ID: ${editingProduct.id}` : "Registro de Nueva Pieza")}
            </h3>
            {activeTab === 'inventory' && (
               <div className="relative w-full lg:w-80">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                 <input 
                   type="text" 
                   placeholder="Buscar pieza..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-12 pr-4 py-3 md:py-2.5 rounded-full border border-neutral-200 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none" 
                  />
               </div>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center flex-col h-[300px] text-neutral-500 gap-3">
              <LoaderCircle size={40} className="animate-spin text-rose-500" />
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Conectando con Supabase...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center flex-col h-[300px] text-red-600 gap-3 bg-red-50 rounded-2xl p-6 text-center border border-red-200 mx-auto max-w-md">
              <AlertTriangle size={40} />
              <p className="text-xs md:text-sm font-bold uppercase tracking-wider">Error Operativo Detallado</p>
              <p className="text-xs md:text-sm bg-white p-3 rounded-lg border border-red-100 font-mono text-left w-full break-words">{error}</p>
              <button onClick={fetchData} className="mt-4 text-xs font-bold underline hover:text-red-800">Reintentar Conexión</button>
            </div>
          )}

          {/* TABLA: INVENTARIO */}
          {!loading && !error && activeTab === 'inventory' && (
            <>
              {productos.length === 0 ? ( 
                 <p className="text-center text-neutral-500 py-10 text-sm">La colección de piezas se encuentra vacía.</p> 
              ) : filteredProducts.length === 0 ? (
                 <div className="text-center py-10 text-sm text-neutral-500">
                   <p>No se encontró ninguna pieza con el término "<b>{searchTerm}</b>".</p>
                   <button onClick={() => setSearchTerm("")} className="mt-3 text-xs font-bold underline text-black">Limpiar búsqueda</button>
                 </div>
              ) : (
                <div className="overflow-x-auto w-full pb-4 scrollbar-hide">
                  <table className="w-full text-sm text-left min-w-[600px]">
                    <thead className="text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest bg-neutral-50 rounded-lg">
                      <tr>
                        <th className="px-4 py-4 rounded-l-lg">Imagen</th>
                        <th className="px-4 py-4">Nombre / Categoría</th>
                        <th className="px-4 py-4">Precio ($)</th>
                        <th className="px-4 py-4">Stock</th>
                        <th className="px-4 py-4 text-right rounded-r-lg">Gestión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredProducts.map((product) => {
                        // 🔥 Extraemos SOLO LA PRIMERA IMAGEN para la miniatura en la tabla
                        const primeraImagen = product.imagen_url ? product.imagen_url.split(',')[0] : '';
                        
                        return (
                          <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="px-4 py-4">
                              {primeraImagen ? ( 
                                <img src={primeraImagen} alt="Prod" className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-[10px] border border-neutral-200 shadow-sm"/> 
                              ) : ( 
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-neutral-100 rounded-[10px] flex items-center justify-center border border-neutral-200"><ImagePlus size={16} className="text-neutral-400"/></div> 
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-bold text-sm md:text-base leading-tight text-neutral-900">{product.nombre}</p>
                              <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-neutral-500 mt-1 font-bold">{product.categoria}</p>
                            </td>
                            <td className="px-4 py-4 text-[#E57B83] font-bold whitespace-nowrap">{formatMoney(product.precio)}</td>
                            <td className="px-4 py-4 font-mono font-medium text-neutral-600">{product.stock || 0}</td>
                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => prepareEdit(product)} className="p-2 md:p-2.5 bg-white rounded-lg text-neutral-600 hover:bg-neutral-100 border border-neutral-200 shadow-sm"><Edit2 size={16} /></button>
                                <button onClick={() => confirmProductDelete(product.id)} className="p-2 md:p-2.5 bg-white rounded-lg text-red-500 hover:bg-red-50 border border-neutral-200 shadow-sm"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* TABLA: CLIENTES */}
          {!loading && !error && activeTab === 'clients' && (
            <>
               {clientEntries.length === 0 ? ( <p className="text-center text-neutral-500 py-10 text-sm">El directorio de clientes se encuentra vacío.</p> ) : (
                <div className="overflow-x-auto w-full pb-4 scrollbar-hide">
                    <table className="w-full text-sm text-left min-w-[700px]">
                    <thead className="text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest bg-neutral-50 rounded-lg">
                        <tr>
                        <th className="px-4 py-4 rounded-l-lg">Fecha de Registro</th>
                        <th className="px-4 py-4">Nombre Completo</th>
                        <th className="px-4 py-4">Dispositivo Principal</th>
                        <th className="px-4 py-4 text-right rounded-r-lg">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {clientEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-neutral-50/50">
                            <td className="px-4 py-4 font-mono text-[10px] md:text-xs text-emerald-700 whitespace-nowrap">{new Date(entry.created_at).toLocaleString('es-VE')}</td>
                            <td className="px-4 py-4 font-sans text-xs md:text-sm font-bold uppercase text-neutral-900">{entry.nombre} {entry.apellido}</td>
                            <td className="px-4 py-4"><span className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 border border-neutral-200 rounded-lg w-fit text-[10px] md:text-xs font-bold uppercase tracking-widest text-neutral-600 whitespace-nowrap"><MonitorSmartphone size={14} className="text-neutral-500" />{parseDevice(entry.ip_o_dispositivo)}</span></td>
                            <td className="px-4 py-4 text-right"><button onClick={() => confirmClientDelete(entry.id)} className="p-2 md:p-2.5 bg-white rounded-lg text-red-500 hover:bg-red-50 hover:border-red-200 border border-neutral-200 shadow-sm inline-flex"><Trash2 size={16} /></button></td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
              )}
            </>
          )}

          {/* TAB DE PUBLICIDAD */}
          {!loading && !error && activeTab === 'marketing' && (
            <form onSubmit={handleSavePromo} className="max-w-2xl space-y-6 animate-in fade-in">
              <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-200">
                <div className="w-12 h-12 rounded-full bg-[#E57B83]/10 flex items-center justify-center text-[#E57B83] mb-4">
                  <Megaphone size={24} />
                </div>
                <h4 className="font-serif text-xl mb-2">Conexión con Enlaces Promocionales</h4>
                <p className="text-xs text-neutral-500 mb-6 leading-relaxed">Pega el enlace de un video promocional (Reel, Tiktok). El sistema lo convertirá automáticamente en un "Celular Interactivo" en la página principal de la tienda para tus clientas.</p>
                
                <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 block text-neutral-500">Enlace de la publicación *</label>
                <input type="url" placeholder="https://www.instagram.com/reel/..." value={promoUrl} onChange={(e) => setPromoUrl(e.target.value)} className="w-full p-4 rounded-[16px] border border-neutral-200 text-sm md:text-base outline-none focus:border-[#E57B83] focus:ring-1 focus:ring-[#E57B83] transition-all shadow-sm" />
                <p className="text-[10px] text-neutral-400 mt-3 font-bold uppercase tracking-widest">Deja el campo vacío para mostrar la foto estándar.</p>
              </div>
              
              <button type="submit" className="w-full sm:w-auto px-10 py-5 bg-[#E57B83] text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-rose-500 transition-all flex gap-3 items-center justify-center active:scale-95 shadow-lg shadow-rose-500/20">
                 Actualizar Publicidad Web
              </button>
            </form>
          )}

          {/* FORMULARIO UPLOAD (AHORA CON MÚLTIPLES IMÁGENES) */}
          {!loading && !error && activeTab === 'upload' && (
            <form onSubmit={handleProductSubmit} className="max-w-4xl space-y-6 md:space-y-8 animate-in fade-in">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 md:mb-3 block text-neutral-500">Nombre de la Pieza *</label>
                      <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className="w-full p-4 rounded-[16px] border border-neutral-200 text-sm md:text-base outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm" required />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 md:mb-3 block text-neutral-500">Categoría Oficial *</label>
                      <select name="categoria" value={formData.categoria} onChange={handleInputChange} className="w-full p-4 rounded-[16px] border border-neutral-200 text-sm md:text-base outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm bg-white" required>
                        <option value="Blusas">Blusas</option>
                        <option value="Bodys">Bodys</option>
                        <option value="Vestidos">Vestidos</option>
                        <option value="Conjuntos">Conjuntos</option>
                        <option value="Accesorios">Accesorios</option>
                      </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 md:mb-3 block text-neutral-500">Precio de Venta ($) *</label>
                      <input type="number" name="precio" step="0.01" value={formData.precio} onChange={handleInputChange} className="w-full p-4 rounded-[16px] border border-neutral-200 text-sm md:text-base outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm" required />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 md:mb-3 block text-neutral-500">Unidades Disponibles (Stock) *</label>
                      <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} className="w-full p-4 rounded-[16px] border border-neutral-200 text-sm md:text-base outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm" required />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 md:mb-3 block text-neutral-500">Colores Disponibles</label>
                    <input 
                      type="text" 
                      name="colores" 
                      value={formData.colores} 
                      onChange={handleInputChange} 
                      className="w-full p-4 rounded-[16px] border border-neutral-200 text-sm md:text-base outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm" 
                      placeholder="Ej: Negro, Blanco, Rojo" 
                    />
                    <p className="text-[9px] text-neutral-400 mt-2 uppercase tracking-widest font-bold">Separa los colores utilizando comas.</p>
                </div>

                <div>
                  <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 md:mb-3 block text-neutral-500">Descripción Detallada</label>
                  <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows="3" className="w-full p-4 rounded-[16px] border border-neutral-200 text-sm md:text-base outline-none focus:border-black focus:ring-1 focus:ring-black transition-all shadow-sm resize-none"></textarea>
                </div>

                {/* 🔥 ÁREA DE SUBIDA DE MÚLTIPLES IMÁGENES 🔥 */}
                <div className="bg-neutral-50 p-6 md:p-8 rounded-[24px] border border-neutral-200 border-dashed transition-all hover:bg-neutral-100">
                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-4 block text-center md:text-left text-neutral-500">Galería de Imágenes (Varios Colores/Ángulos)</label>
                    
                    <div className="flex flex-col gap-5">
                      
                      {/* PREVIEW DE LAS IMÁGENES */}
                      {(existingImages.length > 0 || imageFiles.length > 0) && (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide items-center w-full">
                          
                          {/* Imágenes Existentes (Si está editando) */}
                          {existingImages.map((url, index) => (
                            <div key={`ext-${index}`} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[14px] overflow-hidden shrink-0 border border-neutral-200 shadow-sm bg-white">
                              <img src={url} alt={`Existente ${index}`} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeExistingImage(index)} className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"><X size={12}/></button>
                            </div>
                          ))}

                          {/* Imágenes Nuevas (Las que acaba de seleccionar) */}
                          {imageFiles.map((file, index) => (
                            <div key={`new-${index}`} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[14px] overflow-hidden shrink-0 border-2 border-black shadow-md">
                              <span className="absolute top-1.5 left-1.5 bg-black text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-widest z-10">Nuevo</span>
                              <img src={URL.createObjectURL(file)} alt={`Nuevo ${index}`} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeNewFile(index)} className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors z-10"><X size={12}/></button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* BOTÓN PARA AÑADIR ARCHIVOS */}
                      <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 md:h-40 border-2 border-neutral-300 border-dashed rounded-2xl cursor-pointer bg-white hover:border-black hover:shadow-sm transition-all group">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                                  <ImagePlus className="w-8 h-8 md:w-10 md:h-10 mb-3 text-neutral-400 group-hover:text-black transition-colors" />
                                  <p className="mb-2 text-xs md:text-sm font-bold text-neutral-700 group-hover:text-black">Toca aquí para agregar fotos (Puedes seleccionar varias)</p>
                                  <p className="text-[10px] md:text-xs text-neutral-400 uppercase tracking-widest font-bold mt-1">Formatos: PNG, JPG, JPEG</p>
                              </div>
                              {/* El atributo "multiple" permite seleccionar varios archivos a la vez */}
                              <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                          </label>
                      </div>

                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-5 rounded-[16px] border border-neutral-200 shadow-sm w-fit">
                    <input type="checkbox" name="es_nuevo" id="es_nuevo" checked={formData.es_nuevo} onChange={handleInputChange} className="w-5 h-5 md:w-6 md:h-6 accent-black cursor-pointer" />
                    <label htmlFor="es_nuevo" className="text-[10px] md:text-xs font-bold uppercase tracking-wider cursor-pointer text-neutral-700 select-none pt-0.5">Colocar etiqueta "NUEVO" en tienda</label>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-8 md:pt-10 border-t border-neutral-100">
                    <button type="submit" className="w-full sm:w-auto px-10 py-5 bg-black text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 hover:shadow-lg transition-all flex gap-3 items-center justify-center active:scale-95"><PackagePlus size={18} /> {editingProduct ? "Ejecutar Actualización" : "Registrar en Base de Datos"}</button>
                    {editingProduct && <button type="button" onClick={resetForm} className="w-full sm:w-auto px-10 py-5 bg-white text-neutral-600 border border-neutral-200 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-neutral-50 hover:text-black transition-all flex items-center justify-center active:scale-95">Cancelar Edición</button>}
                </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}