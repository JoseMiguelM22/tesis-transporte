import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const LeanClosetApp = () => {
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- ESTADOS DEL JUEGO / DASHBOARD ---
  const [activeTab, setActiveTab] = useState('closet'); 
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [closetItems, setClosetItems] = useState([]);
  const [prizeCards, setPrizeCards] = useState([]);
  
  // --- SISTEMA DE EQUIPAMIENTO ---
  const [equippedItems, setEquippedItems] = useState({ 
    hair: null, 
    glasses: null, 
    shirt: null, 
    jacket: null, 
    chain: null, 
    boots: null 
  });

  // --- IMAGEN DEL PERSONAJE PRINCIPAL (CAMBIA DINÁMICAMENTE) ---
  const [characterImage, setCharacterImage] = useState('leanna.png');
  const [characterAnimation, setCharacterAnimation] = useState(false);
  const [currentOutfitName, setCurrentOutfitName] = useState('Look Default');

  // --- SISTEMA DE COLOR DE CABELLO ---
  const hairColors = [
    { id: 'brown', name: 'Café', color: '#8B4513', filter: 'none' },
    { id: 'blonde', name: 'Rubio', color: '#FDE047', filter: 'brightness(1.2) sepia(1) hue-rotate(10deg) saturate(2)' },
    { id: 'red', name: 'Rojo', color: '#DC2626', filter: 'brightness(0.8) sepia(1) hue-rotate(-30deg) saturate(3)' },
    { id: 'black', name: 'Negro', color: '#111827', filter: 'brightness(0.2) grayscale(1)' },
    { id: 'pink', name: 'Rosa', color: '#F472B6', filter: 'brightness(1.1) sepia(1) hue-rotate(280deg) saturate(3)' },
    { id: 'blue', name: 'Azul', color: '#3B82F6', filter: 'brightness(0.9) sepia(1) hue-rotate(180deg) saturate(3)' },
    { id: 'purple', name: 'Morado', color: '#A855F7', filter: 'brightness(0.9) sepia(1) hue-rotate(250deg) saturate(3)' },
    { id: 'green', name: 'Verde', color: '#22C55E', filter: 'brightness(1) sepia(1) hue-rotate(80deg) saturate(3)' },
  ];
  const [activeHairColor, setActiveHairColor] = useState(hairColors[0].filter);

  const [styleLevel, setStyleLevel] = useState(10);
  
  // --- ESTADO PARA ANIMACIÓN DEL PERSONAJE ---
  const [characterScale, setCharacterScale] = useState(1);
  const [characterGlow, setCharacterGlow] = useState(false);
  const [showOdontoEffect, setShowOdontoEffect] = useState(false);

  // --- DICCIONARIO DE IMÁGENES DE PERSONAJES POR OUTFIT ---
  const characterImages = {
    default: 'leanna.png',
    odontologa: 'odont.png',
    fal: 'oufit.png',
    casual: 'leanna.png'  // usa la imagen por defecto para casual
  };

  // --- OUTFITS PREDEFINIDOS ---
  const outfits = [
    { 
      id: 'odontologa', 
      name: 'Odontóloga', 
      icon: '🦷', 
      image: 'odont.png',
      characterImage: 'odont.png',
      description: 'Bata blanca + lentes profesionales',
      bgColor: 'from-cyan-50 to-cyan-100',
      borderColor: 'border-cyan-200',
      textColor: 'text-cyan-700'
    },
    { 
      id: 'fal', 
      name: 'Look FAL', 
      icon: '✨', 
      image: 'oufit.png',
      characterImage: 'oufit.png',
      description: 'Fashion & Luxury elegante',
      bgColor: 'from-purple-50 to-pink-100',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700'
    },
    { 
      id: 'casual', 
      name: 'Look Casual', 
      icon: '👚', 
      image: null,
      characterImage: 'leanna.png',
      description: 'Estilo relajado y cómodo',
      bgColor: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700'
    }
  ];

  // Fecha límite: 8 de julio
  const isBirthday = new Date() >= new Date(new Date().getFullYear(), 6, 8);

  // --- FUNCIÓN PARA CAMBIAR LA IMAGEN DEL PERSONAJE CON ANIMACIÓN ---
  const changeCharacterImage = (newImage, outfitName) => {
    // Activar animación
    setCharacterAnimation(true);
    setCharacterScale(1.08);
    setCharacterGlow(true);
    
    // Cambiar la imagen después de un pequeño delay para el efecto
    setTimeout(() => {
      setCharacterImage(newImage);
      setCurrentOutfitName(outfitName);
    }, 100);
    
    // Efecto especial para odontóloga
    if (outfitName === 'Odontóloga') {
      setShowOdontoEffect(true);
      setTimeout(() => setShowOdontoEffect(false), 800);
    }
    
    // Resetear animación
    setTimeout(() => {
      setCharacterScale(1);
      setCharacterGlow(false);
      setCharacterAnimation(false);
    }, 400);
  };

  // --- FUNCIÓN PARA APLICAR OUTFIT CON CAMBIO DE IMAGEN DEL PERSONAJE ---
  const applyOutfit = async (outfitId) => {
    const selectedOutfit = outfits.find(o => o.id === outfitId);
    
    if (!selectedOutfit) return;
    
    // PRIMERO: Cambiar la imagen del personaje (efecto visual inmediato)
    changeCharacterImage(selectedOutfit.characterImage, selectedOutfit.name);
    
    // SEGUNDO: Actualizar las prendas en la base de datos (cambios internos)
    if (outfitId === 'casual') {
      // Resetear todas las prendas
      const newEquipped = { hair: null, glasses: null, shirt: null, jacket: null, chain: null, boots: null };
      setEquippedItems(newEquipped);
      
      for (const item of closetItems) {
        if (item.isEquipped) {
          await supabase.from('user_inventory').update({ is_equipped: false }).eq('id', item.inventoryId);
        }
      }
      setStyleLevel(10);
    } 
    else if (outfitId === 'odontologa') {
      // Buscar items de odontóloga
      const newEquipped = { ...equippedItems };
      const bataItem = closetItems.find(i => i.category === 'shirt' && (i.name.toLowerCase().includes('blanc') || i.name.toLowerCase().includes('bata')));
      const lentesItem = closetItems.find(i => i.category === 'glasses');
      
      if (bataItem) {
        newEquipped.shirt = bataItem.image_url;
        await supabase.from('user_inventory').update({ is_equipped: true }).eq('id', bataItem.inventoryId);
      }
      if (lentesItem) {
        newEquipped.glasses = lentesItem.image_url;
        await supabase.from('user_inventory').update({ is_equipped: true }).eq('id', lentesItem.inventoryId);
      }
      
      setEquippedItems(newEquipped);
      const equippedCount = Object.values(newEquipped).filter(Boolean).length;
      setStyleLevel(10 + (equippedCount * 15));
    }
    else if (outfitId === 'fal') {
      // Look FAL
      const newEquipped = { ...equippedItems };
      const lentesItem = closetItems.find(i => i.category === 'glasses');
      const camisaElegante = closetItems.find(i => i.category === 'shirt');
      const chaquetaElegante = closetItems.find(i => i.category === 'jacket');
      
      if (lentesItem) {
        newEquipped.glasses = lentesItem.image_url;
        await supabase.from('user_inventory').update({ is_equipped: true }).eq('id', lentesItem.inventoryId);
      }
      if (camisaElegante) {
        newEquipped.shirt = camisaElegante.image_url;
        await supabase.from('user_inventory').update({ is_equipped: true }).eq('id', camisaElegante.inventoryId);
      }
      if (chaquetaElegante) {
        newEquipped.jacket = chaquetaElegante.image_url;
        await supabase.from('user_inventory').update({ is_equipped: true }).eq('id', chaquetaElegante.inventoryId);
      }
      
      setEquippedItems(newEquipped);
      const equippedCount = Object.values(newEquipped).filter(Boolean).length;
      setStyleLevel(10 + (equippedCount * 15));
    }
    
    // Mostrar notificación
    showTemporaryMessage(`✨ ${selectedOutfit.name} activado! El personaje ha cambiado ✨`);
  };

  // --- NOTIFICACIÓN TEMPORAL ---
  const showTemporaryMessage = (message) => {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#1e1b2e';
    toast.style.color = '#f472b6';
    toast.style.padding = '10px 24px';
    toast.style.borderRadius = '100px';
    toast.style.fontWeight = 'bold';
    toast.style.fontSize = '0.85rem';
    toast.style.zIndex = '9999';
    toast.style.backdropFilter = 'blur(8px)';
    toast.style.border = '1px solid rgba(236,72,153,0.5)';
    toast.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 2500);
  };

  // --- VERIFICAR SESIÓN GUARDADA AL CARGAR (PERSISTENCIA) ---
  useEffect(() => {
    const checkSavedSession = async () => {
      const savedUserId = localStorage.getItem('lean_user_id');
      const savedUsername = localStorage.getItem('lean_username');
      
      if (savedUserId && savedUsername) {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id')
          .eq('id', savedUserId)
          .single();
        
        if (!error && data) {
          setUserId(savedUserId);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('lean_user_id');
          localStorage.removeItem('lean_username');
        }
      }
      setIsLoading(false);
    };
    
    checkSavedSession();
  }, []);

  // --- LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, username')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      setLoginError('Datos incorrectos. Intenta de nuevo.');
      setIsLoading(false);
    } else {
      localStorage.setItem('lean_user_id', data.id);
      localStorage.setItem('lean_username', data.username);
      
      setUserId(data.id);
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('lean_user_id');
    localStorage.removeItem('lean_username');
    setIsAuthenticated(false);
    setUserId(null);
  };

  useEffect(() => {
    if (isAuthenticated && userId) {
      loadUserData();
    }
  }, [isAuthenticated, userId]);

  const loadUserData = async () => {
    const { data, error } = await supabase
      .from('user_inventory')
      .select(`id, is_equipped, is_revealed, items (id, name, category, image_url)`)
      .eq('usuario_id', userId);

    if (!error && data) {
      const itemsList = data.map(inv => ({
        inventoryId: inv.id,
        isEquipped: inv.is_equipped,
        isRevealed: inv.is_revealed,
        ...inv.items
      }));

      const closet = itemsList.filter(i => i.category !== 'prize');
      const prizes = itemsList.filter(i => i.category === 'prize');

      setClosetItems(closet);
      setPrizeCards(prizes);

      const eHair = closet.find(i => i.category === 'hair' && i.isEquipped);
      const eGlasses = closet.find(i => i.category === 'glasses' && i.isEquipped);
      const eShirt = closet.find(i => i.category === 'shirt' && i.isEquipped);
      const eJacket = closet.find(i => i.category === 'jacket' && i.isEquipped);
      const eChain = closet.find(i => i.category === 'chain' && i.isEquipped);
      const eBoots = closet.find(i => i.category === 'boots' && i.isEquipped);
      
      setEquippedItems({
        hair: eHair ? eHair.image_url : null,
        glasses: eGlasses ? eGlasses.image_url : null,
        shirt: eShirt ? eShirt.image_url : null,
        jacket: eJacket ? eJacket.image_url : null,
        chain: eChain ? eChain.image_url : null,
        boots: eBoots ? eBoots.image_url : null,
      });

      const equippedCount = [eHair, eGlasses, eShirt, eJacket, eChain, eBoots].filter(Boolean).length;
      setStyleLevel(10 + (equippedCount * 15));
    }
  };

  const handleEquipItem = async (item) => {
    const isCurrentlyEquipped = equippedItems[item.category] === item.image_url;
    const newImageUrl = isCurrentlyEquipped ? null : item.image_url;

    setEquippedItems({ ...equippedItems, [item.category]: newImageUrl });
    setStyleLevel(prev => isCurrentlyEquipped ? prev - 15 : prev + 15);

    await supabase.from('user_inventory').update({ is_equipped: !isCurrentlyEquipped }).eq('id', item.inventoryId);
  };

  const handleFlipCard = async (card) => {
    if (card.isRevealed) return; 
    setPrizeCards(prizeCards.map(c => c.inventoryId === card.inventoryId ? { ...c, isRevealed: true } : c));
    await supabase.from('user_inventory').update({ is_revealed: true }).eq('id', card.inventoryId);
  };

  const filteredCloset = inventoryFilter === 'all' 
    ? closetItems 
    : closetItems.filter(item => item.category === inventoryFilter);

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="relative w-full min-h-screen bg-gradient-to-br from-[#fce4ec] via-[#f8bbd0] to-[#f48fb1] flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-medium">Cargando tu clóset mágico...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PANTALLA DE LOGIN (igual que antes)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="relative w-full min-h-screen bg-gradient-to-br from-[#fce4ec] via-[#f8bbd0] to-[#f48fb1] flex flex-col items-center justify-center overflow-x-hidden font-sans px-4 py-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute text-white/20 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
                fontSize: `${12 + Math.random() * 24}px`
              }}
            >
              {Math.random() > 0.5 ? '❤️' : '✨'}
            </div>
          ))}
        </div>

        <div className="absolute top-[8%] left-[5%] md:left-[10%] z-10 transform -rotate-6">
          <p className="text-white/80 font-cursive text-xl md:text-2xl drop-shadow-md" style={{ fontFamily: 'cursive' }}>Hecho</p>
          <p className="text-white/60 text-sm md:text-base drop-shadow-md">con amor</p>
          <p className="text-white/40 text-xs tracking-widest drop-shadow-md">para Lean</p>
        </div>

        <div className="relative z-20 w-full max-w-[400px] flex flex-col items-center">
          <div className="w-full flex justify-center mb-[-20px] md:mb-[-30px] z-30">
            <img 
              src="sent.png" 
              alt="Lean" 
              className="w-[85%] max-w-[340px] object-contain drop-shadow-[0_25px_35px_rgba(236,72,153,0.4)] transform hover:scale-105 transition-transform duration-300" 
            />
          </div>

          <div className="relative w-full bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-6 pt-10 pb-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/50">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-400 to-rose-400 text-white px-6 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
              ✨ Bienvenida a tu mundo ✨
            </div>
            <h1 className="text-3xl md:text-4xl text-[#ec489a] mb-1 text-center" style={{ fontFamily: 'cursive' }}>
              Lean <span className="text-2xl">♡</span>
            </h1>
            <p className="text-[#a89098] text-xs tracking-wide mb-8 text-center">❤ tu clóset mágico te espera ❤</p>

            <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[#f472b6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                  placeholder="Usuario"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#fdf2f8] border border-[#fbcfe8] text-[#831843] placeholder-[#f9a8d4] focus:border-[#ec489a] focus:ring-2 focus:ring-[#fbcfe8] outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[#f472b6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="Contraseña"
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[#fdf2f8] border border-[#fbcfe8] text-[#831843] placeholder-[#f9a8d4] focus:border-[#ec489a] focus:ring-2 focus:ring-[#fbcfe8] outline-none transition-all text-sm font-medium"
                />
                <div 
                  className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg className="h-5 w-5 text-[#f9a8d4] hover:text-[#ec489a] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>

              {loginError && <p className="text-[#f43f5e] text-[10px] text-center font-bold">{loginError}</p>}

              <button type="submit" className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#f472b6] to-[#ec489a] hover:from-[#ec489a] hover:to-[#db2777] text-white font-bold rounded-2xl shadow-[0_10px_20px_-5px_rgba(236,72,153,0.4)] transition-all transform active:scale-95 flex items-center justify-center gap-2">
                Ingresar a mi clóset
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
            </form>

            <div className="flex items-center w-full mt-6 mb-4">
              <div className="flex-1 border-t border-[#fce7f3]"></div>
              <span className="px-3 text-[#f9a8d4] text-[10px] uppercase tracking-wider">o continúa con</span>
              <div className="flex-1 border-t border-[#fce7f3]"></div>
            </div>

            <div className="flex gap-3 w-full mb-6">
              <button className="flex-1 py-3 bg-white border border-[#fce7f3] rounded-2xl flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-xs text-slate-600">Google</span>
              </button>
              <button className="flex-1 py-3 bg-white border border-[#fce7f3] rounded-2xl flex items-center justify-center gap-2 hover:bg-pink-50 transition-colors">
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
                </svg>
                <span className="text-xs text-slate-600">Facebook</span>
              </button>
            </div>

            <div className="flex justify-center gap-6">
              <button className="text-[#f9a8d4] text-[11px] hover:text-[#ec489a] transition-colors">¿Olvidaste tu contraseña?</button>
              <button className="text-[#ec489a] text-[11px] font-bold hover:text-[#db2777] transition-colors">Crear cuenta ❤</button>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          .animate-float {
            animation: float ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // ==========================================
  // PANTALLA PRINCIPAL (DASHBOARD) - CON IMAGEN DINÁMICA DEL PERSONAJE
  // ==========================================
  return (
    <div className="flex h-screen bg-gradient-to-br from-[#fdf2f8] via-white to-[#fce7f3] font-sans overflow-hidden">
      
      {/* SIDEBAR LATERAL */}
      <aside className={`absolute md:relative z-50 w-80 h-[calc(100vh-2rem)] bg-gradient-to-b from-[#1e1b2e] to-[#2d2438] m-4 rounded-3xl shadow-2xl flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%] md:translate-x-0'}`}>
        
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 bg-gradient-to-tr from-pink-400 to-purple-500 rounded-xl shadow-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">👗</span>
          </div>
          <h2 className="text-white font-extrabold text-2xl tracking-wide">CLÓSET<span className="text-pink-400">.</span></h2>
        </div>

        <div className="flex-1 px-5 py-6">
          <p className="text-purple-300/60 text-xs font-bold tracking-widest uppercase mb-4">Navegación</p>
          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => { setActiveTab('closet'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'closet' ? 'bg-pink-500/20 text-pink-300 shadow-inner border border-pink-500/30' : 'text-purple-300/70 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-2xl">👗</span> 
              <span>Vestidor</span>
            </button>
            <button 
              onClick={() => { setActiveTab('outfits'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'outfits' ? 'bg-green-500/20 text-green-300 shadow-inner border border-green-500/30' : 'text-purple-300/70 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-2xl">⚡</span> 
              <span>Outfits Rápidos</span>
            </button>
            <button 
              onClick={() => { setActiveTab('birthday'); setIsMobileMenuOpen(false); }}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'birthday' ? 'bg-amber-500/20 text-amber-300 shadow-inner border border-amber-500/30' : 'text-purple-300/70 hover:bg-white/5 hover:text-white'}`}
            >
              <span className="text-2xl">🎁</span> 
              <span>Área Restringida</span>
            </button>
          </nav>
        </div>

        <div className="p-5 border-t border-white/10 m-3 rounded-2xl bg-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-2xl shadow-lg">
              👑
            </div>
            <div>
              <p className="text-purple-300/50 text-[10px] uppercase tracking-wider">Jugadora Principal</p>
              <p className="text-white font-bold text-base">Lean</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-purple-300/60 text-sm hover:text-pink-400 transition-colors py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 h-full p-4 md:p-6 overflow-y-auto">
        <div className="md:hidden flex justify-between items-center mb-6 bg-white/80 backdrop-blur p-4 rounded-2xl shadow-sm">
          <h2 className="font-bold text-slate-800 text-xl">CLÓSET.</h2>
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-800 text-2xl">☰</button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">¡Arma tu Outfit, Lean! 🏋️‍♂️</h1>
          <p className="text-slate-500 mt-1">Mezcla y combina para crear el look perfecto.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMNA IZQUIERDA: PERSONAJE DINÁMICO (IMAGEN CAMBIA AL HACER CLIC) */}
          <div className="lg:col-span-5 relative w-full h-[38rem] md:h-[42rem] bg-gradient-to-b from-[#2d2438] to-[#1e1b2e] rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col items-center justify-end pb-12 group">
            
            {/* Efecto de brillo especial para Odontóloga */}
            {showOdontoEffect && (
              <div className="absolute inset-0 z-[100] pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/40 via-white/30 to-cyan-400/40 animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-cyan-300/30 blur-3xl animate-ping"></div>
              </div>
            )}

            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-50">
              <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                <span className="text-pink-300 font-bold text-xs">✨ Estilo: <span className="text-white">{styleLevel}</span></span>
              </div>
              <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                <span className="text-purple-300 font-bold text-xs">👑 Nivel {Math.floor(styleLevel / 10)}</span>
              </div>
            </div>

            {/* Indicador del outfit actual */}
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-pink-500/50">
              <span className="text-pink-300 text-xs font-bold flex items-center gap-1">
                <span>✨</span> {currentOutfitName} <span>✨</span>
              </span>
            </div>

            <div className="absolute bottom-8 w-64 h-16 bg-pink-500/20 rounded-full blur-xl group-hover:bg-pink-400/30 transition-all duration-700"></div>
            <div className="absolute bottom-0 w-72 h-12 bg-[#2d2438] rounded-t-full border-t border-white/20 shadow-[0_-10px_20px_rgba(0,0,0,0.3)] z-0"></div>

            {/* CONTENEDOR DEL PERSONAJE CON IMAGEN DINÁMICA QUE CAMBIA */}
            <div 
              className="relative w-72 h-[32rem] md:w-80 md:h-[36rem] z-20 flex justify-center items-end pb-4 transition-all duration-300"
              style={{
                transform: `scale(${characterScale})`,
                filter: characterGlow ? 'drop-shadow(0 0 20px rgba(236,72,153,0.8))' : 'none',
                transition: 'transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1), filter 0.2s ease'
              }}
            >
              {/* IMAGEN PRINCIPAL DEL PERSONAJE (CAMBIA DINÁMICAMENTE) */}
              <img 
                src={characterImage} 
                alt="Lean Character" 
                className="absolute w-full h-full object-contain z-10 drop-shadow-2xl scale-110 transition-opacity duration-300" 
                style={{ opacity: characterAnimation ? 0.8 : 1 }}
              />
              
              {/* CAPAS DE PRENDAS (se mantienen para personalización adicional) */}
              {equippedItems.boots && (
                <img src={equippedItems.boots} className="absolute w-full h-full object-contain z-20 drop-shadow-xl transition-all duration-300 scale-110" alt="Botas" />
              )}
              {equippedItems.shirt && (
                <img src={equippedItems.shirt} className="absolute w-full h-full object-contain z-30 drop-shadow-xl transition-all duration-300 scale-110" alt="Camisa" />
              )}
              {equippedItems.jacket && (
                <img src={equippedItems.jacket} className="absolute w-full h-full object-contain z-40 drop-shadow-xl transition-all duration-300 scale-110" alt="Chaqueta" />
              )}
              {equippedItems.chain && (
                <img src={equippedItems.chain} className="absolute w-full h-full object-contain z-50 drop-shadow-xl transition-all duration-300 scale-110" alt="Cadena" />
              )}
              {equippedItems.hair && (
                <img src={equippedItems.hair} className="absolute w-full h-full object-contain z-[60] drop-shadow-xl transition-all duration-300 scale-110" style={{ filter: activeHairColor }} alt="Cabello" />
              )}
              {equippedItems.glasses && (
                <img src={equippedItems.glasses} className="absolute w-full h-full object-contain z-[70] drop-shadow-xl transition-all duration-300 scale-110" alt="Lentes" />
              )}
            </div>

            {/* Selector de color de cabello (solo visible si hay cabello equipado) */}
            {equippedItems.hair && (
              <div className="absolute bottom-2 z-50 bg-black/60 backdrop-blur-md px-3 py-2 rounded-2xl flex flex-wrap justify-center gap-2 border border-white/30 max-w-[90%]">
                {hairColors.map((hc) => (
                  <button 
                    key={hc.id}
                    onClick={() => setActiveHairColor(hc.filter)}
                    className={`w-7 h-7 rounded-full shadow-inner border-2 transition-all duration-200 ${activeHairColor === hc.filter ? 'border-white scale-125 shadow-lg' : 'border-transparent hover:scale-110'}`}
                    style={{ backgroundColor: hc.color }}
                    title={hc.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: INVENTARIO Y OUTFITS */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            
            {/* TAB DE VESTIDOR */}
            {activeTab === 'closet' && (
              <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-5 md:p-6 shadow-xl border border-white/50 h-full flex flex-col">
                <div className="flex gap-1.5 overflow-x-auto pb-4 mb-4 border-b border-pink-100 scrollbar-hide">
                  {[
                    { id: 'all', label: 'Todo', icon: '🎒' },
                    { id: 'hair', label: 'Cabello', icon: '💇‍♀️' },
                    { id: 'glasses', label: 'Lentes', icon: '🕶️' },
                    { id: 'shirt', label: 'Camisas', icon: '👕' },
                    { id: 'jacket', label: 'Abrigos', icon: '🧥' },
                    { id: 'chain', label: 'Cadenas', icon: '✨' },
                    { id: 'boots', label: 'Calzado', icon: '👟' }
                  ].map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setInventoryFilter(cat.id)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${inventoryFilter === cat.id ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}
                    >
                      <span className="text-sm">{cat.icon}</span> 
                      <span className="hidden sm:inline">{cat.label}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto pr-1 max-h-[500px]">
                  {filteredCloset.map(item => {
                    const isEquipped = equippedItems[item.category] === item.image_url;
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => handleEquipItem(item)}
                        className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all transform active:scale-95 ${
                          isEquipped 
                          ? 'bg-gradient-to-br from-pink-100 to-purple-100 border-2 border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]' 
                          : 'bg-white border-2 border-pink-100 hover:border-pink-300 hover:shadow-md'
                        }`}
                      >
                        {isEquipped && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-md z-10 whitespace-nowrap">
                            PUESTO
                          </div>
                        )}
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-50 to-purple-50 rounded-full flex items-center justify-center mb-1 shadow-inner p-2">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[9px] font-bold text-slate-600 text-center uppercase tracking-wider leading-tight">{item.name}</span>
                      </div>
                    );
                  })}
                  {filteredCloset.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400">
                      <span className="text-4xl mb-2 block">👗</span>
                      <p className="text-sm">No hay items en esta categoría</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB DE OUTFITS RÁPIDOS - AL HACER CLICK CAMBIA LA IMAGEN DEL PERSONAJE */}
            {activeTab === 'outfits' && (
              <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-5 md:p-6 shadow-xl border border-white/50 h-full flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                  👚 Outfits Rápidos
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">¡Cambia al instante!</span>
                </h3>
                <p className="text-sm text-slate-500 mb-5">
                  Selecciona un look completo y toda la ropa se cambiará automáticamente.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {outfits.map((outfit) => (
                    <button 
                      key={outfit.id}
                      onClick={() => applyOutfit(outfit.id)}
                      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${outfit.bgColor} border-2 ${outfit.borderColor} p-4 transition-all hover:scale-105 hover:shadow-xl cursor-pointer`}
                    >
                      <div className="text-center">
                        {outfit.image ? (
                          <img 
                            src={outfit.image} 
                            alt={outfit.name}
                            className="w-16 h-16 object-contain mx-auto mb-2 rounded-full shadow-md"
                          />
                        ) : (
                          <div className="text-5xl mb-2">{outfit.icon}</div>
                        )}
                        <h4 className={`font-bold ${outfit.textColor}`}>{outfit.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{outfit.description}</p>
                      </div>
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                  <p className="text-xs text-slate-500 text-center">
                    💡 Los outfits usarán las prendas disponibles en tu clóset.<br/>
                    Si alguna prenda no está disponible, se omitirá.
                  </p>
                </div>
              </div>
            )}

            {/* TAB DE CUMPLEAÑOS */}
            {activeTab === 'birthday' && (
              <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-5 md:p-6 shadow-xl border border-white/50 h-full flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                  🎁 Área Restringida
                  {!isBirthday && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Bloqueado</span>}
                </h3>
                <p className="text-sm text-slate-500 mb-5">
                  {isBirthday 
                    ? "✨ ¡Feliz cumpleaños, Lean! Tus regalos te esperan ✨" 
                    : "🔒 Esta área se desbloqueará el 8 de julio. Vuelve pronto para tu sorpresa."}
                </p>
                
                {!isBirthday ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-[inset_0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:20px_20px]"></div>
                    <div className="absolute top-0 w-full h-1 bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-[pulse_2s_ease-in-out_infinite]"></div>
                    <div className="z-10 flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-5 border-4 border-slate-700 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h4 className="text-2xl font-black text-red-400 tracking-[0.2em] uppercase mb-3 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                        CERRADO
                      </h4>
                      <div className="bg-black/50 border border-slate-700 rounded-xl px-5 py-2.5">
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest leading-relaxed text-center">
                          🔐 Desbloqueo: 8 de julio<br/>
                          <span className="text-amber-400/80 text-[8px] mt-1 block">✨ Un regalo especial te espera ✨</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-[450px]">
                    {prizeCards.map(card => (
                      <div 
                        key={card.inventoryId}
                        onClick={() => handleFlipCard(card)}
                        className={`relative aspect-square rounded-2xl cursor-pointer transition-all duration-500 transform hover:scale-105 ${
                          card.isRevealed 
                            ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-400 shadow-lg' 
                            : 'bg-gradient-to-br from-purple-700 to-pink-700 shadow-xl'
                        }`}
                      >
                        {!card.isRevealed ? (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white">
                            <div className="text-4xl mb-2">❓</div>
                            <div className="text-[10px] font-bold uppercase tracking-wider">???</div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(0,0,0,0.3))] rounded-2xl"></div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-2 shadow-md p-2">
                              <img src={card.image_url} alt={card.name} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xs font-bold text-amber-800 text-center">{card.name}</span>
                            <div className="absolute -top-2 -right-2 text-xl">🎁</div>
                          </div>
                        )}
                        {card.isRevealed && (
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-amber-400 text-amber-900 text-[8px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                            ¡Regalo!
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
};

export default LeanClosetApp;