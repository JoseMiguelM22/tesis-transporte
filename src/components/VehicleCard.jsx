// src/components/VehicleCard.jsx
import { Car, Users, ChevronRight, Clock } from "lucide-react";

export const VehicleCard = ({ nombre, puestos, horaSalida }) => {
  // Unidades de 4 o 5 puestos: si queda 1, es crítico (naranja)
  const esCritico = puestos === 1;

  return (
    <div className="group bg-white/10 backdrop-blur-md rounded-[28px] p-4 border border-white/10 hover:bg-white/20 transition-all shadow-lg flex items-center justify-between overflow-hidden relative">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${esCritico ? 'bg-orange-500' : 'bg-green-500'}`}></div>
      
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-600/30 rounded-2xl flex items-center justify-center border border-white/10">
          <Car className="text-white w-6 h-6" />
        </div>
        
        <div className="flex flex-col">
          <h3 className="text-white text-lg font-black italic uppercase leading-none">{nombre}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1 opacity-80">
              <Users size={12} className={esCritico ? "text-orange-300" : "text-green-300"} />
              <span className="text-white text-[10px] font-bold">{puestos} Libres</span>
            </div>
            <div className="flex items-center gap-1 opacity-60">
              <Clock size={12} className="text-blue-200" />
              <span className="text-white text-[10px] font-bold">{horaSalida}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/10 p-2 rounded-full group-hover:bg-blue-600 transition-all">
        <ChevronRight size={18} className="text-white" />
      </div>
    </div>
  );
};