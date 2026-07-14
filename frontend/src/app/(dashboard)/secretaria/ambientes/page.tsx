'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { ambientesService } from '@/services/ambientes.service';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { School, Search, Filter, LayoutGrid, List, Info, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utilidades';
import { usePaginacion } from '@/hooks/usePaginacion';
import { ControlPaginacion } from '@/components/ui/ControlPaginacion';

export default function AmbientesSecretariaPage() {
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroCapacidad, setFiltroCapacidad] = useState<string>('TODOS');
  const [busqueda, setBuscar] = useState('');

  const { data: periodos, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-secretaria-ambientes'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: periodoActivo } = useQuery({
    queryKey: ['periodo-activo-secretaria-ambientes'],
    queryFn: () => periodosService.activo().then((res) => res.data),
  });

  useEffect(() => {
    if (!idPeriodo && periodoActivo?.id) {
      setIdPeriodo(periodoActivo.id);
    }
    if (!idPeriodo && !periodoActivo?.id && (periodos || []).length > 0) {
      setIdPeriodo(periodos[0].id);
    }
  }, [idPeriodo, periodoActivo, periodos]);

  const { data: ambientes, isLoading: ambientesLoading } = useQuery({
    queryKey: ['ambientes-disponibilidad', idPeriodo],
    queryFn: () => ambientesService.disponibilidadGeneral(idPeriodo as number).then((res) => res.data),
    enabled: !!idPeriodo,
  });

  const ambientesFiltrados = useMemo(() => {
    return (ambientes || []).filter((amb: any) => {
      const coincideTipo = filtroTipo === 'TODOS' || amb.tipo === filtroTipo;
      
      let coincideCapacidad = true;
      if (filtroCapacidad === 'PEQUENO') coincideCapacidad = amb.capacidad <= 20;
      else if (filtroCapacidad === 'MEDIANO') coincideCapacidad = amb.capacidad > 20 && amb.capacidad <= 40;
      else if (filtroCapacidad === 'GRANDE') coincideCapacidad = amb.capacidad > 40;

      const coincideBusqueda = amb.codigo.toLowerCase().includes(busqueda.toLowerCase());
      return coincideTipo && coincideCapacidad && coincideBusqueda;
    });
  }, [ambientes, filtroTipo, filtroCapacidad, busqueda]);

  const paginacion = usePaginacion(ambientesFiltrados, { porPagina: 10 });

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Dossier Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#0A192F]/12 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A192F]/40 dark:text-white/40 mb-1.5">
            <School className="w-3.5 h-3.5" />
            <span>Gestión de Espacios</span>
          </div>
          <h1 className="font-serif text-[2rem] text-[#0A192F] dark:text-white tracking-tight leading-tight">Infraestructura Académica</h1>
        </div>
        <div className="w-full lg:w-80 shrink-0">
          <p className="text-[10px] font-bold text-[#0A192F]/40 dark:text-white/40 uppercase tracking-widest mb-2">Periodo de Consulta</p>
          <SelectorInstitucional
            opciones={[
              { value: '', label: 'Seleccionar periodo...' },
              ...(periodos || []).map((p: any) => ({ value: String(p.id), label: p.nombre })),
            ]}
            value={idPeriodo?.toString() || ''}
            onChange={(val) => setIdPeriodo(val ? parseInt(val as string, 10) : null)}
            className="w-full"
          />
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-[#0A192F] rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-[#112240] p-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="relative flex-1 w-full group h-[52px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#003366] dark:group-focus-within:text-[#D4AF37] transition-colors" />
            <input
              type="text"
              placeholder="Buscar por código de ambiente..."
              value={busqueda}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full h-full pl-12 pr-4 bg-gray-50 dark:bg-[#020C1B] border border-gray-200 dark:border-[#112240] rounded-2xl outline-none focus:bg-white dark:focus:bg-[#0A192F] focus:ring-4 focus:ring-[#003366]/10 dark:focus:ring-[#D4AF37]/10 focus:border-[#003366] dark:focus:border-[#D4AF37] transition-all font-medium text-gray-700 dark:text-white shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Tipo de Ambiente</label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#020C1B] p-1.5 rounded-2xl border border-gray-200 dark:border-[#112240]">
              {['TODOS', 'AULA', 'LABORATORIO'].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border outline-none focus:outline-none",
                    filtroTipo === tipo ? "bg-white dark:bg-[#0A192F] text-[#003366] dark:text-[#D4AF37] shadow-sm border-gray-100 dark:border-[#112240]" : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  )}
                >
                  {tipo === 'TODOS' ? 'Todos' : tipo === 'AULA' ? 'Aulas' : 'Labs'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Aforo (Alumnos)</label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#020C1B] p-1.5 rounded-2xl border border-gray-200 dark:border-[#112240]">
              {[
                { id: 'TODOS', label: 'Todos' },
                { id: 'PEQUENO', label: '≤ 20' },
                { id: 'MEDIANO', label: '21 - 40' },
                { id: 'GRANDE', label: '> 40' }
              ].map((cap) => (
                <button
                  key={cap.id}
                  onClick={() => setFiltroCapacidad(cap.id)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border outline-none focus:outline-none",
                    filtroCapacidad === cap.id ? "bg-white dark:bg-[#0A192F] text-[#003366] dark:text-[#D4AF37] shadow-sm border-gray-100 dark:border-[#112240]" : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  )}
                >
                  {cap.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Estado</label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#020C1B] p-1.5 rounded-2xl border border-gray-200 dark:border-[#112240]">
              <div className="flex-1 py-2.5 px-4 bg-white dark:bg-[#0A192F] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#003366] dark:text-[#D4AF37] shadow-sm border border-gray-100 dark:border-[#112240] flex items-center justify-center gap-2 outline-none">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                Operativos
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {ambientesLoading ? (
        <SpinnerCarga />
      ) : (
        <div className="bg-white dark:bg-[#0A192F] rounded-[2.5rem] shadow-xl border border-gray-200/60 dark:border-[#112240] overflow-hidden animate-in fade-in duration-500">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-[#020C1B] border-b border-gray-200 dark:border-[#112240]">
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Código</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tipo</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Aforo Máximo</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Nivel de Ocupación</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#112240]">
              {paginacion.itemsPagina.map((amb: any) => {
                const horas = amb.bloques?.length || 0;
                const ocupacionPorcentaje = Math.min((horas / 40) * 100, 100);
                
                return (
                  <tr key={amb.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          amb.tipo === 'AULA' ? "bg-[#003366]/10 text-[#003366] dark:bg-white/10 dark:text-[#D4AF37]" : "bg-[#D4AF37]/10 text-[#D4AF37]"
                        )}>
                          <School className="w-5 h-5" />
                        </div>
                        <span className="text-base font-black text-gray-700 dark:text-white">{amb.codigo}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        amb.tipo === 'AULA' ? "bg-white text-[#003366] border-[#003366]/20 dark:bg-transparent dark:text-gray-300 dark:border-white/20" : "bg-white text-[#D4AF37] border-[#D4AF37]/20 dark:bg-transparent dark:text-[#D4AF37] dark:border-[#D4AF37]/20"
                      )}>
                        {amb.tipo}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center font-bold text-gray-600 dark:text-gray-400">{amb.capacidad}</td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="font-black text-gray-700 dark:text-white">{horas}h</span>
                        <div className="w-16 h-1.5 bg-gray-100 dark:bg-[#112240] rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              ocupacionPorcentaje > 80 ? "bg-rose-500" : ocupacionPorcentaje > 50 ? "bg-amber-500" : "bg-emerald-500"
                            )} 
                            style={{ width: `${ocupacionPorcentaje}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-gray-400 hover:text-[#003366] hover:bg-gray-100 dark:hover:text-[#D4AF37] dark:hover:bg-white/10 rounded-xl transition-all">
                        <Info className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-8 pb-5">
            <ControlPaginacion {...paginacion} etiqueta="ambientes" />
          </div>
        </div>
      )}
    </div>
  );
}
