import React from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utilidades';

export interface NotificacionToastProps {
  mensaje: string;
  tipo: 'exito' | 'success' | 'error' | 'advertencia';
  onClose?: () => void;
}

export function NotificacionToast({ mensaje, tipo, onClose }: NotificacionToastProps) {
  const t = tipo === 'success' ? 'exito' : tipo;

  const estilos = {
    exito: 'bg-white dark:bg-[#020C1B] border-emerald-500/30 dark:border-emerald-500/20 shadow-emerald-500/10 text-gray-800 dark:text-gray-100',
    success: 'bg-white dark:bg-[#020C1B] border-emerald-500/30 dark:border-emerald-500/20 shadow-emerald-500/10 text-gray-800 dark:text-gray-100',
    error: 'bg-white dark:bg-[#020C1B] border-rose-500/30 dark:border-rose-500/20 shadow-rose-500/10 text-gray-800 dark:text-gray-100',
    advertencia: 'bg-white dark:bg-[#020C1B] border-amber-500/30 dark:border-amber-500/20 shadow-amber-500/10 text-gray-800 dark:text-gray-100',
  };

  const IconoColores = {
    exito: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
    success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
    error: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10',
    advertencia: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10',
  };

  const Titulos = {
    exito: 'Notificación del Sistema',
    success: 'Notificación del Sistema',
    error: 'Acción Interrumpida',
    advertencia: 'Aviso del Sistema',
  };

  const Iconos = {
    exito: CheckCircle2,
    error: AlertCircle,
    advertencia: AlertTriangle,
  };

  const Icono = Iconos[t];

  return (
    <div 
      className={cn(
        "fixed bottom-8 right-8 p-4 rounded-xl border-l-4 border-y border-r shadow-2xl z-[200] w-[350px] animate-in slide-in-from-right-10 duration-300 flex items-start gap-4",
        estilos[t]
      )}
    >
      <div className={cn("p-2 rounded-lg shrink-0", IconoColores[t])}>
        <Icono className="w-5 h-5" />
      </div>
      <div className="flex-1 pt-0.5">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">
          {Titulos[t]}
        </p>
        <p className="text-sm font-bold leading-snug">{mensaje}</p>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#112240] rounded-lg transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}