'use client';
import { useQuery } from '@tanstack/react-query';
import { horariosService } from '@/services/horarios.service';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface VisorConflictosProps {
  idPeriodo: number;
}

export function VisorConflictos({ idPeriodo }: VisorConflictosProps) {
  const { data: conflictos, isLoading } = useQuery({
    queryKey: ['conflictos', idPeriodo],
    queryFn: () => horariosService.obtenerConflictos(idPeriodo).then((res) => res.data),
    enabled: !!idPeriodo,
  });

  if (isLoading) return <SpinnerCarga />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">Análisis de Conflictos</h2>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#112240] text-gray-500 uppercase tracking-widest">Período {idPeriodo}</span>
      </div>
      
      {conflictos?.length === 0 ? (
        <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl shadow-sm">
          <div className="shrink-0 bg-white dark:bg-emerald-900/30 p-2 rounded-full shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-emerald-900 dark:text-emerald-400">
              Período libre de conflictos
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-500/80 font-medium mt-0.5">
              El padrón académico cumple con todas las reglas institucionales.
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {conflictos?.map((c: any, idx: number) => (
            <div key={idx} className="flex gap-4 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 rounded-xl shadow-sm">
              <div className="mt-0.5 shrink-0 bg-white dark:bg-rose-900/30 p-1.5 rounded-full shadow-sm h-fit">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400/80">{c.tipo}</span>
                <p className="text-sm font-semibold text-rose-900 dark:text-rose-300 leading-snug">
                  {c.descripcion}
                </p>
                {c.involucrados && c.involucrados.length > 0 && (
                  <div className="mt-2 bg-white/60 dark:bg-[#0A192F]/50 rounded-lg p-3 border border-rose-100 dark:border-rose-800/50">
                    <p className="text-[9px] font-bold text-rose-800/70 dark:text-rose-400/60 uppercase tracking-widest mb-1.5">Entidades Involucradas</p>
                    <p className="text-xs font-medium text-rose-900 dark:text-rose-300">{c.involucrados.join(' • ')}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}