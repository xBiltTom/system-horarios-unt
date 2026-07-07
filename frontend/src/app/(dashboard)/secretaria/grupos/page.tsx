'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { gruposService } from '@/services/grupos.service';
import { Selector } from '@/components/ui/Selector';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { Users, Search, GraduationCap, BookOpen, Layers, LayoutGrid, List, Info, ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utilidades';

export default function GruposSecretariaPage() {
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [filtroCiclo, setFiltroCiclo] = useState<string>('TODOS');
  const [filtroComponente, setFiltroComponente] = useState<string>('TODOS');
  const [busqueda, setBuscar] = useState('');
  const [vista, setVista] = useState<'grid' | 'tabla'>('grid');

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
  }, [grupos, idPeriodo, filtroCiclo, filtroComponente, busqueda]);

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Header Estilo Classroom */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] px-10 py-12 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-white/90">
              <Users className="w-3.5 h-3.5" />
              Gestión de Grupos
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Grupos Generados</h1>
            <p className="text-lg text-white/70 max-w-2xl">
              Supervisa la distribución de estudiantes por componente y ciclo académico.
            </p>
          </div>
          
          <div className="w-full lg:w-80 bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20 shadow-inner">
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3 ml-1">Periodo de Análisis</p>
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por curso o código de grupo..."
              value={busqueda}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full h-full pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-600 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl h-[52px]">
            <button onClick={() => setVista('grid')} className={cn("p-3 rounded-xl transition-all", vista === 'grid' ? "bg-white text-blue-600 shadow-md" : "text-slate-400 hover:text-slate-600")}>
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button onClick={() => setVista('tabla')} className={cn("p-3 rounded-xl transition-all", vista === 'tabla' ? "bg-white text-blue-600 shadow-md" : "text-slate-400 hover:text-slate-600")}>
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
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Componente</label>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 h-[52px]">
              {['TODOS', 'TEORIA', 'PRACTICA', 'LABORATORIO'].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroComponente(tipo)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    filtroComponente === tipo ? "bg-white text-blue-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tipo === 'TODOS' ? 'Todos' : tipo === 'TEORIA' ? 'Teo' : tipo === 'PRACTICA' ? 'Pra' : 'Lab'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Análisis Estudiantil</label>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 h-[52px]">
              <div className="flex-1 py-2.5 px-4 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-500 shadow-sm border border-slate-100 flex items-center justify-center gap-2">
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
      ) : vista === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {gruposFiltrados.map((g: any) => (
            <div key={g.id} className="group bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full bg-blue-500 opacity-5 transition-transform group-hover:scale-150 duration-700" />
              
              <div className="relative z-10 space-y-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
                    <Users className="w-7 h-7" />
                  </div>
                  <span className="px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black uppercase tracking-widest text-blue-600">
                    Grupo {g.codigo}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight line-clamp-2 h-14">{g.componente?.oferta?.curso?.nombre}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-black uppercase">Ciclo {g.componente?.oferta?.ciclo?.numero || g.componente?.oferta?.ciclo?.id}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">• {g.componente?.tipo}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm border border-slate-100">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Capacidad Máx.</p>
                      <p className="text-lg font-black text-slate-700 leading-none">{g.capacidad_maxima} <span className="text-[10px] font-bold text-slate-400">Est.</span></p>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-slate-200 mx-2" />
                  <div className="flex-1 flex flex-col items-end">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1 text-right">Ocupación</p>
                    <p className="text-lg font-black text-blue-600 leading-none">0%</p>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-400">
                    <User className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Docente asignado</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
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
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Grupo</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Curso</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Ciclo</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Componente</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Capacidad</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gruposFiltrados.map((g: any) => (
                <tr key={g.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase border border-blue-100">
                      G{g.codigo}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-base font-black text-slate-700">{g.componente?.oferta?.curso?.nombre}</span>
                  </td>
                  <td className="px-8 py-5 text-center font-bold text-slate-500">
                    {g.componente?.oferta?.ciclo?.numero || g.componente?.oferta?.ciclo?.id}
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {g.componente?.tipo}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center font-bold text-slate-600">{g.capacidad_maxima}</td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
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
