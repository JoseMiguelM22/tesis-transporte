import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Users, CreditCard, Lock, ArrowRight, Loader2, LogOut } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function GinevaAdmin() {
  // 🛡️ SISTEMA DE SEGURIDAD
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [authError, setAuthError] = useState(false);

  // CLAVE MAESTRA DE ACCESO (Cámbiala si lo deseas)
  const ADMIN_PIN = "Gineva2026";

  const [adminTab, setAdminTab] = useState("productos");
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [nuevoProd, setNuevoProd] = useState({ nombre: "", descripcion: "", precio: "", categoria: "General" });
  const [imagenFile, setImagenFile] = useState(null);
  const [subiendoProd, setSubiendoProd] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProductos();
      fetchClientes();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPinInput("");
    }
  };

  const fetchProductos = async () => {
    const { data } = await supabase.from('gineva_productos').select('*').order('created_at', { ascending: false });
    if (data) setProductos(data);
  };

  const fetchClientes = async () => {
    const { data } = await supabase.from('gineva_clientes').select('*').order('created_at', { ascending: false });
    if (data) setClientes(data);
  };

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    if (!nuevoProd.nombre || !nuevoProd.precio) return;
    setSubiendoProd(true);

    try {
      let imagenUrl = "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80";

      if (imagenFile) {
        const fileName = `producto-${Date.now()}.png`;
        const { error: uploadErr } = await supabase.storage.from('avatars').upload(fileName, imagenFile);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        imagenUrl = publicUrl;
      }

      await supabase.from('gineva_productos').insert([{
        nombre: nuevoProd.nombre,
        descripcion: nuevoProd.descripcion,
        precio: parseFloat(nuevoProd.precio),
        categoria: nuevoProd.categoria,
        imagen_url: imagenUrl,
        es_nuevo: true
      }]);

      alert("¡Pieza agregada al inventario!");
      setNuevoProd({ nombre: "", descripcion: "", precio: "", categoria: "General" });
      setImagenFile(null);
      fetchProductos();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubiendoProd(false);
    }
  };

  const eliminarProducto = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar esta pieza permanentemente?")) return;
    await supabase.from('gineva_productos').delete().eq('id', id);
    fetchProductos();
  };

  // 🛡️ PANTALLA DE BLOQUEO DE SEGURIDAD
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[32px] shadow-2xl max-w-sm w-full text-center border border-neutral-200">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={24} className="text-neutral-500" />
          </div>
          <h2 className="font-serif text-2xl mb-2">Acceso Restringido</h2>
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-8">Gineva Admin Workspace</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" placeholder="PIN de Seguridad" required
              value={pinInput} onChange={(e) => setPinInput(e.target.value)}
              className={`w-full px-5 py-4 rounded-2xl text-center font-mono text-xl tracking-widest border outline-none transition-all ${authError ? 'border-red-400 bg-red-50 text-red-600' : 'border-neutral-200 bg-neutral-50'}`}
            />
            {authError && <p className="text-[10px] font-bold text-red-500 uppercase">PIN Incorrecto</p>}
            
            <button type="submit" className="w-full py-4 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
              Desbloquear Panel <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 🛠️ PANEL ADMINISTRATIVO PRINCIPAL
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-32">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/logoginegro.png" alt="Gineva Logo" className="h-6 object-contain" />
            <span className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-3 py-1 rounded-full">Admin</span>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-red-500 flex items-center gap-2 transition-colors">
            Cerrar Sesión <LogOut size={14}/>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10 space-y-8">
        <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-4">
          <button onClick={() => setAdminTab("productos")} className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${adminTab === 'productos' ? 'bg-black text-white shadow-md' : 'bg-white border hover:bg-neutral-50 text-neutral-500'}`}>
            Inventario
          </button>
          <button onClick={() => setAdminTab("clientes")} className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${adminTab === 'clientes' ? 'bg-black text-white shadow-md' : 'bg-white border hover:bg-neutral-50 text-neutral-500'}`}>
            Leads / Visitas
          </button>
        </div>

        {adminTab === "productos" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <form onSubmit={handleCrearProducto} className="p-8 rounded-[32px] bg-white border border-neutral-200 shadow-sm space-y-5 lg:col-span-1 h-fit">
              <h3 className="text-sm font-bold uppercase tracking-wider border-b pb-4">Subir Nueva Pieza</h3>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Nombre</label>
                <input type="text" required value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})} className="w-full p-4 rounded-2xl border bg-neutral-50 text-xs outline-none focus:border-black"/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Precio ($)</label>
                <input type="number" required value={nuevoProd.precio} onChange={e => setNuevoProd({...nuevoProd, precio: e.target.value})} className="w-full p-4 rounded-2xl border bg-neutral-50 text-xs outline-none focus:border-black"/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Fotografía</label>
                <input type="file" accept="image/*" onChange={e => setImagenFile(e.target.files[0])} className="w-full text-xs text-neutral-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-neutral-100 file:text-black hover:file:bg-neutral-200 cursor-pointer"/>
              </div>

              <button type="submit" disabled={subiendoProd} className="w-full py-4 mt-4 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-all">
                {subiendoProd ? <><Loader2 size={16} className="animate-spin"/> Subiendo...</> : <><PlusCircle size={16}/> Publicar Producto</>}
              </button>
            </form>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider">Inventario en Línea</h3>
              <div className="bg-white rounded-[32px] border border-neutral-200 shadow-sm p-2">
                {productos.map(p => (
                  <div key={p.id} className="p-4 flex items-center justify-between border-b last:border-0 border-neutral-100 hover:bg-neutral-50 transition-colors rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-neutral-100 overflow-hidden shrink-0">
                        <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover"/>
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-lg">{p.nombre}</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">${p.precio} USD</p>
                      </div>
                    </div>
                    <button onClick={() => eliminarProducto(p.id)} className="p-4 text-neutral-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors shrink-0">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                ))}
                {productos.length === 0 && <p className="text-center py-10 text-xs uppercase tracking-widest text-neutral-400">Inventario vacío</p>}
              </div>
            </div>
          </div>
        )}

        {adminTab === "clientes" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider">Base de Datos de Leads</h3>
            <div className="bg-white rounded-[32px] border border-neutral-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b uppercase tracking-widest text-[9px] text-neutral-400 bg-neutral-50">
                  <tr>
                    <th className="p-6 font-bold">Cliente Registrado</th>
                    <th className="p-6 font-bold">Dispositivo de Acceso</th>
                    <th className="p-6 font-bold text-right">Fecha de Ingreso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {clientes.map(c => (
                    <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-6 font-bold text-sm uppercase">{c.nombre} {c.apellido}</td>
                      <td className="p-6 text-neutral-400 truncate max-w-[200px]">{c.ip_o_dispositivo}</td>
                      <td className="p-6 text-right font-mono text-neutral-500">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {clientes.length === 0 && <tr><td colSpan="3" className="text-center py-10 text-neutral-400 uppercase tracking-widest">Aún no hay registros</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}