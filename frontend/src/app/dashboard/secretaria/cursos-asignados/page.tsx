'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { cargaHorariaService } from '@/services/carga-horaria.service';
import { Selector } from '@/components/ui/Selector';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { BookOpen, Search, Layers, GraduationCap, Users, Clock, LayoutGrid, List, Info, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utilidades';

export default function CursosAsignadosSecretariaPage() {
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [filtroCiclo, setFiltroCiclo] = useState<string>('TODOS');
  const [filtroComponente, setFiltroComponente] = useState<string>('TODOS');
  const [busqueda, setBuscar] = useState('');
  const [vista, setVista] = useState<'grid' | 'tabla'>('grid');

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
      {/* Header Estilo Classroom */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#047857] px-10 py-12 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-white/90">
              <BookOpen className="w-3.5 h-3.5" />
              Catálogo Académico
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Cursos Asignados</h1>
            <p className="text-lg text-white/70 max-w-2xl">
              Gestiona la oferta académica y los componentes curriculares para el periodo actual.
            </p>
          </div>
          
          <div className="w-full lg:w-80 bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20 shadow-inner">
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3 ml-1">Periodo Vigente</p>
            <Selector
              label=""
              opciones={[
                { valor: '', etiqueta: 'Seleccionar periodo' },
                ...(periodos || []).map((p: any) => ({ valor: String(p.id), etiqueta: p.nombre })),
              ]}
              value={idPeriodo?.toString() || ''}
              onChange={(e) => setIdPeriodo(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="bg-white/20 border-white/10 text-white font-bold rounded-2xl h-[52px]"
            />
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200/60 p-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="relative flex-1 w-full group h-[52px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nombre o código de curso..."
              value={busqueda}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full h-full pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-600 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl h-[52px]">
            <button onClick={() => setVista('grid')} className={cn("p-3 rounded-xl transition-all", vista === 'grid' ? "bg-white text-emerald-600 shadow-md" : "text-slate-400 hover:text-slate-600")}>
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button onClick={() => setVista('tabla')} className={cn("p-3 rounded-xl transition-all", vista === 'tabla' ? "bg-white text-emerald-600 shadow-md" : "text-slate-400 hover:text-slate-600")}>
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Selector
              label="Ciclo Académico"
              opciones={[
                { valor: 'TODOS', etiqueta: 'Todos los ciclos' },
                ...ciclosUnicos.map(ciclo => ({ valor: String(ciclo), etiqueta: `Ciclo ${ciclo}` }))
              ]}
              value={filtroCiclo}
              onChange={(e) => setFiltroCiclo(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Componente</label>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 h-[52px]">
              {['TODOS', 'TEORIA', 'PRACTICA', 'LABORATORIO'].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroComponente(tipo)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    filtroComponente === tipo ? "bg-white text-emerald-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tipo === 'TODOS' ? 'Todos' : tipo === 'TEORIA' ? 'Teo' : tipo === 'PRACTICA' ? 'Pra' : 'Lab'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 h-[52px]">
              <div className="flex-1 py-2.5 px-4 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-500 shadow-sm border border-slate-100 flex items-center justify-center gap-2">
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
      ) : vista === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {cursosFiltrados.map((o: any) => (
            <div key={o.id} className="group bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full bg-emerald-500 opacity-5 transition-transform group-hover:scale-150 duration-700" />
              
              <div className="relative z-10 space-y-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm">
                    <Layers className="w-7 h-7" />
                  </div>
                  <span className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {o.curso?.codigo}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight line-clamp-2 h-14">{o.curso?.nombre}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase">Ciclo {o.ciclo?.numero || o.ciclo?.id}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">• {o.curso?.creditos} Créditos</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2 flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Componentes</p>
                  <div className="grid grid-cols-1 gap-2">
                    {(o.componentes || []).map((comp: any) => (
                      <div key={comp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group/item hover:bg-white hover:border-emerald-200 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-xs font-bold text-slate-600">{comp.tipo}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{comp.horas_semanales}h</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Ver grupos asignados</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200/60 overflow-hidden animate-in fade-in duration-500">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Asignatura</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Ciclo</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Créditos</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Componentes</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cursosFiltrados.map((o: any) => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5 font-black text-slate-400 text-sm">{o.curso?.codigo}</td>
                  <td className="px-8 py-5">
                    <span className="text-base font-black text-slate-700">{o.curso?.nombre}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase border border-emerald-100">
                      Ciclo {o.ciclo?.numero || o.ciclo?.id}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center font-bold text-slate-600">{o.curso?.creditos}</td>
                  <td className="px-8 py-5">
                    <div className="flex gap-2">
                      {(o.componentes || []).map((c: any) => (
                        <span key={c.id} className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {c.tipo[0]} ({c.horas_semanales}h)
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
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
