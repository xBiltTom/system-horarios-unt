'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  LIBRE: 'group-hover:bg-gray-50 dark:group-hover:bg-white/5 border border-transparent dark:border-transparent transition-all duration-200 cursor-pointer',
  OCUPADO: 'bg-rose-50 dark:bg-rose-900/10 border-l-4 border-l-rose-500 border-t border-b border-r border-rose-100/50 dark:border-rose-800/20 text-rose-600 dark:text-rose-400 cursor-not-allowed shadow-sm m-0.5 rounded-lg',
  SELECCION_TEMPORAL: 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-l-amber-500 border-t border-b border-r border-amber-200/50 dark:border-amber-500/20 text-amber-800 dark:text-amber-400 transition-all duration-200 cursor-pointer shadow-md m-0.5 rounded-lg hover:shadow-lg',
  BLOQUEO_INSTITUCIONAL: 'bg-stripes-gray dark:bg-stripes-dark text-gray-400/60 dark:text-gray-500/60 cursor-not-allowed m-0.5 rounded-lg border border-gray-200/40 dark:border-white/5',
  DOCENTE_OTRO_AMBIENTE: 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500 border-t border-b border-r border-indigo-200/50 dark:border-indigo-500/20 text-indigo-800 dark:text-indigo-400 transition-all duration-200 cursor-pointer shadow-md m-0.5 rounded-lg hover:shadow-lg',
};

const obtenerHoraEntera = (valor: string) => parseInt(valor.split(':')[0], 10);

const esBloqueoDeAlmuerzo = (horaInicio: string, bloqueoAlmuerzo?: { inicio: string; fin: string } | null) => {
  if (!bloqueoAlmuerzo?.inicio || !bloqueoAlmuerzo?.fin) return false;

  const hora = obtenerHoraEntera(horaInicio);
  const inicio = obtenerHoraEntera(bloqueoAlmuerzo.inicio);
  const fin = obtenerHoraEntera(bloqueoAlmuerzo.fin);

  return hora >= inicio && hora < fin;
};

// Helper: can this estado be toggled via drag?
const esEstadoInteractivo = (estado: string) =>
  estado === 'LIBRE' || estado === 'SELECCION_TEMPORAL' || estado === 'DOCENTE_OTRO_AMBIENTE';

