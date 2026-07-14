'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { gruposService } from '@/services/grupos.service';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { Users, Search, GraduationCap, BookOpen, Layers, Info, ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utilidades';
import { usePaginacion } from '@/hooks/usePaginacion';
import { ControlPaginacion } from '@/components/ui/ControlPaginacion';

export default function GruposSecretariaPage() {
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [filtroCiclo, setFiltroCiclo] = useState<string>('TODOS');
  const [filtroComponente, setFiltroComponente] = useState<string>('TODOS');
  const [busqueda, setBuscar] = useState('');

  const { data: periodos, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-secretaria-grupos'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: periodoActivo } = useQuery({
    queryKey: ['periodo-activo-secretaria-grupos'],
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

  const { data: grupos, isLoading: gruposLoading } = useQuery({
    queryKey: ['grupos-secretaria', idPeriodo],
    queryFn: () => gruposService.listar().then((res) => res.data),
    enabled: !!idPeriodo,
  });

  const ciclosUnicos = useMemo(() => {
    if (!grupos) return [];
    const ciclos = (grupos as any[]).map(g => g.componente?.oferta?.ciclo?.numero || g.componente?.oferta?.ciclo?.id);
    return Array.from(new Set(ciclos)).filter(Boolean).sort((a, b) => Number(a) - Number(b));
  }, [grupos]);

  const gruposFiltrados = useMemo(() => {
    return (grupos || []).filter((g: any) => {
      const coincidePeriodo = g.componente?.oferta?.id_periodo === idPeriodo;
      const coincideCiclo = filtroCiclo === 'TODOS' || String(g.componente?.oferta?.ciclo?.numero || g.componente?.oferta?.ciclo?.id) === filtroCiclo;
      const coincideComponente = filtroComponente === 'TODOS' || g.componente?.tipo === filtroComponente;
      const coincideBusqueda = g.componente?.oferta?.curso?.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                              g.codigo.toLowerCase().includes(busqueda.toLowerCase());
      return coincidePeriodo && coincideCiclo && coincideComponente && coincideBusqueda;
    });
  }, [grupos, filtroCiclo, filtroComponente, busqueda]);

  const paginacion = usePaginacion(gruposFiltrados, { porPagina: 10 });

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Dossier Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#0A192F]/12 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A192F]/40 dark:text-white/40 mb-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Gestión de Grupos</span>
          </div>
          <h1 className="font-serif text-[2rem] text-[#0A192F] dark:text-white tracking-tight leading-tight">Padrón de Grupos</h1>
        </div>
        <div className="w-full lg:w-80 shrink-0">
          <p className="text-[10px] font-bold text-[#0A192F]/40 dark:text-white/40 uppercase tracking-widest mb-2">Periodo Lectivo</p>
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
              placeholder="Buscar por curso o código de grupo..."
              value={busqueda}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full h-full pl-12 pr-4 bg-gray-50 dark:bg-[#020C1B] border border-gray-200 dark:border-[#112240] rounded-2xl outline-none focus:bg-white dark:focus:bg-[#0A192F] focus:ring-4 focus:ring-[#003366]/10 dark:focus:ring-[#D4AF37]/10 focus:border-[#003366] dark:focus:border-[#D4AF37] transition-all font-medium text-gray-700 dark:text-white shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Ciclo Académico</label>
            <SelectorInstitucional
              opciones={[
                { value: 'TODOS', label: 'Todos los ciclos' },
                ...ciclosUnicos.map(ciclo => ({ value: String(ciclo), label: `Ciclo ${ciclo}` }))
              ]}
              value={filtroCiclo}
              onChange={(val) => setFiltroCiclo(val as string)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Tipo de Componente</label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#020C1B] p-1.5 rounded-2xl border border-gray-200 dark:border-[#112240] h-[52px]">
              {['TODOS', 'TEORIA', 'PRACTICA', 'LABORATORIO'].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroComponente(tipo)}
                  className={cn(
                    "flex-1 h-full rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border outline-none focus:outline-none",
                    filtroComponente === tipo ? "bg-white dark:bg-[#0A192F] text-[#003366] dark:text-[#D4AF37] shadow-sm border-gray-100 dark:border-[#112240]" : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  )}
                >
                  {tipo === 'TODOS' ? 'Todos' : tipo === 'TEORIA' ? 'Teo' : tipo === 'PRACTICA' ? 'Pra' : 'Lab'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Análisis Estudiantil</label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#020C1B] p-1.5 rounded-2xl border border-gray-200 dark:border-[#112240] h-[52px]">
              <div className="flex-1 h-full px-4 bg-white dark:bg-[#0A192F] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#003366] dark:text-[#D4AF37] shadow-sm border border-gray-100 dark:border-[#112240] flex items-center justify-center gap-2 outline-none">
                <Users className="w-3.5 h-3.5" />
                Matrícula Proyectada
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {gruposLoading ? (
        <SpinnerCarga />
      ) : (
        <div className="bg-white dark:bg-[#0A192F] rounded-[2.5rem] shadow-xl border border-gray-200/60 dark:border-[#112240] overflow-hidden animate-in fade-in duration-500">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-[#020C1B] border-b border-gray-200 dark:border-[#112240]">
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Grupo</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Curso</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Ciclo</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Componente</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Capacidad</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#112240]">
              {paginacion.itemsPagina.map((g: any) => (
                <tr key={g.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 rounded-full bg-[#003366]/10 text-[#003366] dark:bg-white/10 dark:text-[#D4AF37] text-[10px] font-black uppercase border border-[#003366]/20 dark:border-white/10 shadow-sm">
                      G{g.codigo}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-base font-black text-gray-700 dark:text-white">{g.componente?.oferta?.curso?.nombre}</span>
                  </td>
                  <td className="px-8 py-5 text-center font-bold text-gray-500 dark:text-gray-400">
                    {g.componente?.oferta?.ciclo?.numero || g.componente?.oferta?.ciclo?.id}
                  </td>
                  <td className="px-8 py-5">
                    <span 
                      className={cn(
                        "text-[9px] font-bold px-2 py-1 rounded border inline-block",
                        g.componente?.tipo === 'TEORIA' ? "bg-white text-[#003366] border-[#003366]/20 dark:bg-transparent dark:text-gray-300 dark:border-white/20" :
                        g.componente?.tipo === 'PRACTICA' ? "bg-[#003366]/10 text-[#003366] border-transparent dark:bg-white/10 dark:text-white" :
                        "bg-white text-[#D4AF37] border-[#D4AF37]/20 dark:bg-transparent dark:text-[#D4AF37] dark:border-[#D4AF37]/20"
                      )}
                    >
                      {g.componente?.tipo}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center font-bold text-gray-600 dark:text-gray-300">{g.capacidad_maxima} <span className="text-[9px] text-gray-400">est.</span></td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-gray-400 hover:text-[#003366] hover:bg-gray-100 dark:hover:text-[#D4AF37] dark:hover:bg-white/10 rounded-xl transition-all">
                      <Info className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-8 pb-5">
            <ControlPaginacion {...paginacion} etiqueta="grupos" />
          </div>
        </div>
      )}
    </div>
  );
}
