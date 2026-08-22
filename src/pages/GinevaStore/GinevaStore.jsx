import React, { useState, useEffect } from "react";
import { Sun, Moon, ShoppingBag, ArrowRight, MapPin, X, Maximize2, ChevronLeft, Search, Play } from "lucide-react";
import { supabase } from "../../lib/supabase"; 

export default function GinevaStore() {
  const [loadingPreload, setLoadingPreload] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showPromoSign, setShowPromoSign] = useState(false);
  const [userData, setUserData] = useState({ nombre: "", apellido: "" });
  const [tempUser, setTempUser] = useState({ nombre: "", apellido: "" });
  
  const [activeView, setActiveView] = useState(() => window.location.hash.includes('catalogo') ? 'catalog' : 'home');

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // 🔥 NUEVO ESTADO PARA EL CARRUSEL DEL MODAL 🔥
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const [igPromoUrl, setIgPromoUrl] = useState("");

  const WHATSAPP_NUMBER = "584246461218"; 
  const COLOR_ROSA = "#E57B83"; 

  useEffect(() => {
    const handleHashChange = () => setActiveView(window.location.hash.includes('catalogo') ? 'catalog' : 'home');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingPreload(false);
      const savedUser = localStorage.getItem("gineva_user");
      if (savedUser) setUserData(JSON.parse(savedUser));
      else setShowWelcomeModal(true);
      setTimeout(() => setShowPromoSign(true), 1000);
    }, 2200);

    fetchData();
    return () => clearTimeout(timer);
  }, []);

  const fetchData = async () => {
    try {
      const { data: prodData } = await supabase.from('gineva_productos').select('*').order('created_at', { ascending: false });
      if (prodData) setProductos(prodData);
      
      const { data: configData } = await supabase.from('gineva_config').select('*').eq('clave', 'ig_promo').single();
      if (configData && configData.valor) setIgPromoUrl(configData.valor);
    } catch (e) { console.error("Error inicial:", e.message); } 
    finally { setLoadingProductos(false); }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{3,}$/;
    if (!nameRegex.test(tempUser.nombre.trim()) || !nameRegex.test(tempUser.apellido.trim())) return;
    
    localStorage.setItem("gineva_user", JSON.stringify(tempUser));
    setUserData(tempUser);
    setShowWelcomeModal(false);

    try {
      await supabase.from('gineva_clientes').insert([{ nombre: tempUser.nombre, apellido: tempUser.apellido, ip_o_dispositivo: navigator.userAgent }]);
    } catch (err) {}
  };

  const handleWhatsAppOrder = (producto, tipo) => {
    const clienteNombre = userData.nombre ? `${userData.nombre} ${userData.apellido}` : "Cliente";
    const intencion = tipo === "detalles" ? "quiero más detalles sobre" : "quiero comprar";
    const mensaje = producto 
      ? `Vengo de la página de GINEVA, soy ${clienteNombre} y ${intencion} la pieza: *${producto.nombre}* ($${producto.precio}).` 
      : `Vengo de la página de GINEVA, soy ${clienteNombre} y necesito ayuda para elegir mi prenda perfecta.`; 
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const changeView = (view) => {
    setActiveView(view);
    window.location.hash = view === 'catalog' ? 'catalogo' : '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatIgUrl = (url) => {
    if (!url) return "";
    try {
      let clean = url.split('?')[0]; 
      if (!clean.endsWith('/')) clean += '/';
      return clean + 'embed';
    } catch (e) { return ""; }
  };

  const filteredProducts = productos.filter((prod) => {
    const matchesSearch = prod.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || (prod.descripcion?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    let matchesCategory = true;
    if (activeCategory === "Nuevas") matchesCategory = prod.es_nuevo;
    else if (activeCategory !== "Todas") {
      const keyword = activeCategory.toLowerCase().replace(/s$/, ''); 
      matchesCategory = (prod.categoria && prod.categoria === activeCategory) || prod.nombre.toLowerCase().includes(keyword);
    }
    return matchesSearch && matchesCategory;
  });

  if (loadingPreload) {
    return (
      <div className={`fixed inset-0 flex flex-col items-center justify-center z-[300] transition-opacity duration-1000 ${darkMode ? 'bg-[#0B0B0B]' : 'bg-[#FBF9F6]'}`}>
        <div className="relative flex flex-col items-center justify-center animate-in fade-in duration-1000">
          <div className="relative p-2 mb-10 transform animate-[float_4s_ease-in-out_infinite]">
            <img src="/logoginegro.png" alt="Logo" className={`w-40 sm:w-56 h-auto object-contain rounded-[24px] shadow-2xl transition-all ${darkMode ? 'invert opacity-90' : ''}`} />
            <div className="absolute inset-0 rounded-[24px] shadow-[0_0_40px_rgba(229,123,131,0.15)] pointer-events-none"></div>
          </div>
          <div className="flex flex-col items-center gap-5">
            <span className={`text-[9px] uppercase tracking-[0.6em] font-bold ml-2 ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>Preparando Experiencia</span>
            <div className={`w-32 h-[1px] relative overflow-hidden rounded-full ${darkMode ? 'bg-neutral-800' : 'bg-[#E57B83]/30'}`}>
              <div className="absolute top-0 left-0 w-1/2 h-full bg-[#E57B83] animate-[load-bar_1.5s_infinite_ease-in-out]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-[#1A0B0E] via-[#0B0B0B] to-[#0A0A0A] text-white' : 'bg-gradient-to-br from-[#FFF0F3] via-[#FDF8F5] to-[#FDF8F5] text-neutral-900'}`}>
      
      <style>{`
        @keyframes load-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        @keyframes marquee-reverse { 0% { transform: translateX(-50%); } 100% { transform: translateX(0%); } }
        @keyframes dropSwingInfinite { 0% { transform: translateY(-100%) rotate(15deg); opacity: 0; } 8% { transform: translateY(0) rotate(-10deg); opacity: 1; } 12% { transform: translateY(0) rotate(5deg); } 16% { transform: translateY(0) rotate(-2deg); } 20% { transform: translateY(0) rotate(0deg); opacity: 1; } 53.8% { transform: translateY(0) rotate(0deg); opacity: 1; } 61.5% { transform: translateY(-100%) rotate(-15deg); opacity: 0; } 100% { transform: translateY(-100%) rotate(0deg); opacity: 0; } }
        .animate-drop-swing-infinite { animation: dropSwingInfinite 13s infinite cubic-bezier(0.25, 0.8, 0.25, 1); transform-origin: top center; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* CARTEL PROMOCIONAL COLGANTE */}
      {showPromoSign && (
        <div className="fixed top-0 right-[5%] sm:right-[15%] z-[40] flex flex-col items-center animate-drop-swing-infinite drop-shadow-2xl">
          <div className="flex gap-16 sm:gap-24">
            <div className={`w-[2px] h-[110px] sm:h-[140px] ${darkMode ? 'bg-neutral-600' : 'bg-[#E57B83]'}`}></div>
            <div className={`w-[2px] h-[110px] sm:h-[140px] ${darkMode ? 'bg-neutral-600' : 'bg-[#E57B83]'}`}></div>
          </div>
          <div className={`relative pointer-events-auto flex flex-col items-center px-6 sm:px-8 py-3 rounded-b-xl rounded-t-sm shadow-2xl border-b-4 ${darkMode ? 'bg-[#141414] border-[#E57B83]' : 'bg-black border-[#E57B83]'}`}>
            <button onClick={() => setShowPromoSign(false)} className="absolute top-1.5 right-1.5 p-1 text-white/50 hover:text-white transition-colors bg-white/10 rounded-full hover:bg-white/20">
              <X size={10} />
            </button>
            <span className="text-white text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-1">✨ Envíos gratis ✨</span>
            <span className="text-[#E57B83] text-[7px] sm:text-[8px] font-bold uppercase tracking-widest mt-1">En Punto Fijo</span>
          </div>
        </div>
      )}

      {/* BOTÓN MODO OSCURO */}
      <button onClick={() => setDarkMode(!darkMode)} className={`fixed bottom-6 right-6 z-[100] p-4 rounded-full shadow-2xl border transition-all hover:scale-110 active:scale-95 ${darkMode ? 'bg-[#141414] border-neutral-800 text-amber-400' : 'bg-white border-neutral-200 text-neutral-600'}`}>{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>

      {/* LIGHTBOX DE IMAGEN */}
      {selectedImage && (
        <div className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><X size={24} /></button>
          <img src={selectedImage} alt="Zoom" className="max-w-full max-h-[90vh] object-contain rounded-2xl animate-in zoom-in duration-300" />
        </div>
      )}

      {/* 🔥 MODAL DETALLES DEL PRODUCTO CON CARRUSEL Y COLORES 🔥 */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300" onClick={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null) }}>
          <div className={`relative w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-[32px] flex flex-col md:flex-row shadow-2xl animate-in zoom-in duration-300 ${darkMode ? 'bg-[#141414] border border-neutral-800' : 'bg-[#FDF8F5]'}`}>
            
            <button onClick={() => setSelectedProduct(null)} className={`absolute top-4 right-4 p-2 rounded-full z-10 backdrop-blur-md transition-colors ${darkMode ? 'bg-black/50 text-white hover:bg-black' : 'bg-white/80 text-black shadow-md hover:bg-white'}`}><X size={20} /></button>
            
            {/* PROCESAMIENTO DE LAS IMAGENES DEL MODAL */}
            {(() => {
              const modalImagesArray = selectedProduct.imagen_url ? selectedProduct.imagen_url.split(',').filter(u => u.trim() !== '') : [];
              const currentModalImage = modalImagesArray.length > 0 ? modalImagesArray[modalImageIndex] : '';

              return (
                <>
                  <div className="w-full md:w-1/2 h-[350px] md:h-auto relative cursor-zoom-in group bg-neutral-100" onClick={() => setSelectedImage(currentModalImage)}>
                    {currentModalImage ? (
                      <img src={currentModalImage} alt={selectedProduct.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400"><ImagePlus size={40}/></div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Maximize2 size={32} className="text-white drop-shadow-lg" /></div>
                  </div>
                  
                  <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] mb-3" style={{ color: COLOR_ROSA }}>Pieza Exclusiva</span>
                    <h2 className="text-3xl md:text-4xl font-serif mb-2">{selectedProduct.nombre}</h2>
                    <span className="text-2xl font-bold mb-6">${selectedProduct.precio}</span>
                    
                    <p className={`text-sm leading-relaxed mb-8 ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      {selectedProduct.descripcion || "Una pieza diseñada con elegancia."}
                    </p>

                    {/* 🔥 MINIATURAS DEL CARRUSEL 🔥 */}
                    {modalImagesArray.length > 1 && (
                      <div className="mb-6">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Más ángulos / vistas</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {modalImagesArray.map((img, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => setModalImageIndex(idx)} 
                              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${modalImageIndex === idx ? (darkMode ? 'border-white' : 'border-black') : 'border-transparent opacity-60 hover:opacity-100 shadow-sm'}`}
                            >
                              <img src={img} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 🔥 ETIQUETAS DE COLORES DINÁMICAS 🔥 */}
                    <div className="flex flex-col sm:flex-row gap-6 mb-10">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Talla Única</p>
                        <span className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase ${darkMode ? 'bg-white text-black' : 'bg-black text-white'}`}>Talla U</span>
                      </div>
                      
                      {selectedProduct.colores && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Colores Disponibles</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.colores.split(',').filter(c => c.trim() !== '').map((color, idx) => (
                              <span key={idx} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase border shadow-sm ${darkMode ? 'bg-[#1A1A1A] border-neutral-700 text-neutral-200' : 'bg-white border-neutral-200 text-neutral-600'}`}>
                                {color.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button onClick={() => { handleWhatsAppOrder(selectedProduct, "comprar"); setSelectedProduct(null); }} className="w-full py-4 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-xl active:scale-95" style={{ backgroundColor: COLOR_ROSA }}>Comprar por WhatsApp <ArrowRight size={16}/></button>
                  </div>
                </>
              );
            })()}

          </div>
        </div>
      )}

      {/* MODAL BIENVENIDA */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[250] flex items-center justify-center p-6">
          <div className={`w-full max-w-sm rounded-[32px] p-8 shadow-2xl border text-center animate-in zoom-in duration-300 ${darkMode ? 'bg-[#141414] border-neutral-800' : 'bg-[#FDF8F5] border-neutral-200'}`}>
            <img src="/logoginegro.png" alt="Logo" className={`w-28 mx-auto mb-4 object-contain rounded-[16px] shadow-sm ${darkMode ? 'invert opacity-90' : ''}`} />
            <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-6">Bienvenida a nuestra experiencia</p>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <input type="text" required placeholder="Tu nombre" pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+" title="Solo letras, mínimo 3 caracteres" value={tempUser.nombre} onChange={(e) => setTempUser({...tempUser, nombre: e.target.value})} className={`w-full px-5 py-4 rounded-2xl text-xs font-medium border outline-none focus:border-[#E57B83] transition-all ${darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200'}`}/>
              <input type="text" required placeholder="Tu apellido" pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+" title="Solo letras, mínimo 3 caracteres" value={tempUser.apellido} onChange={(e) => setTempUser({...tempUser, apellido: e.target.value})} className={`w-full px-5 py-4 rounded-2xl text-xs font-medium border outline-none focus:border-[#E57B83] transition-all ${darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-white border-neutral-200'}`}/>
              <button type="submit" className={`w-full py-4 mt-2 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 ${darkMode ? 'bg-white text-black' : 'bg-black text-white hover:bg-neutral-800'}`}>Explorar Colección</button>
            </form>
          </div>
        </div>
      )}

      {/* HEADER NAVEGACIÓN */}
      <div className="fixed top-6 left-0 w-full z-50 px-4 pointer-events-none flex justify-center">
        <header className={`pointer-events-auto w-full max-w-4xl rounded-full backdrop-blur-xl border shadow-[0_8px_30px_rgb(0,0,0,0.08)] px-5 py-3 flex justify-between items-center transition-all duration-500 ${darkMode ? 'bg-[#141414]/90 border-neutral-800' : 'bg-white/80 border-white/50'}`}>
          <div className="flex items-center"><img src="/logoginegro.png" alt="Gineva" onClick={() => changeView("home")} className={`h-8 sm:h-10 w-auto object-contain rounded-[12px] shadow-sm cursor-pointer hover:scale-105 ${darkMode ? 'invert' : ''}`} /></div>
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-8 text-[9px] font-bold uppercase tracking-widest text-neutral-400 items-center">
            <span onClick={() => changeView("home")} className={`cursor-pointer transition-colors ${activeView === "home" ? (darkMode ? 'text-white' : 'text-black') : 'hover:text-[#E57B83]'}`}>Inicio</span>
            <span onClick={() => changeView("catalog")} className={`cursor-pointer transition-colors ${activeView === "catalog" ? (darkMode ? 'text-white' : 'text-black') : 'hover:text-[#E57B83]'}`}>Tienda</span>
          </nav>
          <div className="flex items-center gap-4 sm:gap-6">
            <button onClick={() => changeView("catalog")} style={{ backgroundColor: COLOR_ROSA }} className="px-6 py-3 rounded-full text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-rose-500/20 active:scale-95 flex items-center gap-2"><ShoppingBag size={14}/> <span className="hidden sm:inline">Comprar</span></button>
          </div>
        </header>
      </div>

      {/* ========================================================
          VISTA 1: INICIO (HOME)
          ======================================================== */}
      {activeView === "home" && (
        <div className="animate-in fade-in duration-700">
          <main className="w-full">
            <div className="relative w-full min-h-[85vh] flex flex-col justify-center items-center overflow-hidden">
              <div className="absolute inset-0 z-0">
                <img src="/comprageor.jpg" alt="Fondo" className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 backdrop-blur-[2px]"></div>
              </div>
              <div className="relative z-10 text-center space-y-6 max-w-2xl mx-auto px-6 pt-32 pb-12 drop-shadow-2xl">
                <span className="text-[10px] uppercase tracking-[0.4em] text-white/80 font-bold">Moda Femenina</span>
                <h1 className="text-5xl md:text-7xl font-serif tracking-tight leading-[1.1] text-white">Viste tu esencia <br /><span className="italic font-light" style={{ color: COLOR_ROSA, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>y brilla con luz propia</span></h1>
                <p className="text-sm text-white/90 max-w-sm mx-auto leading-relaxed pt-2">Descubre piezas exclusivas diseñadas con elegancia y carácter.</p>
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button onClick={() => changeView("catalog")} className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors shadow-xl">Ver Colección</button>
                </div>
              </div>
            </div>

            <div className="relative w-full overflow-hidden flex items-center z-20 py-4 shadow-2xl transform -rotate-2 origin-center border-y scale-105" style={{ backgroundColor: COLOR_ROSA, borderColor: 'rgba(255,255,255,0.2)', marginTop: '-25px' }}>
              <div className="animate-[marquee_60s_linear_infinite] whitespace-nowrap flex gap-12 md:gap-20 items-center px-6">
                {[...Array(30)].map((_, i) => ( <img key={i} src="/logoginegro.png" className={`h-10 md:h-14 w-auto object-contain rounded-[14px] md:rounded-[18px] shadow-sm ${darkMode ? 'invert opacity-90' : ''}`} alt="Gineva" /> ))}
              </div>
            </div>

            <section className="w-full bg-[#050505] text-white py-32 px-6">
              <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="relative rounded-[32px] overflow-hidden bg-neutral-900 aspect-[4/5] md:aspect-square shadow-2xl shadow-black/50 group">
                  <img src="/geo.jpeg" alt="Georgina Petit" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000" />
                </div>
                <div className="space-y-8 text-left md:pl-6">
                  <div className="space-y-3">
                    <span className="text-[#E57B83] text-[10px] font-bold uppercase tracking-[0.3em]">Detrás de Gineva</span>
                    <h2 className="text-5xl lg:text-6xl font-serif tracking-tight">Georgina Petit</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-[#1A1A1A] border border-neutral-800 text-[9px] px-4 py-2 rounded-full uppercase tracking-widest font-bold text-neutral-300">22 Años</span>
                    <span className="bg-[#1A1A1A] border border-neutral-800 text-[9px] px-4 py-2 rounded-full uppercase tracking-widest font-bold text-neutral-300">Ingeniera de Sistemas</span>
                    <span className="bg-[#1A1A1A] border border-neutral-800 text-[9px] px-4 py-2 rounded-full uppercase tracking-widest font-bold text-neutral-300 flex items-center gap-1"><MapPin size={10}/> Punto Fijo</span>
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed max-w-md">GINEVA nace de mi pasión por la moda y el deseo de crear una marca que celebre la esencia de cada mujer. Como Ingeniera de Sistemas, combino mi visión tecnológica con el amor por el diseño para ofrecerte prendas que te hagan sentir segura y radiante.</p>
                </div>
              </div>
            </section>

            <div className="relative w-full overflow-hidden flex items-center z-20 py-4 shadow-2xl transform rotate-2 origin-center border-y scale-105" style={{ backgroundColor: COLOR_ROSA, borderColor: 'rgba(255,255,255,0.2)'}}>
              <div className="animate-[marquee-reverse_60s_linear_infinite] whitespace-nowrap flex gap-12 md:gap-20 items-center px-6">
                {[...Array(30)].map((_, i) => ( <img key={i} src="/logoginegro.png" className={`h-10 md:h-14 w-auto object-contain rounded-[14px] md:rounded-[18px] shadow-sm ${darkMode ? 'invert opacity-90' : ''}`} alt="Gineva" /> ))}
              </div>
            </div>

            <section className="w-full py-32 px-6 text-center">
              <div className="max-w-2xl mx-auto space-y-8">
                <h2 className={`font-serif text-4xl md:text-5xl ${darkMode ? 'text-white' : 'text-black'}`}>¿Lista para <span className="italic font-light" style={{ color: COLOR_ROSA }}>brillar</span>?</h2>
                <p className={`text-sm leading-relaxed max-w-lg mx-auto ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Escríbenos por WhatsApp y con gusto te ayudamos a elegir la prenda perfecta para ti.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <button onClick={() => handleWhatsAppOrder(null, "ayuda")} style={{ backgroundColor: COLOR_ROSA }} className="px-8 py-4 rounded-full text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg active:scale-95">Comprar por WhatsApp</button>
                  <span className={`text-[10px] font-bold tracking-widest ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>+58 4246461218</span>
                </div>
              </div>
            </section>
          </main>
        </div>
      )}

      {/* ========================================================
          VISTA 2: CATÁLOGO (SHOP)
          ======================================================== */}
      {activeView === "catalog" && (
        <div className="animate-in fade-in duration-700 min-h-[80vh] pb-20">
          
          <div className="relative w-full h-[50vh] md:h-[60vh] flex flex-col justify-center items-center overflow-hidden mb-8 md:mb-12">
            <div className="absolute inset-0 z-0">
              <img src="/comprageor.jpg" alt="Fondo Tienda" className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 backdrop-blur-[3px]"></div>
            </div>
            <div className="relative z-10 text-center space-y-4 max-w-2xl mx-auto px-6 pt-24 md:pt-20 drop-shadow-2xl">
              <span className="text-[10px] uppercase tracking-[0.4em] text-white/80 font-bold">Catálogo Oficial</span>
              <h1 className="text-6xl md:text-8xl font-serif tracking-tight text-white mb-2">TIENDA</h1>
              <p className="text-sm md:text-base text-white/90 max-w-sm mx-auto leading-relaxed">
                Piezas con <span className="italic font-light" style={{ color: COLOR_ROSA }}>esencia</span>
              </p>
              <div className="flex justify-center pt-8">
                <button onClick={() => changeView("home")} className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-white/60 hover:text-white transition-colors flex items-center gap-1.5 border border-white/20 hover:border-white/50 px-6 py-3 rounded-full backdrop-blur-md">
                  <ChevronLeft size={14}/> Volver al inicio
                </button>
              </div>
            </div>
          </div>

          <div className={`max-w-[1400px] mx-auto px-4 md:px-6 mb-8 md:mb-12`}>
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between transition-colors">
              <div className="flex gap-2 sm:gap-3 overflow-x-auto w-full md:w-auto pb-2 scrollbar-hide">
                {["Todas", "Nuevas", "Blusas", "Bodys", "Vestidos", "Conjuntos"].map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg' : 'bg-transparent border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:border-[#E57B83] hover:text-[#E57B83]'}`}>{cat}</button>
                ))}
              </div>
              <div className="relative w-full md:w-72">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input type="text" placeholder="Buscar piezas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-11 pr-4 py-3 rounded-full text-xs font-medium border outline-none focus:border-[#E57B83] transition-all shadow-sm ${darkMode ? 'bg-[#141414] border-neutral-800 text-white placeholder-neutral-600' : 'bg-white border-neutral-200 placeholder-neutral-400'}`}/>
              </div>
            </div>
            <div className="text-center md:text-left text-[10px] font-bold uppercase tracking-widest text-neutral-400 pt-4 md:pt-6 border-b border-neutral-100 dark:border-neutral-800 pb-6">Mostrando {filteredProducts.length} pieza{filteredProducts.length !== 1 ? 's' : ''}</div>
          </div>

          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            {loadingProductos ? (
              <div className="text-center py-20"><div className={`w-24 h-[1px] relative overflow-hidden rounded-full mx-auto ${darkMode ? 'bg-neutral-800' : 'bg-[#E57B83]/30'}`}><div className="absolute top-0 left-0 w-1/2 h-full bg-[#E57B83] animate-[load-bar_1.5s_infinite_ease-in-out]"></div></div></div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 space-y-4 animate-in fade-in"><ShoppingBag size={40} className="mx-auto text-neutral-300" /><p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">No encontramos piezas con esa búsqueda.</p><button onClick={() => {setSearchTerm(""); setActiveCategory("Todas");}} className="text-[10px] text-[#E57B83] font-bold uppercase tracking-widest underline underline-offset-4">Ver toda la colección</button></div>
            ) : (
              <div className={`grid grid-cols-1 ${igPromoUrl ? 'lg:grid-cols-3' : ''} gap-6 md:gap-12 items-start`}>
                
                {igPromoUrl && (
                  <div className="lg:col-span-1 flex justify-center lg:sticky lg:top-32 order-first lg:order-last mb-8 lg:mb-0 w-full z-10 relative">
                    <div className="relative w-[280px] sm:w-[320px] aspect-[9/16] bg-black rounded-[40px] shadow-[0_20px_60px_rgba(229,123,131,0.2)] overflow-hidden border-[8px] sm:border-[10px] border-neutral-900 ring-1 ring-neutral-700 animate-in zoom-in duration-700 mx-auto">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-5 sm:h-6 bg-neutral-900 rounded-b-xl sm:rounded-b-2xl z-20 pointer-events-none"></div>
                      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white">
                        <iframe src={formatIgUrl(igPromoUrl)} className="w-[calc(100%+2px)] h-[calc(100%+2px)] max-w-none" frameBorder="0" scrolling="no" allowTransparency="true" allow="encrypted-media"></iframe>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`${igPromoUrl ? 'lg:col-span-2' : 'w-full'}`}>
                  <div className={`grid grid-cols-2 sm:grid-cols-3 ${igPromoUrl ? 'xl:grid-cols-3' : 'lg:grid-cols-4'} gap-3 sm:gap-8`}>
                    {filteredProducts.map((prod) => {
                      // 🔥 LÓGICA DE EXTRACCIÓN DE LA PRIMERA FOTO PARA LA PORTADA 🔥
                      const portadaUrl = prod.imagen_url ? prod.imagen_url.split(',')[0].trim() : '';
                      
                      return (
                        <div key={prod.id} className="flex flex-col gap-1.5 md:gap-3 group animate-in zoom-in duration-500">
                          
                          <div onClick={() => { setSelectedProduct(prod); setModalImageIndex(0); }} className={`relative rounded-[16px] md:rounded-[32px] overflow-hidden aspect-[4/5] cursor-pointer shadow-sm ${darkMode ? 'bg-[#141414]' : 'bg-white'}`}>
                            {prod.es_nuevo && <span className="absolute top-2 left-2 md:top-4 md:left-4 z-10 bg-black text-white text-[7px] md:text-[9px] font-bold uppercase tracking-widest px-2 py-1 md:px-3 md:py-1.5 rounded-full shadow-lg">Nuevo</span>}
                            
                            {/* IMAGEN DE PORTADA */}
                            {portadaUrl ? (
                              <img src={portadaUrl} alt={prod.nombre} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${!darkMode ? 'mix-blend-multiply' : ''}`}/>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-300"><ImagePlus size={30}/></div>
                            )}

                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-1 pt-1 md:pt-2">
                            <h3 className="font-serif text-[13px] sm:text-xl md:text-2xl tracking-wide leading-tight line-clamp-1">{prod.nombre}</h3>
                            <span className="font-serif text-[12px] sm:text-lg md:text-xl font-bold mt-0.5 sm:mt-0 whitespace-nowrap">${prod.precio}</span>
                          </div>
                          
                          <p className={`hidden sm:block text-[11px] px-2 line-clamp-2 leading-relaxed ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>{prod.descripcion}</p>
                          
                          <div className="flex items-center gap-2 md:gap-3 px-1 md:px-2 text-[8px] md:text-[9px] text-neutral-400 uppercase font-bold tracking-widest mt-1">
                            <span className={`px-1.5 md:px-2 py-0.5 rounded ${darkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-white border border-neutral-200 text-neutral-500'}`}>Talla U</span>
                            <div className="flex gap-1 md:gap-1.5 items-center">
                              <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-black shadow-sm"></span>
                              <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white border border-neutral-200 shadow-sm"></span>
                              <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#8B2332] shadow-sm"></span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            <button onClick={() => { setSelectedProduct(prod); setModalImageIndex(0); }} className={`hidden sm:block py-2.5 md:py-3.5 rounded-full border text-[8px] md:text-[9px] font-bold uppercase tracking-widest transition-colors ${darkMode ? 'border-neutral-700 text-white hover:bg-white hover:text-black' : 'border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white'}`}>Detalles</button>
                            <button onClick={() => handleWhatsAppOrder(prod, "comprar")} style={{ backgroundColor: COLOR_ROSA }} className="py-2.5 md:py-3.5 rounded-xl sm:rounded-full text-[9px] font-bold uppercase tracking-widest text-white hover:opacity-90 transition-opacity shadow-sm active:scale-95">Comprar</button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* MEGA FOOTER CON ENLACE SECRETO AL PANEL ADMINISTRATIVO */}
      <footer className="bg-black text-white py-20 px-6 border-t border-neutral-900 mt-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="flex items-center gap-3">
              <img src="/logoginegro.png" alt="Gineva" className="h-10 w-auto object-contain rounded-[10px] invert opacity-90" />
              <a href="/gineva-admin" title="Acceso Administrativo" className="font-serif text-2xl tracking-widest hover:text-[#E57B83] transition-colors cursor-pointer">GINEVA.</a>
            </div>
            <p className="font-serif text-lg italic text-neutral-300">"Viste tu esencia y brilla con luz propia"</p>
            <button onClick={() => handleWhatsAppOrder(null, "ayuda")} style={{ backgroundColor: COLOR_ROSA }} className="px-5 py-2.5 rounded-full text-white text-[9px] font-bold tracking-widest flex items-center gap-2 hover:opacity-90 w-fit">+58 4246461218</button>
            <p className="text-[10px] text-neutral-500 leading-relaxed max-w-xs">Punto Fijo, Venezuela — Moda femenina con esencia.</p>
          </div>
          <div className="space-y-6 md:pl-10">
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Tienda</h4>
            <ul className="space-y-4 text-xs text-neutral-300">
              <li><button onClick={() => changeView("catalog")} className="hover:text-[#E57B83] transition-colors">Catálogo Completo</button></li>
              <li><button onClick={() => { changeView("catalog"); setActiveCategory("Nuevas"); }} className="hover:text-[#E57B83] transition-colors">Nuevas Piezas</button></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Gineva</h4>
            <ul className="space-y-4 text-xs text-neutral-300">
              <li><button onClick={() => changeView("home")} className="hover:text-[#E57B83] transition-colors">Sobre Nosotras</button></li>
              <li><a href="#" className="hover:text-[#E57B83] transition-colors">Contacto</a></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Ayuda</h4>
            <ul className="space-y-4 text-xs text-neutral-300">
              <li><a href="#" className="hover:text-[#E57B83] transition-colors">Tallas</a></li>
              <li><a href="#" className="hover:text-[#E57B83] transition-colors">Envíos a todo el país</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}