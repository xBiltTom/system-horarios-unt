import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PanelValidacionesProps {
  validacion: {
    valido: boolean;
    conflictos: string[];
    advertencias: string[];
  } | null;
}

export function PanelValidaciones({ validacion }: PanelValidacionesProps) {
  if (!validacion) return null;

  const sinAlertas = validacion.conflictos.length === 0 && validacion.advertencias.length === 0;

  return (
    <div className="space-y-3">
      {validacion.conflictos.map((conflicto, idx) => (
        <div key={idx} className="flex gap-3 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 rounded-xl animate-in fade-in slide-in-from-left-2 shadow-sm">
          <div className="mt-0.5 shrink-0 bg-white dark:bg-rose-900/30 p-1 rounded-full shadow-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400/80">Conflicto Identificado</span>
            <p className="text-xs font-semibold text-rose-900 dark:text-rose-300 leading-snug">
              {conflicto}
            </p>
          </div>
        </div>
      ))}
      
      {validacion.advertencias.map((adv, idx) => (
        <div key={idx} className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl animate-in fade-in slide-in-from-left-2 shadow-sm">
          <div className="mt-0.5 shrink-0 bg-white dark:bg-amber-900/30 p-1 rounded-full shadow-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400/80">Aviso de Reglas</span>
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-300 leading-snug">
              {adv}
            </p>
          </div>
        </div>
      ))}
      
      {sinAlertas && validacion.valido && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl animate-in fade-in zoom-in-95 shadow-sm">
          <div className="shrink-0 bg-white dark:bg-emerald-900/30 p-1 rounded-full shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-400">
              Validación superada. Continúe con la confirmación.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}