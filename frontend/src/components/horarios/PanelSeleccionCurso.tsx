'use client';
import { cn } from '@/lib/utilidades';
import { Book, CheckCircle2 } from 'lucide-react';

interface ComponenteAsignable {
  idComponente: number;
  nombreCurso: string;
  tipoComponente: string;
  horasRequeridas: number;
  horasAsignadas: number;
}

interface PanelSeleccionCursoProps {
  componentes: ComponenteAsignable[];
  componenteSeleccionado: number | null;
  alCambiarComponente: (idComponente: number) => void;
}

export function PanelSeleccionCurso({
  componentes,
  componenteSeleccionado,
  alCambiarComponente,
}: PanelSeleccionCursoProps) {
  if (!componentes || componentes.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 text-xs font-medium">
        No hay componentes disponibles
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {componentes.map((comp) => {
        const esSeleccionado = componenteSeleccionado === comp.idComponente;
        const estaCompleto = comp.horasAsignadas >= comp.horasRequeridas;

        return (
          <button
            key={comp.idComponente}
            onClick={() => alCambiarComponente(comp.idComponente)}
            className={cn(
              'group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left',
              esSeleccionado
                ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-100 shadow-sm'
                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            )}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={cn(
                'p-2 rounded-lg transition-colors',
                esSeleccionado ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
              )}>
                <Book className="w-4 h-4" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className={cn(
                  'text-[11px] font-bold truncate',
                  esSeleccionado ? 'text-emerald-900' : 'text-slate-700'
                )}>
                  {comp.nombreCurso}
                </span>
                <span className={cn(
                  'text-[9px] font-black uppercase tracking-widest',
                  esSeleccionado ? 'text-emerald-600/70' : 'text-slate-400'
                )}>
                  {comp.tipoComponente}
                </span>
              </div>
            </div>

            {estaCompleto && (
              <div className="ml-2 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            )}

            {esSeleccionado && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-l-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
