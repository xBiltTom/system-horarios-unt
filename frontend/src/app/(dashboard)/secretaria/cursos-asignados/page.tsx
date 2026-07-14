'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { cargaHorariaService } from '@/services/carga-horaria.service';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { BookOpen, Search, Layers, GraduationCap, Users, Clock, Info, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utilidades';

export default function CursosAsignadosSecretariaPage() {
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [filtroCiclo, setFiltroCiclo] = useState<string>('TODOS');
  const [filtroComponente, setFiltroComponente] = useState<string>('TODOS');
  const [busqueda, setBuscar] = useState('');

  const { data: periodos, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-secretaria-cursos'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: periodoActivo } = useQuery({
    queryKey: ['periodo-activo-secretaria-cursos'],
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

  const { data: ofertas, isLoading: ofertasLoading } = useQuery({
    queryKey: ['ofertas-secretaria', idPeriodo],
    queryFn: () => cargaHorariaService.obtenerCursosPorCiclo(idPeriodo as number).then((res: any) => res.data),
    enabled: !!idPeriodo,
  });

  const ciclosUnicos = useMemo(() => {
    if (!ofertas) return [];
    const ciclos = (ofertas as any[]).map(o => o.ciclo?.numero || o.ciclo?.id);
    return Array.from(new Set(ciclos)).sort((a, b) => Number(a) - Number(b));
  }, [ofertas]);

  const cursosFiltrados = useMemo(() => {
    return (ofertas || []).filter((o: any) => {
      const coincideCiclo = filtroCiclo === 'TODOS' || String(o.ciclo?.numero || o.ciclo?.id) === filtroCiclo;
      
      const coincideComponente = filtroComponente === 'TODOS' || 
        (o.componentes || []).some((c: any) => c.tipo === filtroComponente);

      const coincideBusqueda = o.curso?.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                              o.curso?.codigo.toLowerCase().includes(busqueda.toLowerCase());
      return coincideCiclo && coincideComponente && coincideBusqueda;
    });
  }, [ofertas, filtroCiclo, filtroComponente, busqueda]);

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Dossier Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#0A192F]/12 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A192F]/40 dark:text-white/40 mb-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Plan de Estudios</span>
          </div>
          <h1 className="font-serif text-[2rem] text-[#0A192F] dark:text-white tracking-tight leading-tight">Oferta Académica</h1>
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
              placeholder="Buscar por nombre o código de curso..."
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
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Componente</label>
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
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Estado</label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#020C1B] p-1.5 rounded-2xl border border-gray-200 dark:border-[#112240] h-[52px]">
              <div className="flex-1 h-full px-4 bg-white dark:bg-[#0A192F] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#003366] dark:text-[#D4AF37] shadow-sm border border-gray-100 dark:border-[#112240] flex items-center justify-center gap-2 outline-none">
                <Layers className="w-3.5 h-3.5" />
                Plan Curricular
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {ofertasLoading ? (
        <SpinnerCarga />
      ) : (
        <div className="bg-white dark:bg-[#0A192F] rounded-[2.5rem] shadow-xl border border-gray-200/60 dark:border-[#112240] overflow-hidden animate-in fade-in duration-500">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-[#020C1B] border-b border-gray-200 dark:border-[#112240]">
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Código</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Asignatura</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Ciclo</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Créditos</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Componentes</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#112240]">
              {cursosFiltrados.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5 font-black text-gray-400 dark:text-gray-500 text-sm">{o.curso?.codigo}</td>
                  <td className="px-8 py-5">
                    <span className="text-base font-black text-gray-700 dark:text-white">{o.curso?.nombre}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-3 py-1 rounded-full bg-[#003366]/10 text-[#003366] dark:bg-white/10 dark:text-[#D4AF37] text-[10px] font-black uppercase border border-[#003366]/20 dark:border-white/10">
                      Ciclo {o.ciclo?.numero || o.ciclo?.id}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center font-bold text-gray-600 dark:text-gray-400">{o.curso?.creditos}</td>
                  <td className="px-8 py-5">
                    <div className="flex gap-2">
                      {(o.componentes || []).map((c: any) => (
                        <span 
                          key={c.id} 
                          className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded border",
                            c.tipo === 'TEORIA' ? "bg-white text-[#003366] border-[#003366]/20 dark:bg-transparent dark:text-gray-300 dark:border-white/20" :
                            c.tipo === 'PRACTICA' ? "bg-[#003366]/10 text-[#003366] border-transparent dark:bg-white/10 dark:text-white" :
                            "bg-white text-[#D4AF37] border-[#D4AF37]/20 dark:bg-transparent dark:text-[#D4AF37] dark:border-[#D4AF37]/20"
                          )}
                        >
                          {c.tipo[0]} ({c.horas_semanales}h)
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-gray-400 hover:text-[#003366] hover:bg-gray-100 dark:hover:text-[#D4AF37] dark:hover:bg-white/10 rounded-xl transition-all">
                      <Info className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
