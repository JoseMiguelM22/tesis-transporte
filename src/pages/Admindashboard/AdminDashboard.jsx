import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Car, Users, Power, Plus, RefreshCw, 
  MapPin, Edit3, CheckCircle2, X, ShieldCheck, ChevronDown, 
  ChevronUp, Calendar, Trash2, UserCog, Save
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  
  // --- ESTADOS PRINCIPALES ---
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showFullRegistration, setShowFullRegistration] = useState(false);

  // --- ESTADOS DE EDICIÓN ---
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  // --- ESTADO FORMULARIO REGISTRO ---
  const [formData, setFormData] = useState({
    numero_unit: "", placa: "", capacidad: 5,
    nom_chof: "", ced_chof: "", mail_chof: "", pass_chof: ""
  });

  // --- 1. CARGA DE DATOS (FETCH) ---
  const fetchUnidades = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("unidades")
        .select(`
          *,
          choferes!unidades_chofer_id_fkey (*)
        `)
        .order("numero_unidad", { ascending: true });
      
      if (error) throw error;
      setUnidades(data || []);
    } catch (err) { 
      console.error("Error al obtener datos:", err.message);
      // Fallback: intentar cargar sin relación si la llave falla
      const { data: simple } = await supabase.from("unidades").select("*");
      setUnidades(simple || []);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchUnidades(); }, []);

  // --- 2. FUNCIONES DE UTILIDAD ---
  const formatDate = (dateString) => {
    if (!dateString) return "Pendiente";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric'
      }).format(date);
    } catch { return "Error fecha"; }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth-central");
  };

  // --- 3. ACCIONES CRUD ---
  const handleDelete = async (unitId, choferId) => {
    if (window.confirm("¿Deseas eliminar este registro permanentemente?")) {
      setLoading(true);
      try {
        await supabase.from("unidades").delete().eq("id", unitId);
        if (choferId) await supabase.from("choferes").delete().eq("id", choferId);
        fetchUnidades();
      } catch (err) { alert(err.message); }
      finally { setLoading(false); }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Actualizar Chofer
      if (editData.chofer_id) {
        await supabase.from("choferes").update({
          nombre: editData.choferes.nombre,
          cedula: editData.choferes.cedula
        }).eq("id", editData.chofer_id);
      }
      // Actualizar Unidad
      await supabase.from("unidades").update({
        placa: editData.placa,
        capacidad_total: editData.capacidad_total
      }).eq("id", editData.id);

      setIsEditing(false);
      fetchUnidades();
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleFullRegistration = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.mail_chof, password: formData.pass_chof,
      });
      if (authError) throw authError;

      const { data: choferData } = await supabase.from("choferes").insert([{ 
        nombre: formData.nom_chof, cedula: formData.ced_chof, user_id: authData.user.id 
      }]).select().single();

      await supabase.from("unidades").insert([{ 
        numero_unidad: formData.numero_unit, placa: formData.placa, 
        capacidad_total: formData.capacidad, puestos_libres: formData.capacidad, 
        estado: 'disponible', chofer_id: choferData.id 
      }]);

      await supabase.auth.signOut();
      window.location.href = "/auth-central"; 
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden text-left">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0D47A1] text-white flex flex-col shrink-0 shadow-2xl z-30">
        <div className="p-10 flex items-center gap-3 italic">
          <Car size={32} className="text-blue-400" />
          <h2 className="text-2xl font-black uppercase tracking-tighter">RUTA<span className="font-light">UNEFA</span></h2>
        </div>
        <nav className="flex-1 px-6 space-y-4">
          <button className="flex items-center gap-4 w-full p-4 bg-white/10 rounded-2xl font-black italic shadow-lg">
            <LayoutDashboard size={20}/> Vista General
          </button>
          <button onClick={() => setShowFullRegistration(true)} className="flex items-center gap-4 w-full p-4 bg-emerald-500/20 text-emerald-300 rounded-2xl font-black italic border border-emerald-500/20 hover:bg-emerald-500/30 transition-all">
            <Plus size={20}/> ALTA DE FLOTA
          </button>
        </nav>
        <div className="p-10 border-t border-white/5">
            <button onClick={handleLogout} className="flex items-center gap-3 text-white/50 hover:text-white font-bold italic uppercase text-xs transition-all">
                <Power size={16}/> Cerrar Sesión
            </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-white border-b px-12 flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Gestión Maestra</h1>
          <button onClick={fetchUnidades} className="p-3 bg-slate-50 rounded-xl text-[#0D47A1] border hover:bg-slate-100 transition-all shadow-sm">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""}/>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-12 bg-slate-50/50">
          <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                  <th className="px-10 py-8">Unidad</th>
                  <th className="px-10 py-8">Chofer / Operador</th>
                  <th className="px-10 py-8">Placa</th>
                  <th className="px-10 py-8 text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {unidades.map((u) => (
                  <React.Fragment key={u.id}>
                    <tr className={`group transition-all ${expandedRow === u.id ? 'bg-blue-50/50' : 'hover:bg-slate-50/30'}`}>
                      <td className="px-10 py-6 font-black italic text-[#0D47A1] text-lg">{u.numero_unidad}</td>
                      <td className="px-10 py-6">
                         <button onClick={() => setExpandedRow(expandedRow === u.id ? null : u.id)} className="flex items-center gap-3 font-black italic uppercase text-slate-700 hover:text-[#0D47A1] transition-colors">
                            <div className={`p-2 rounded-lg transition-all ${expandedRow === u.id ? 'bg-[#0D47A1] text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {expandedRow === u.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                            </div>
                            {u.choferes?.nombre || "PERSONAL PENDIENTE"}
                         </button>
                      </td>
                      <td className="px-10 py-6 font-black text-slate-400 uppercase tracking-widest">{u.placa}</td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => { setEditData(u); setIsEditing(true); }} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                            <Edit3 size={18}/>
                          </button>
                          <button onClick={() => handleDelete(u.id, u.chofer_id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                            <Trash2 size={18}/>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* DETALLES DESPLEGABLES */}
                    {expandedRow === u.id && (
                      <tr className="bg-blue-50/30 animate-in slide-in-from-top-1 duration-300">
                        <td colSpan="4" className="px-10 py-10 border-t border-blue-100/30">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <DetailCard icon={<ShieldCheck size={28}/>} label="Cédula" value={u.choferes?.cedula || "N/A"} color="blue"/>
                            <DetailCard icon={<Calendar size={28}/>} label="Fecha Alta" value={formatDate(u.created_at)} color="emerald"/>
                            <DetailCard icon={<Car size={28}/>} label="Capacidad" value={`${u.capacidad_total} PUESTOS`} color="orange"/>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL EDICIÓN */}
      {isEditing && (
        <Modal title="Editar Perfil" icon={<UserCog size={30}/>} onClose={() => setIsEditing(false)}>
            <form onSubmit={handleUpdate} className="space-y-8 italic font-bold uppercase">
              <div className="space-y-4">
                <p className="text-[10px] text-blue-500 tracking-widest font-black uppercase">Identidad Operador</p>
                <input value={editData.choferes?.nombre || ""} className="input-field" onChange={e => setEditData({...editData, choferes: {...editData.choferes, nombre: e.target.value}})} required/>
                <input value={editData.choferes?.cedula || ""} className="input-field" onChange={e => setEditData({...editData, choferes: {...editData.choferes, cedula: e.target.value}})} required/>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] text-emerald-500 tracking-widest font-black uppercase">Detalles Unidad</p>
                <input value={editData.placa} className="input-field" onChange={e => setEditData({...editData, placa: e.target.value})} required/>
                <input type="number" value={editData.capacidad_total} className="input-field" onChange={e => setEditData({...editData, capacidad_total: e.target.value})} required/>
              </div>
              <button type="submit" className="btn-primary"><Save size={22}/> GUARDAR CAMBIOS</button>
            </form>
        </Modal>
      )}

      {/* MODAL REGISTRO */}
      {showFullRegistration && (
        <Modal title="Alta de Nueva Flota" icon={<Plus size={30}/>} onClose={() => setShowFullRegistration(false)}>
            <form onSubmit={handleFullRegistration} className="grid grid-cols-2 gap-10">
              <div className="space-y-5">
                <p className="form-section-title text-blue-500">VEHÍCULO</p>
                <input placeholder="N° UNIDAD" className="input-field" onChange={e => setFormData({...formData, numero_unit: e.target.value})} required/>
                <input placeholder="PLACA" className="input-field" onChange={e => setFormData({...formData, placa: e.target.value})} required/>
                <input type="number" placeholder="CAPACIDAD" className="input-field" onChange={e => setFormData({...formData, capacidad: e.target.value})} required/>
              </div>
              <div className="space-y-5">
                <p className="form-section-title text-emerald-500">CHOFER</p>
                <input placeholder="NOMBRE" className="input-field" onChange={e => setFormData({...formData, nom_chof: e.target.value})} required/>
                <input placeholder="CÉDULA" className="input-field" onChange={e => setFormData({...formData, ced_chof: e.target.value})} required/>
                <input type="email" placeholder="EMAIL" className="input-field" onChange={e => setFormData({...formData, mail_chof: e.target.value})} required/>
                <input type="password" placeholder="CONTRASEÑA" className="input-field" onChange={e => setFormData({...formData, pass_chof: e.target.value})} required/>
              </div>
              <button type="submit" disabled={loading} className="md:col-span-2 btn-primary font-black">
                {loading ? "PROCESANDO..." : "FINALIZAR REGISTRO"}
              </button>
            </form>
        </Modal>
      )}
    </div>
  );
}

// --- COMPONENTES AUXILIARES PARA LIMPIEZA ---
const DetailCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-7 rounded-[35px] shadow-sm border border-blue-100/50 flex items-center gap-5">
    <div className={`w-14 h-14 bg-${color}-50 text-${color}-600 rounded-2xl flex items-center justify-center shadow-inner`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-base font-black italic text-slate-700 uppercase">{value}</p>
    </div>
  </div>
);

const Modal = ({ title, icon, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 overflow-y-auto">
    <div className="bg-white p-12 rounded-[50px] w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300 border border-white/20">
      <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6 text-[#0D47A1]">
        <div className="flex items-center gap-4">{icon}<h3 className="text-2xl font-black italic uppercase tracking-tighter">{title}</h3></div>
        <button onClick={onClose} className="p-3 bg-slate-50 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"><X size={24}/></button>
      </div>
      {children}
    </div>
  </div>
);