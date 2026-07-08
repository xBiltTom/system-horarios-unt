interface ProgresoCurso {
  idComponente: number;
  nombreCurso: string;
  tipoComponente: string;
  horasRequeridas: number;
  horasAsignadas: number;
}

interface IndicadorProgresoHorasProps {
  progreso: ProgresoCurso[];
}

export function IndicadorProgresoHoras({ progreso }: IndicadorProgresoHorasProps) {
  return (
    <div className="space-y-4">
      {progreso.map((item, idx) => {
        const porcentaje = item.horasRequeridas > 0 ? Math.min(Math.round((item.horasAsignadas / item.horasRequeridas) * 100), 100) : 0;
        const estaCompleto = item.horasAsignadas >= item.horasRequeridas;
        
        return (
          <div key={idx} className="space-y-1.5">
            <div className="flex justify-between items-center px-0.5">
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-800 dark:text-white leading-tight truncate max-w-[140px]">
                  {item.nombreCurso}
                </span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest">
                  {item.tipoComponente}
                </span>
              </div>
              <span className="text-[10px] font-black text-slate-800 dark:text-white tabular-nums">
                {item.horasAsignadas} / {item.horasRequeridas}h
              </span>
            </div>
            
            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  estaCompleto ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'bg-indigo-500 dark:bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.2)]'
                }`}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
