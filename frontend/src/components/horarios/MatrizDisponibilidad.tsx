'use client';
import { cn } from '@/lib/utilidades';

interface MatrizProps {
  matriz: {
    ambienteId: number;
    ambienteCodigo: string;
    filas: {
      horaInicio: string;
      celdas: {
        diaSemana: string;
        horaInicio: string;
        estado: string;
        info?: {
          idAmbiente?: number;
          ambienteCodigo?: string;
          curso?: string;
          tipoComponente?: string;
          grupo?: string;
          confirmado?: boolean;
          estadoBloque?: string;
          detalle?: string;
        };
      }[];
    }[];
  } | null;
  alHacerClickCelda: (dia: string, hora: string, estado: string, info?: any) => void;
  bloqueado?: boolean;
  bloqueoAlmuerzo?: {
    inicio: string;
    fin: string;
  } | null;
}

const colores: Record<string, string> = {
  LIBRE: 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/10 border border-transparent dark:border-transparent transition-all duration-75 cursor-pointer hover:scale-[1.02] shadow-sm',
  OCUPADO: 'bg-rose-50/60 dark:bg-rose-900/10 border border-rose-100/80 dark:border-rose-800/30 text-rose-500/80 dark:text-rose-400/80 cursor-not-allowed shadow-sm',
  SELECCION_TEMPORAL: 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-500/50 text-amber-800 dark:text-amber-400 transition-all duration-75 cursor-pointer hover:scale-[1.02] shadow-sm',
  BLOQUEO_INSTITUCIONAL: 'bg-gray-50/50 dark:bg-[#020C1B]/50 border border-gray-200/40 dark:border-[#112240]/40 text-gray-400/60 dark:text-gray-500/60 cursor-not-allowed',
  DOCENTE_OTRO_AMBIENTE: 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-500/50 text-indigo-800 dark:text-indigo-400 transition-all duration-75 cursor-pointer hover:scale-[1.02] shadow-sm opacity-90',
};

const obtenerHoraEntera = (valor: string) => parseInt(valor.split(':')[0], 10);

const esBloqueoDeAlmuerzo = (horaInicio: string, bloqueoAlmuerzo?: { inicio: string; fin: string } | null) => {
  if (!bloqueoAlmuerzo?.inicio || !bloqueoAlmuerzo?.fin) return false;

  const hora = obtenerHoraEntera(horaInicio);
  const inicio = obtenerHoraEntera(bloqueoAlmuerzo.inicio);
  const fin = obtenerHoraEntera(bloqueoAlmuerzo.fin);

  return hora >= inicio && hora < fin;
};

