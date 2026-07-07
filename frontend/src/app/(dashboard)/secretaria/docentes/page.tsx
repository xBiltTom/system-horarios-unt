'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { cargaHorariaService } from '@/services/carga-horaria.service';
import { Selector } from '@/components/ui/Selector';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { UserCheck, Search, Briefcase, GraduationCap, Clock, Mail, Phone, LayoutGrid, List, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utilidades';

export default function DocentesSecretariaPage() {
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [filtroModalidad, setFiltroModalidad] = useState<string>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS');
  const [busqueda, setBuscar] = useState('');
  const [vista, setVista] = useState<'grid' | 'tabla'>('grid');

  const { data: periodos, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-secretaria-docentes'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: periodoActivo } = useQuery({
    queryKey: ['periodo-activo-secretaria-docentes'],
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

  const { data: cargaResumen, isLoading: cargaLoading } = useQuery({
    queryKey: ['carga-horaria-resumen', idPeriodo],
    queryFn: () => cargaHorariaService.obtenerResumen(idPeriodo as number).then((res) => res.data),
    enabled: !!idPeriodo,
  });

  const categoriasUnicas = useMemo(() => {
    if (!cargaResumen) return [];
    const cats = (cargaResumen as any[]).map(d => d.categoria).filter(Boolean);
    return Array.from(new Set(cats)).sort() as string[];
  }, [cargaResumen]);

  const docentesFiltrados = useMemo(() => {
    return (cargaResumen || []).filter((doc: any) => {
      const coincideModalidad = filtroModalidad === 'TODOS' || doc.modalidad === filtroModalidad;
      const coincideCategoria = filtroCategoria === 'TODOS' || doc.categoria === filtroCategoria;
      const nombreCompleto = `${doc.nombres} ${doc.apellidos}`.toLowerCase();
      const coincideBusqueda = nombreCompleto.includes(busqueda.toLowerCase());
      return coincideModalidad && coincideCategoria && coincideBusqueda;
    }).map((doc: any) => {
      const horasAsignadas = (doc.asignaciones || []).reduce(
        (sum: number, a: any) => sum + (a.horas_asignadas || 0),
        0
      );
      return { ...doc, horasAsignadas };
    });
  }, [cargaResumen, filtroModalidad, filtroCategoria, busqueda]);

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Header Estilo Classroom */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4338ca] px-10 py-12 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-white/90">
              <UserCheck className="w-3.5 h-3.5" />
              Gestión de Talento
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Carga Horaria Docente</h1>
            <p className="text-lg text-white/70 max-w-2xl">
              Monitorea la asignación de horas y disponibilidad del cuerpo docente de la Escuela.
            </p>
          </div>
          
          <div className="w-full lg:w-80 bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20 shadow-inner">
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3 ml-1">Periodo Lectivo</p>
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nombre de docente..."
              value={busqueda}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full h-full pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-600 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl h-[52px]">
            <button onClick={() => setVista('grid')} className={cn("p-3 rounded-xl transition-all", vista === 'grid' ? "bg-white text-indigo-600 shadow-md" : "text-slate-400 hover:text-slate-600")}>
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button onClick={() => setVista('tabla')} className={cn("p-3 rounded-xl transition-all", vista === 'tabla' ? "bg-white text-indigo-600 shadow-md" : "text-slate-400 hover:text-slate-600")}>
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modalidad</label>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              {['TODOS', 'NOMBRADO', 'CONTRATADO'].map((mod) => (
                <button
                  key={mod}
                  onClick={() => setFiltroModalidad(mod)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    filtroModalidad === mod ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {mod === 'TODOS' ? 'Todos' : mod.charAt(0) + mod.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Selector
              label="Categoría"
              opciones={[
                { valor: 'TODOS', etiqueta: 'Todas las categorías' },
                ...categoriasUnicas.map(cat => ({ valor: cat, etiqueta: cat }))
              ]}
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado de Carga</label>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <div className="flex-1 py-2.5 px-4 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-500 shadow-sm border border-slate-100 flex items-center justify-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Actualizado
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {cargaLoading ? (
        <SpinnerCarga />
      ) : vista === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {docentesFiltrados.map((doc: any) => {
            const porcentaje = Math.min(Math.round((doc.horasAsignadas / (doc.horas_max_semana || 40)) * 100), 100);
            return (
              <div key={doc.id} className="group bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full bg-indigo-500 opacity-5 transition-transform group-hover:scale-150 duration-700" />
                
                <div className="relative z-10 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      doc.modalidad === 'NOMBRADO' ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-purple-50 border-purple-100 text-purple-600"
                    )}>
                      {doc.modalidad}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight line-clamp-2 h-14">{doc.nombres} {doc.apellidos}</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                      <Briefcase className="w-3 h-3" /> {doc.categoria}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Carga Académica</span>
                      </div>
                      <p className="text-sm font-black text-slate-700">{doc.horasAsignadas} <span className="text-[10px] font-bold text-slate-400">/ {doc.horas_max_semana || 40}h</span></p>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 ease-out",
                          porcentaje >= 100 ? "bg-emerald-500" : porcentaje > 80 ? "bg-amber-500" : "bg-indigo-500"
                        )} 
                        style={{ width: `${porcentaje}%` }} 
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col gap-2 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium truncate">{doc.email || 'Sin correo'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-medium">{doc.telefono || 'Sin teléfono'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200/60 overflow-hidden animate-in fade-in duration-500">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Docente</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Modalidad</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Horas Máx.</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Horas Asign.</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docentesFiltrados.map((doc: any) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                        {doc.nombres[0]}{doc.apellidos[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-black text-slate-700">{doc.nombres} {doc.apellidos}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{doc.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      doc.modalidad === 'NOMBRADO' ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-purple-50 border-purple-100 text-purple-600"
                    )}>
                      {doc.modalidad}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-bold text-slate-500 text-sm">{doc.categoria}</td>
                  <td className="px-8 py-5 text-center font-bold text-slate-600">{doc.horas_max_semana || 40}h</td>
                  <td className="px-8 py-5 text-center">
                    <span className={cn(
                      "font-black",
                      doc.horasAsignadas >= (doc.horas_max_semana || 40) ? "text-emerald-600" : "text-slate-700"
                    )}>
                      {doc.horasAsignadas}h
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
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
