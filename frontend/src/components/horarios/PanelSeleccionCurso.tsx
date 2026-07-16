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
      <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">
        No hay carga pendiente
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
            draggable={!estaCompleto}
            onDragStart={(e) => {
              alCambiarComponente(comp.idComponente);
              e.dataTransfer.setData('text/plain', comp.idComponente.toString());
              e.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => alCambiarComponente(comp.idComponente)}
            className={cn(
              'group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left',
              esSeleccionado
                ? 'bg-[#003366]/5 dark:bg-[#D4AF37]/10 border-[#003366]/20 dark:border-[#D4AF37]/30 ring-2 ring-[#003366]/10 dark:ring-[#D4AF37]/20 shadow-sm'
                : 'bg-white dark:bg-[#0A192F] border-gray-100 dark:border-[#112240] hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/5',
              !estaCompleto && 'cursor-grab active:cursor-grabbing'
            )}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={cn(
                'p-2 rounded-lg transition-colors',
                esSeleccionado ? 'bg-[#003366] dark:bg-[#D4AF37] text-white dark:text-[#0A192F]' : 'bg-gray-100 dark:bg-[#020C1B] text-gray-400 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-[#112240]'
              )}>
                <Book className="w-4 h-4" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className={cn(
                  'text-[11px] font-bold truncate',
                  esSeleccionado ? 'text-[#003366] dark:text-[#D4AF37]' : 'text-gray-700 dark:text-gray-300'
                )}>
                  {comp.nombreCurso}
                </span>
                <span className={cn(
                  'text-[9px] font-black uppercase tracking-widest mt-0.5',
                  esSeleccionado ? 'text-[#003366]/70 dark:text-[#D4AF37]/70' : 'text-gray-400 dark:text-gray-500'
                )}>
                  {comp.tipoComponente}
                </span>
              </div>
            </div>

            {estaCompleto && (
              <div className="ml-2 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              </div>
            )}

            {esSeleccionado && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#003366] dark:bg-[#D4AF37] rounded-l-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