export function MatrizDisponibilidad({ matriz, alHacerClickCelda, bloqueado = false, bloqueoAlmuerzo }: MatrizProps) {
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Resolve the visible estado for a celda (handles almuerzo override)
  const resolveEstado = useCallback(
    (celda: { estado: string; horaInicio: string }) => {
      const esAlmuerzo = celda.estado === 'LIBRE' && esBloqueoDeAlmuerzo(celda.horaInicio, bloqueoAlmuerzo);
      return esAlmuerzo ? 'BLOQUEO_INSTITUCIONAL' : celda.estado;
    },
    [bloqueoAlmuerzo]
  );
  
  const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLTableCellElement>, dia: string, hora: string) => {
    e.preventDefault();
    setDragTarget(`${dia}-${hora}`);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTableCellElement>, dia: string, hora: string) => {
    e.preventDefault();
    if (dragTarget === `${dia}-${hora}`) {
      setDragTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTableCellElement>, dia: string, hora: string, estadoVisible: string, info?: any) => {
    e.preventDefault();
    setDragTarget(null);
    const idComponenteStr = e.dataTransfer.getData('text/plain');
    if (!idComponenteStr) return;
    
    alHacerClickCelda(dia, hora, estadoVisible, info);
  };

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
      <div
        ref={tableRef}
        className="overflow-hidden rounded-2xl bg-white dark:bg-[#0A192F] shadow-sm border border-gray-200/60 dark:border-white/10"
      >
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full border-collapse text-left text-xs table-fixed">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-200/80 dark:border-white/10">
                <th className="px-2 py-4 font-semibold text-gray-400 dark:text-gray-500 text-center w-20 uppercase tracking-widest text-[10px]">Hora</th>
                {dias.map((dia) => (
                  <th key={dia} className="px-1 py-4 font-bold text-gray-600 dark:text-gray-300 text-center uppercase tracking-wider text-[11px]">
                    {dia}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50 dark:divide-white/5">
              {matriz.filas.map((fila) => {
                return (
                  <tr key={fila.horaInicio}>
                    <td className="px-2 py-3 text-center font-bold text-gray-400 dark:text-gray-500 w-20 align-top relative">
                      <div className="-mt-3 text-[11px] bg-white dark:bg-[#0A192F] inline-block px-1 relative z-10">{fila.horaInicio}</div>
                      <div className="absolute top-0 right-0 h-full w-px bg-gray-100 dark:bg-white/5"></div>
                    </td>
                    {fila.celdas.map((celda, idx) => {
                      const estadoVisible = resolveEstado(celda);
                      const isDragTarget = dragTarget === `${celda.diaSemana}-${celda.horaInicio}` && estadoVisible === 'LIBRE';
                      const isInteractive = esEstadoInteractivo(estadoVisible) && !bloqueado;

                      return (
                        <td
                          key={idx}
                          className={cn(
                            'p-0 text-center h-[75px] min-w-[130px] transition-all group align-top border-l border-gray-100/50 dark:border-white/5 border-dashed relative',
                            isDragTarget && 'bg-blue-50/30 dark:bg-white/5'
                          )}
                          onDragOver={(e) => isInteractive && handleDragOver(e)}
                          onDragEnter={(e) => isInteractive && handleDragEnter(e, celda.diaSemana, celda.horaInicio)}
                          onDragLeave={(e) => isInteractive && handleDragLeave(e, celda.diaSemana, celda.horaInicio)}
                          onDrop={(e) => isInteractive && handleDrop(e, celda.diaSemana, celda.horaInicio, estadoVisible, celda.info)}
                          onClick={() => {
                            // Solo permitir clic para DESELECCIONAR celdas ocupadas por el usuario actual
                            if (isInteractive && estadoVisible !== 'LIBRE') {
                              alHacerClickCelda(celda.diaSemana, celda.horaInicio, estadoVisible, celda.info);
                            }
                          }}
                        >
                          <div className={cn(
                            'w-full h-full flex items-center justify-center p-1 transition-all absolute inset-0',
                            colores[estadoVisible],
                            bloqueado && estadoVisible !== 'BLOQUEO_INSTITUCIONAL' && 'cursor-not-allowed opacity-60 grayscale-[30%]',
                            isInteractive && 'cursor-pointer'
                          )}>
                            {estadoVisible === 'LIBRE' && (
                              <span className="text-gray-300 dark:text-gray-600 font-bold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                +
                              </span>
                            )}
                            {estadoVisible === 'OCUPADO' && (
                              <div className="flex flex-col items-start justify-center text-left w-full pl-2">
                                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 tracking-tight leading-none uppercase">
                                  Ocupado
                                </span>
                                {celda.info?.detalle && (
                                  <span className="text-[9px] text-rose-500 dark:text-rose-400/80 font-medium truncate w-full mt-1" title={celda.info.detalle}>
                                    {celda.info.detalle}
                                  </span>
                                )}
                              </div>
                            )}
                            {estadoVisible === 'SELECCION_TEMPORAL' && (
                              <div className="flex flex-col items-start justify-center w-full text-left pl-2">
                                <span className="text-[11px] font-black text-amber-900 dark:text-amber-100 leading-tight truncate w-full" title={celda.info?.curso}>
                                  {celda.info?.curso}
                                </span>
                                <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 leading-none mt-1">
                                  {celda.info?.tipoComponente} • Gr. {celda.info?.grupo}
                                </span>
                              </div>
                            )}
                            {estadoVisible === 'DOCENTE_OTRO_AMBIENTE' && (
                              <div className="flex flex-col items-start justify-center w-full text-left pl-2">
                                <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-100 leading-tight truncate w-full" title={celda.info?.curso}>
                                  {celda.info?.curso}
                                </span>
                                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 leading-none mt-1">
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
      <div className="flex flex-wrap gap-4 px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-[#0A192F] rounded-2xl border border-gray-200/60 dark:border-white/10 shadow-sm">
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded border border-gray-200 dark:border-white/10 border-dashed bg-gray-50 dark:bg-transparent"></span>
          <span>Libre (Arrastra para seleccionar)</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-rose-50 dark:bg-rose-900/20 border-l-2 border-l-rose-500"></span>
          <span>Ocupado por otro curso</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-amber-50 dark:bg-amber-900/20 border-l-2 border-l-amber-500"></span>
          <span className="flex items-center gap-1">
            Mi Selección (Clic para quitar)
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-l-indigo-500"></span>
          <span>Mi Horario en otra Aula (Clic para quitar)</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-stripes-gray dark:bg-stripes-dark border border-gray-200/40 dark:border-white/5"></span>
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