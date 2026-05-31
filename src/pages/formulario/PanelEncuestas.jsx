import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  BarChart3, Loader2, Eye, X, User, Briefcase, CreditCard, ClipboardList 
} from 'lucide-react';

export default function PanelEncuestas() {
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // Para abrir el modal con las respuestas

  const preguntas = [
    "1. ¿Considera que la cantidad de unidades en circulación es suficiente para cubrir la demanda en las horas pico?",
    "2. ¿Cree que las unidades cumplen rigurosamente con las rutas y paradas establecidas por la Asociación?",
    "3. ¿Le parece que los tiempos de espera son excesivos debido a que no se conoce la hora estimada de llegada del vehículo?",
    "4. ¿Cree que la disponibilidad de asientos actual de los vehículos es suficiente para garantizar un traslado cómodo?",
    "5. ¿La gestión actual del transporte es eficiente tanto al inicio de la jornada como en el retorno?",
    "6. ¿Utiliza usted herramientas digitales para consultar la disponibilidad y horarios de los servicios del transporte público?",
    "7. ¿La información que recibe sobre el estado y ubicación de las unidades de transporte llega a tiempo para evitarle retrasos?",
    "8. ¿Confía usted en la exactitud y seguridad de los reportes administrativos que se gestionan de manera digital en comparación con los registros en papel?",
    "9. ¿Los canales de comunicación actuales de la línea de transporte le permiten reportar de manera efectiva y rápida las incidencias o retrasos en las rutas?",
    "10. ¿Dispone usted del tiempo y la disposición para interactuar con una plataforma tecnológica antes de salir hacia las paradas de transporte?"
  ];

  useEffect(() => {
    cargarEncuestas();
  }, []);

  const cargarEncuestas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('encuestas_transporte')
        .select('*')
        .order('id', { ascending: false }); // Ordenar de más reciente a más antiguo

      if (error) throw error;
      setEncuestas(data || []);
    } catch (error) {
      console.error("Error al cargar encuestas:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 font-sans text-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-8 rounded-[30px] border border-slate-700 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <BarChart3 size={32} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">Resultados de Encuestas</h1>
              <p className="text-sm text-slate-400 font-medium mt-1">Datos recolectados para el Proyecto de Grado</p>
            </div>
          </div>
          <div className="bg-slate-900 px-6 py-4 rounded-2xl border border-slate-700 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Muestra</p>
            <p className="text-3xl font-black text-white">{encuestas.length}</p>
          </div>
        </div>

        {/* TABLA DE DATOS */}
        <div className="bg-slate-800 rounded-[30px] border border-slate-700 shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-blue-400">
              <Loader2 size={40} className="animate-spin mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">Cargando datos...</p>
            </div>
          ) : encuestas.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-bold uppercase tracking-widest text-sm">Aún no hay respuestas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                    <th className="px-8 py-6">Encuestado</th>
                    <th className="px-8 py-6">Cédula</th>
                    <th className="px-8 py-6">Rol Institucional</th>
                    <th className="px-8 py-6 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {encuestas.map((encuesta) => (
                    <tr key={encuesta.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <User size={16} className="text-slate-500" />
                          <span className="font-bold text-white uppercase text-sm">{encuesta.nombres_apellidos}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <CreditCard size={16} className="text-slate-500" />
                          <span className="font-medium text-slate-300 text-sm">{encuesta.cedula}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className={`inline-flex items-center w-max px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            encuesta.cargo === 'Estudiante' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                            encuesta.cargo === 'Docente' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            <Briefcase size={12} className="mr-2" />
                            {encuesta.cargo}
                          </span>
                          {encuesta.cargo === 'Estudiante' && (
                            <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                              {encuesta.carrera} ({encuesta.semestre})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => setSelected(encuesta)}
                          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-500 transition-all shadow-lg active:scale-95"
                        >
                          <Eye size={14} /> Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL PARA VER RESPUESTAS */}
        {selected && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-[30px] border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
              
              {/* Header del Modal */}
              <div className="flex justify-between items-center p-6 sm:p-8 border-b border-slate-700 bg-slate-900/50 shrink-0">
                <div>
                  <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                    <ClipboardList className="text-blue-400" /> Cuestionario de {selected.nombres_apellidos}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 tracking-widest mt-1">
                    C.I: {selected.cedula} | ROL: {selected.cargo.toUpperCase()}
                  </p>
                </div>
                <button 
                  onClick={() => setSelected(null)}
                  className="p-3 bg-slate-700/50 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Cuerpo del Modal con scroll */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                {preguntas.map((pregunta, index) => {
                  const resp = selected[`q${index + 1}`];
                  return (
                    <div key={index} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50">
                      <p className="text-sm font-medium text-slate-300 mb-3 leading-relaxed">{pregunta}</p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-black uppercase tracking-wider">
                        Respuesta: {resp || 'No respondió'}
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
  );
}