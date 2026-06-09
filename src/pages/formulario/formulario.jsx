import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  ClipboardList, CheckCircle2, User, Briefcase, 
  GraduationCap, BookOpen, Loader2, Send, CreditCard 
} from 'lucide-react';

const EncuestaTransporte = () => {
  const [formData, setFormData] = useState({
    nombres_apellidos: '',
    cedula: '', 
    cargo: '',
    semestre: '',
    carrera: '',
    q1: '', q2: '', q3: '', q4: '', q5: '',
    q6: '', q7: '', q8: '', q9: '', q10: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const preguntas = [
    "¿Considera que la cantidad de unidades en circulación es suficiente para cubrir la demanda en las horas pico?",
    "¿Cree que las unidades cumplen rigurosamente con las rutas y paradas establecidas por la Asociación?",
    "¿Le parece que los tiempos de espera son excesivos debido a que no se conoce la hora estimada de llegada del vehículo?",
    "¿Cree que la disponibilidad de asientos actual de los vehículos es suficiente para garantizar un traslado cómodo?",
    "¿La gestión actual del transporte es eficiente tanto al inicio de la jornada como en el retorno?",
    "¿Utiliza usted herramientas digitales para consultar la disponibilidad y horarios de los servicios del transporte público?",
    "¿La información que recibe sobre el estado y ubicación de las unidades de transporte llega a tiempo para evitarle retrasos?",
    "¿Confía usted en la exactitud y seguridad de los reportes administrativos que se gestionan de manera digital en comparación con los registros en papel?",
    "¿Los canales de comunicación actuales de la línea de transporte le permiten reportar de manera efectiva y rápida las incidencias o retrasos en las rutas?",
    "¿Dispone usted del tiempo y la disposición para interactuar con una plataforma tecnológica antes de salir hacia las paradas de transporte?"
  ];

  const opciones = ["Siempre", "Casi Siempre", "A Veces", "Casi Nunca", "Nunca"];

  // 🎯 MANEJADOR CON VALIDACIONES EN CALIENTE (ACTUALIZADO)
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "nombres_apellidos" || name === "carrera") {
      // Solo permite letras (incluyendo acentos) y espacios
      const soloLetras = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
      setFormData({ ...formData, [name]: soloLetras });
    } 
    else if (name === "cedula") {
      // Solo permite números
      const soloNumeros = value.replace(/[^0-9]/g, "");
      setFormData({ ...formData, [name]: soloNumeros });
    } 
    else if (name === "semestre") {
      // Permite números y letras sin espacios ni símbolos raros (Ej: 9no, VIII, 8)
      const alfaNumerico = value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, "");
      setFormData({ ...formData, [name]: alfaNumerico });
    }
    else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Limpiar semestre y carrera si no es estudiante para mantener la BD limpia
    const dataToSubmit = {
      ...formData,
      semestre: formData.cargo === 'Estudiante' ? formData.semestre : null,
      carrera: formData.cargo === 'Estudiante' ? formData.carrera : null,
    };

    try {
      const { error } = await supabase
        .from('encuestas_transporte')
        .insert([dataToSubmit]);

      if (error) throw error;

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert('Hubo un error al enviar la encuesta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- VISTA DE ÉXITO ---
  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="bg-slate-800 p-10 rounded-[40px] w-full max-w-md shadow-2xl border border-slate-700 text-center space-y-6 animate-in zoom-in duration-300">
          <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
            <CheckCircle2 size={50} className="text-blue-400" />
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">¡Muchas Gracias!</h2>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">
            Tus respuestas han sido registradas exitosamente. Este aporte es fundamental para el desarrollo y análisis de esta investigación.
          </p>
          <div className="pt-4">
            <button onClick={() => window.location.reload()} className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest underline decoration-blue-400/30 underline-offset-4">
              Enviar otra respuesta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA DEL FORMULARIO ---
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 flex justify-center text-slate-200 font-sans">
      <div className="w-full max-w-3xl bg-slate-800 rounded-[40px] shadow-2xl border border-slate-700 overflow-hidden">
        
        {/* HEADER CON LOGO Y TÍTULO DE TESIS */}
        <div className="bg-slate-850 border-b border-slate-700 p-8 sm:p-10 text-center flex flex-col items-center">
          
          <img 
            src="/logounefa.png" 
            alt="Logo UNEFA" 
            className="w-24 sm:w-28 h-auto mb-6 drop-shadow-xl"
          />

          <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white leading-snug max-w-2xl">
            Formulario para Evaluar la necesidad de un Sistema de Gestión Integral para el Servicio del transporte público ofrecido por la Asociación Civil Dr. José Gregorio Hernández 2020
          </h1>
          
          <p className="mt-4 text-xs font-bold tracking-widest text-blue-400 uppercase">
            Instrumento de Recolección de Datos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-10">
          
          {/* SECCIÓN: DATOS PERSONALES */}
          <section>
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest border-b border-slate-700 pb-2 mb-6">
              1. Datos Generales
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nombres y Apellidos</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                  <input 
                    type="text" name="nombres_apellidos" required 
                    maxLength={40}
                    onChange={handleChange} value={formData.nombres_apellidos} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                    placeholder="Ej. Pedro Pérez"
                  />
                </div>
              </div>

              {/* CAMPO DE CÉDULA */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Cédula</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                  <input 
                    type="text" name="cedula" required 
                    maxLength={10}
                    onChange={handleChange} value={formData.cedula} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                    placeholder="Ej. 25123456"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mt-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Cargo en la Institución</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                  <select 
                    name="cargo" required 
                    onChange={handleChange} value={formData.cargo} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Seleccione su rol...</option>
                    <option value="Estudiante">Estudiante</option>
                    <option value="Docente">Docente</option>
                    <option value="Obrero">Obrero</option>
                    <option value="Personal Administrativo">Personal Administrativo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CAMPOS CONDICIONALES PARA ESTUDIANTES CON VALIDACIONES */}
            {formData.cargo === 'Estudiante' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 p-6 bg-slate-700/20 border border-slate-700 rounded-2xl animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider ml-1">Carrera</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                    <input 
                      type="text" name="carrera" required 
                      maxLength={50} // 🎯 Límite de caracteres
                      onChange={handleChange} value={formData.carrera} 
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-white focus:border-emerald-500 outline-none transition-all" 
                      placeholder="Ej. Ingeniería de Sistemas"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider ml-1">Semestre Actual</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                    <input 
                      type="text" name="semestre" required 
                      maxLength={10} // 🎯 Límite de caracteres
                      onChange={handleChange} value={formData.semestre} 
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-white focus:border-emerald-500 outline-none transition-all" 
                      placeholder="Ej. 9no"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* SECCIÓN: PREGUNTAS */}
          <section>
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest border-b border-slate-700 pb-2 mb-6">
              2. Cuestionario
            </h3>
            
            <div className="space-y-10">
              {preguntas.map((pregunta, index) => {
                const questionKey = `q${index + 1}`;
                return (
                  <div key={questionKey} className="bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-700/50">
                    <p className="text-base font-medium text-white mb-5 leading-relaxed">
                      <span className="font-black text-blue-400 mr-2">{index + 1}.</span> 
                      {pregunta}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {opciones.map((opcion) => {
                        const isSelected = formData[questionKey] === opcion;
                        return (
                          <label 
                            key={opcion} 
                            className={`flex items-center justify-center p-3 rounded-xl border text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={questionKey}
                              value={opcion}
                              required
                              onChange={handleChange}
                              checked={isSelected}
                              className="hidden" // Ocultamos el circulito por defecto para un look más limpio
                            />
                            {opcion}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SUBMIT BUTTON */}
          <div className="pt-6 border-t border-slate-700">
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-blue-500 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={20} /> Procesando...</>
              ) : (
                <><Send size={20} /> Enviar Respuestas</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EncuestaTransporte;