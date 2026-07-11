'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utilidades';

interface MatrizCargaNoLectivaProps {
  matriz: {
    filas: Array<{
      horaInicio: string;
      celdas: Array<{
        diaSemana: string;
        horaInicio: string;
        estado: 'LIBRE' | 'LECTIVO' | 'NO_LECTIVO' | 'BLOQUEO_ALMUERZO';
        info?: {
          origen?: string;
          seccion?: string;
        };
      }>;
    }>;
  };
  alHacerClickCelda: (dia: string, hora: string) => void;
  bloqueado?: boolean;
}

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

// Helper: can this estado be toggled via drag?
const esEstadoInteractivo = (estado: string) =>
  estado === 'LIBRE' || estado === 'NO_LECTIVO';

export function MatrizCargaNoLectiva({ matriz, alHacerClickCelda, bloqueado = false }: MatrizCargaNoLectivaProps) {
  // Drag-to-paint state
  const [isDragging, setIsDragging] = useState(false);
  const dragModeRef = useRef<'paint' | 'erase' | null>(null);
  const processedCellsRef = useRef<Set<string>>(new Set());

  const cellKey = (dia: string, hora: string) => `${dia}__${hora}`;

  // Global mouseup listener to stop dragging even if the mouse leaves the table
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        dragModeRef.current = null;
        processedCellsRef.current.clear();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging]);

  // Prevent text selection while dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    } else {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }
    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [isDragging]);

  const handleMouseDown = useCallback(
    (dia: string, hora: string, estado: string) => {
      if (bloqueado) return;
      if (!esEstadoInteractivo(estado)) return;

      // Determine drag mode based on the first cell
      const mode: 'paint' | 'erase' = estado === 'LIBRE' ? 'paint' : 'erase';

      dragModeRef.current = mode;
      processedCellsRef.current.clear();
      processedCellsRef.current.add(cellKey(dia, hora));
      setIsDragging(true);

      // Act on the first cell immediately
      alHacerClickCelda(dia, hora);
    },
    [bloqueado, alHacerClickCelda]
  );

  const handleMouseEnter = useCallback(
    (dia: string, hora: string, estado: string) => {
      if (!isDragging || bloqueado || !dragModeRef.current) return;

      const key = cellKey(dia, hora);
      if (processedCellsRef.current.has(key)) return;

      // Only act on cells compatible with the current drag mode
      if (dragModeRef.current === 'paint' && estado !== 'LIBRE') return;
      if (dragModeRef.current === 'erase' && estado !== 'NO_LECTIVO') return;

      processedCellsRef.current.add(key);
      alHacerClickCelda(dia, hora);
    },
    [isDragging, bloqueado, alHacerClickCelda]
  );

  const getLabelSeccion = (clave: string) => {
    return clave.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-left text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="border-r border-slate-200 px-4 py-3 font-bold text-slate-500 text-center w-24">Hora</th>
            {DIAS.map((dia) => (
              <th key={dia} className="border-r border-slate-200 px-4 py-3 font-bold text-slate-600 text-center uppercase tracking-wider">
                {dia}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {matriz.filas.map((fila, idx) => (
            <tr key={idx} className="group hover:bg-slate-50/30 transition-colors">
              <td className="border-r border-slate-200 px-3 py-2 font-bold text-slate-400 text-center bg-slate-50/50">
                {fila.horaInicio}
              </td>
              {fila.celdas.map((celda, cIdx) => {
                const isClickable = esEstadoInteractivo(celda.estado);

                // Visual feedback during drag: highlight compatible cells
                const isDragTarget =
                  isDragging &&
                  !bloqueado &&
                  ((dragModeRef.current === 'paint' && celda.estado === 'LIBRE') ||
                    (dragModeRef.current === 'erase' && celda.estado === 'NO_LECTIVO'));

                return (
                  <td
                    key={cIdx}
                    onMouseDown={(e) => {
                      e.preventDefault(); // prevent text selection
                      if (!bloqueado && isClickable) {
                        handleMouseDown(celda.diaSemana, celda.horaInicio, celda.estado);
                      }
                    }}
                    onMouseEnter={() =>
                      handleMouseEnter(celda.diaSemana, celda.horaInicio, celda.estado)
                    }
                    className={cn(
                      "border-r border-slate-100 p-0.5 transition-all duration-200 relative",
                      isClickable && !bloqueado ? "cursor-pointer group/celda" : "cursor-default",
                      celda.estado === 'LIBRE' && "bg-white hover:bg-indigo-50/50",
                      celda.estado === 'LECTIVO' && "bg-slate-100 text-slate-400",
                      celda.estado === 'NO_LECTIVO' && "bg-indigo-50 border-indigo-200",
                      celda.estado === 'BLOQUEO_ALMUERZO' && "bg-amber-50/30 text-amber-400",
                      isDragTarget && "ring-2 ring-inset ring-indigo-400/60 bg-indigo-50/40",
                      isDragging && isClickable && "cursor-crosshair"
                    )}
                  >
                    <div className="min-h-[42px] flex flex-col items-center justify-center p-1 text-center">
                      {celda.estado === 'LECTIVO' && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Lectivo</span>
                          <span className="text-[8px] font-medium leading-none opacity-70 line-clamp-2">{celda.info?.origen}</span>
                        </div>
                      )}
                      
                      {celda.estado === 'NO_LECTIVO' && (
                        <div className="flex flex-col gap-0.5 animate-in zoom-in-95 duration-200">
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">No Lectivo</span>
                          <span className="text-[8px] font-bold text-indigo-900 leading-none line-clamp-2">
                            {celda.info?.seccion ? getLabelSeccion(celda.info.seccion) : ''}
                          </span>
                        </div>
                      )}

                      {celda.estado === 'BLOQUEO_ALMUERZO' && (
                        <span className="text-[9px] font-bold opacity-40">Almuerzo</span>
                      )}

                      {celda.estado === 'LIBRE' && !bloqueado && (
                        <span className="text-indigo-300 font-bold text-lg opacity-0 group-hover/celda:opacity-100 transition-opacity">+</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
