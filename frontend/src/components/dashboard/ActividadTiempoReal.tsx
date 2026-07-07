'use client';
import { Activity } from 'lucide-react';

interface Evento {
  tipo: string;
  timestamp?: string;
  [key: string]: any;
}

export function ActividadTiempoReal({ eventos }: { eventos: Evento[] }) {
  return (
    <div className="h-full space-y-4 overflow-y-auto custom-scrollbar pr-2">
      {eventos.length === 0 && (
        <div className="text-center py-6 text-gray-400 dark:text-gray-600 flex flex-col items-center">
          <Activity className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-sm">Sin actividad reciente</p>
        </div>
      )}
      {eventos.map((ev, idx) => (
        <div key={idx} className="text-sm pb-3 border-b border-gray-100 dark:border-[#112240] last:border-0 last:pb-0">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-[#003366] dark:text-gray-200">{ev.tipo}</span>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
              {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Ahora'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={JSON.stringify(ev)}>
            {JSON.stringify(ev).replace(/[{""}]/g, '').slice(0, 80)}...
          </p>
        </div>
      ))}
    </div>
  );
}