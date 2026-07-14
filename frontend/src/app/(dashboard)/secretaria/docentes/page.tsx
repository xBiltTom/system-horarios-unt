'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { cargaHorariaService } from '@/services/carga-horaria.service';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { UserCheck, Search, Briefcase, GraduationCap, Clock, Mail, Phone, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utilidades';

export default function DocentesSecretariaPage() {
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [filtroModalidad, setFiltroModalidad] = useState<string>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS');
  const [busqueda, setBuscar] = useState('');

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
      {/* Dossier Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#0A192F]/12 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A192F]/40 dark:text-white/40 mb-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Plana Docente</span>
          </div>
          <h1 className="font-serif text-[2rem] text-[#0A192F] dark:text-white tracking-tight leading-tight">Padrón Académico</h1>
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
              placeholder="Buscar por nombre o apellidos..."
              value={busqueda}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full h-full pl-12 pr-4 bg-gray-50 dark:bg-[#020C1B] border border-gray-200 dark:border-[#112240] rounded-2xl outline-none focus:bg-white dark:focus:bg-[#0A192F] focus:ring-4 focus:ring-[#003366]/10 dark:focus:ring-[#D4AF37]/10 focus:border-[#003366] dark:focus:border-[#D4AF37] transition-all font-medium text-gray-700 dark:text-white shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Régimen</label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#020C1B] p-1.5 rounded-2xl border border-gray-200 dark:border-[#112240]">
              {['TODOS', 'NOMBRADO', 'CONTRATADO'].map((mod) => (
                <button
                  key={mod}
                  onClick={() => setFiltroModalidad(mod)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border outline-none focus:outline-none",
                    filtroModalidad === mod ? "bg-white dark:bg-[#0A192F] text-[#003366] dark:text-[#D4AF37] shadow-sm border-gray-100 dark:border-[#112240]" : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  )}
                >
                  {mod === 'TODOS' ? 'Todos' : mod.charAt(0) + mod.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Categoría</label>
            <SelectorInstitucional
              opciones={[
                { value: 'TODOS', label: 'Todas las categorías' },
                ...categoriasUnicas.map(cat => ({ value: cat, label: cat }))
              ]}
              value={filtroCategoria}
              onChange={(val) => setFiltroCategoria(val as string)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Estado de Carga</label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#020C1B] p-1.5 rounded-2xl border border-gray-200 dark:border-[#112240]">
              <div className="flex-1 py-2.5 px-4 bg-white dark:bg-[#0A192F] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#003366] dark:text-[#D4AF37] shadow-sm border border-gray-100 dark:border-[#112240] flex items-center justify-center gap-2 outline-none">
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
      ) : (
        <div className="bg-white dark:bg-[#0A192F] rounded-[2.5rem] shadow-xl border border-gray-200/60 dark:border-[#112240] overflow-hidden animate-in fade-in duration-500">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-[#020C1B] border-b border-gray-200 dark:border-[#112240]">
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Docente</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Régimen</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Categoría</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Dedicación Máx.</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Carga Actual</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#112240]">
              {docentesFiltrados.map((doc: any) => {
                const maxHoras = doc.horas_max_semana || 40;
                const asignadas = doc.horasAsignadas || 0;
                const porcentaje = Math.min((asignadas / maxHoras) * 100, 100);

                return (
                  <tr key={doc.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#003366]/10 text-[#003366] dark:bg-white/10 dark:text-[#D4AF37] flex items-center justify-center font-black text-xs">
                          {doc.nombres[0]}{doc.apellidos[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-base font-black text-gray-700 dark:text-white">{doc.nombres} {doc.apellidos}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{doc.email || 'Sin correo'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        doc.modalidad === 'NOMBRADO' ? "bg-white text-[#003366] border-[#003366]/20 dark:bg-transparent dark:text-gray-300 dark:border-white/20" : "bg-white text-[#D4AF37] border-[#D4AF37]/20 dark:bg-transparent dark:text-[#D4AF37] dark:border-[#D4AF37]/20"
                      )}>
                        {doc.modalidad}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-bold text-gray-600 dark:text-gray-400 text-sm">{doc.categoria}</td>
                    <td className="px-8 py-5 text-center font-bold text-gray-600 dark:text-gray-400">{maxHoras}h</td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="font-black text-gray-700 dark:text-white">{asignadas}h</span>
                        <div className="w-16 h-1.5 bg-gray-100 dark:bg-[#112240] rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              porcentaje >= 100 ? "bg-rose-500" : porcentaje > 60 ? "bg-amber-500" : "bg-[#003366] dark:bg-[#D4AF37]"
                            )} 
                            style={{ width: `${porcentaje}%` }} 
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
        </div>
      )}
    </div>
  );
}
