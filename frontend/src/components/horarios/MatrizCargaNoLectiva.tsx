'use client';

import React from 'react';
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
  alHacerDropCelda?: (dia: string, hora: string, seccionClave: string) => void;
  bloqueado?: boolean;
}

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

const esEstadoInteractivo = (estado: string) =>
  estado === 'LIBRE' || estado === 'NO_LECTIVO';

export function MatrizCargaNoLectiva({ matriz, alHacerClickCelda, alHacerDropCelda, bloqueado = false }: MatrizCargaNoLectivaProps) {
  const getLabelSeccion = (clave: string) => {
    return clave.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#0A192F] shadow-sm border border-slate-200/60 dark:border-white/10">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full border-collapse text-left text-xs table-fixed">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
              <th className="px-2 py-4 font-semibold text-slate-400 dark:text-slate-500 text-center w-20 uppercase tracking-widest text-[10px]">Hora</th>
              {DIAS.map((dia) => (
                <th key={dia} className="px-1 py-4 font-bold text-slate-600 dark:text-slate-300 text-center uppercase tracking-wider text-[11px]">
                  {dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
            {matriz.filas.map((fila, idx) => (
              <tr key={idx} className="group">
                <td className="px-2 py-3 text-center font-bold text-slate-400 dark:text-slate-500 w-20 align-top relative">
                  <div className="-mt-3 text-[11px] bg-white dark:bg-[#0A192F] inline-block px-1 relative z-10">{fila.horaInicio}</div>
                  <div className="absolute top-0 right-0 h-full w-px bg-slate-100 dark:bg-white/5"></div>
                </td>
                {fila.celdas.map((celda, cIdx) => {
                  const isClickable = esEstadoInteractivo(celda.estado);

                  return (
                    <td
                      key={cIdx}
                      onClick={() => {
                        if (!bloqueado && isClickable) {
                          alHacerClickCelda(celda.diaSemana, celda.horaInicio);
                        }
                      }}
                      onDragOver={(e) => {
                        if (!bloqueado && isClickable) {
                          e.preventDefault();
                        }
                      }}
                      onDrop={(e) => {
                        if (!bloqueado && isClickable) {
                          e.preventDefault();
                          const seccionClave = e.dataTransfer.getData('text/plain');
                          if (seccionClave && alHacerDropCelda) {
                            alHacerDropCelda(celda.diaSemana, celda.horaInicio, seccionClave);
                          }
                        }
                      }}
                      className={cn(
                        "p-0 text-center h-[55px] min-w-[120px] transition-all group/celda align-top border-l border-slate-100/50 dark:border-white/5 border-dashed relative",
                        isClickable && !bloqueado ? "cursor-pointer" : "cursor-default"
                      )}
                    >
                      <div
                        className={cn(
                          'w-full h-full flex items-center justify-center p-1 transition-all absolute inset-0',
                          celda.estado === 'LIBRE' && !bloqueado && "group-hover/celda:bg-indigo-50/30 dark:group-hover/celda:bg-white/5",
                          celda.estado === 'LECTIVO' && "bg-stripes-slate dark:bg-stripes-dark m-0.5 rounded-lg border border-slate-200/40 dark:border-white/5",
                          celda.estado === 'NO_LECTIVO' && "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500 border-t border-b border-r border-indigo-200/50 dark:border-indigo-500/20 m-0.5 rounded-lg shadow-sm hover:shadow-md",
                          celda.estado === 'BLOQUEO_ALMUERZO' && "bg-stripes-gray dark:bg-stripes-dark m-0.5 rounded-lg border border-slate-200/40 dark:border-white/5"
                        )}
                      >
                        {celda.estado === 'LECTIVO' && (
                          <div className="flex flex-col items-start justify-center w-full text-left pl-2">
                            <span className="text-[10px] font-black text-slate-400/60 dark:text-slate-500/60 uppercase tracking-tighter">Lectivo</span>
                            <span className="text-[8px] font-medium leading-none opacity-70 line-clamp-2 text-slate-400/80 dark:text-slate-500/80 mt-0.5">{celda.info?.origen}</span>
                          </div>
                        )}

                        {celda.estado === 'NO_LECTIVO' && (
                          <div className="flex flex-col items-start justify-center w-full text-left pl-2 animate-in zoom-in-95 duration-200">
                            <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-tighter w-full truncate">No Lectivo</span>
                            <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 leading-none truncate w-full mt-1">
                              {celda.info?.seccion ? getLabelSeccion(celda.info.seccion) : ''}
                            </span>
                          </div>
                        )}

                        {celda.estado === 'BLOQUEO_ALMUERZO' && (
                          <span className="text-[9px] font-bold text-slate-400/60 dark:text-slate-500/60 opacity-60">Almuerzo</span>
                        )}

                        {celda.estado === 'LIBRE' && !bloqueado && (
                          <span className="text-slate-300 dark:text-slate-600 font-bold text-lg opacity-0 group-hover/celda:opacity-100 transition-opacity">+</span>
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
    </div>
  );
}