export function MatrizDisponibilidad({ matriz, alHacerClickCelda, bloqueado = false, bloqueoAlmuerzo }: MatrizProps) {
  if (!matriz) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#112240] bg-gray-50/50 dark:bg-[#020C1B] p-12 text-center shadow-inner">
        <div className="rounded-full bg-gray-100 dark:bg-white/5 p-4 mb-3">
          <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Por favor, seleccione un ambiente</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">Elige un aula o laboratorio del menú superior para visualizar su matriz de horarios.</p>
      </div>
    );
  }

  const dias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs table-fixed">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-[#020C1B] border-b border-gray-200 dark:border-[#112240]">
                <th className="border-r border-gray-200 dark:border-[#112240] px-2 py-3 font-semibold text-gray-500 dark:text-gray-400 text-center w-24">Hora</th>
                {dias.map((dia) => (
                  <th key={dia} className="border-r border-gray-200 dark:border-[#112240] px-1 py-3 font-semibold text-gray-600 dark:text-gray-300 text-center uppercase tracking-wider">
                    {dia}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-[#112240]">
              {matriz.filas.map((fila) => {
                const horaFin = `${(parseInt(fila.horaInicio.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;
                return (
                  <tr key={fila.horaInicio}>
                    <td className="border-r border-b border-gray-100 dark:border-[#112240] px-2 py-3 text-center font-bold bg-white dark:bg-[#0A192F] text-gray-400 dark:text-gray-500 w-24 align-top">
                      <div className="-mt-3">{fila.horaInicio}</div>
                    </td>
                    {fila.celdas.map((celda, idx) => {
                      const esAlmuerzo = celda.estado === 'LIBRE' && esBloqueoDeAlmuerzo(celda.horaInicio, bloqueoAlmuerzo);
                      const estadoVisible = esAlmuerzo ? 'BLOQUEO_INSTITUCIONAL' : celda.estado;

                      return (
                        <td
                          key={idx}
                          className="border-r border-b border-gray-100 dark:border-[#112240] p-1 text-center h-[70px] min-w-[120px] transition-all group align-top"
                          onClick={() => {
                            if (bloqueado) return;
                            alHacerClickCelda(celda.diaSemana, celda.horaInicio, estadoVisible, celda.info);
                          }}
                        >
                          <div className={cn(
                            'w-full h-full rounded-xl flex items-center justify-center p-1.5 transition-all',
                            colores[estadoVisible],
                            bloqueado && estadoVisible !== 'BLOQUEO_INSTITUCIONAL' && 'cursor-not-allowed opacity-70'
                          )}>
                            {estadoVisible === 'LIBRE' && (
                              <span className="text-emerald-500 dark:text-emerald-400 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-75">
                                +
                              </span>
                            )}
                            {estadoVisible === 'OCUPADO' && (
                              <div className="flex flex-col items-center justify-center">
                                <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 tracking-tight leading-none">
                                  Ocupado
                                </span>
                                {celda.info?.detalle && (
                                  <span className="text-[8px] text-rose-400/90 dark:text-rose-300/80 font-semibold truncate max-w-[90px] mt-1" title={celda.info.detalle}>
                                    {celda.info.detalle}
                                  </span>
                                )}
                              </div>
                            )}
                            {estadoVisible === 'SELECCION_TEMPORAL' && (
                              <div className="flex flex-col items-center justify-center w-full">
                                <span className="text-[10px] font-black text-amber-900 dark:text-amber-500 leading-tight truncate max-w-[95px]" title={celda.info?.curso}>
                                  {celda.info?.curso}
                                </span>
                                <span className="text-[9px] font-bold text-amber-700 dark:text-amber-600 leading-none mt-1">
                                  {celda.info?.tipoComponente} • Gr. {celda.info?.grupo}
                                </span>
                              </div>
                            )}
                            {estadoVisible === 'DOCENTE_OTRO_AMBIENTE' && (
                              <div className="flex flex-col items-center justify-center w-full">
                                <span className="text-[10px] font-black text-indigo-900 dark:text-indigo-400 leading-tight truncate max-w-[95px]" title={celda.info?.curso}>
                                  {celda.info?.curso}
                                </span>
                                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-500 leading-none mt-1">
                                  Aula: {celda.info?.ambienteCodigo}
                                </span>
                              </div>
                            )}
                            {estadoVisible === 'BLOQUEO_INSTITUCIONAL' && (
                              <span className="text-[9px] font-bold text-gray-400/60 dark:text-gray-500/60 uppercase tracking-widest">
                                Almuerzo
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-[#020C1B] rounded-xl border border-gray-150 dark:border-[#112240]">
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30"></span>
          <span>Libre (Click para elegir)</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30"></span>
          <span>Ocupado por otro curso</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-500/50"></span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400"></span>
            Mi Selección en Aula actual (Click para quitar)
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-500/50"></span>
          <span>Mi Horario en otra Aula (Click para quitar)</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-gray-50 dark:bg-[#0A192F] border border-gray-200 dark:border-[#112240]"></span>
          <span>Restricción institucional / almuerzo</span>
        </span>
      </div>
      {bloqueado && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-500 font-medium">
          No puede realizar cambios porque no tiene una ventana de atención asignada.
        </div>
      )}
    </div>
  );
}