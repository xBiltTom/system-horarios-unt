'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utilidades';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { periodosService } from '@/services/periodos.service';
import { curriculaService } from '@/services/curricula.service';
import { cargaHorariaService } from '@/services/carga-horaria.service';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { LayoutGrid, Filter, BookOpen, Clock, Users, GraduationCap, Trash2, List } from 'lucide-react';

export default function OfertaPorCiclosPage() {
  const queryClient = useQueryClient();
  const [cicloSeleccionado, setCicloSeleccionado] = useState<number | null>(null);
  const [idCurricula, setIdCurricula] = useState<number | null>(null);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);

  const getCardColor = (id: number) => {
    const colors = [
      { bg: 'bg-blue-50/50', icon: 'bg-blue-100 text-blue-600', border: 'border-blue-100', accent: 'bg-blue-600' },
      { bg: 'bg-indigo-50/50', icon: 'bg-indigo-100 text-indigo-600', border: 'border-indigo-100', accent: 'bg-indigo-600' },
      { bg: 'bg-violet-50/50', icon: 'bg-violet-100 text-violet-600', border: 'border-violet-100', accent: 'bg-violet-600' },
      { bg: 'bg-emerald-50/50', icon: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-100', accent: 'bg-emerald-600' },
      { bg: 'bg-amber-50/50', icon: 'bg-amber-100 text-amber-600', border: 'border-amber-100', accent: 'bg-amber-600' },
      { bg: 'bg-rose-50/50', icon: 'bg-rose-100 text-rose-600', border: 'border-rose-100', accent: 'bg-rose-600' },
      { bg: 'bg-cyan-50/50', icon: 'bg-cyan-100 text-cyan-600', border: 'border-cyan-100', accent: 'bg-cyan-600' },
    ];
    return colors[id % colors.length];
  };

  // Obtener periodos
  const { data: periodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosService.listar().then(res => res.data),
  });

  const periodoActivo = periodos?.find((p: any) => p.activo);

  // Obtener currículas
  const { data: curricula } = useQuery({
    queryKey: ['curricula'],
    queryFn: () => curriculaService.listar().then(res => res.data),
  });

  const curriculaVigente = curricula?.find((c: any) => c.vigente);

  useEffect(() => {
    if (curriculaVigente && idCurricula === null) {
      setIdCurricula(curriculaVigente.id);
    }
  }, [curriculaVigente, idCurricula]);

  // Obtener ciclos del periodo activo
  const { data: ciclos, isLoading: isLoadingCiclos } = useQuery({
    queryKey: ['ciclos', periodoActivo?.id],
    queryFn: () => periodosService.obtenerCiclosActivo().then(res => res.data),
    enabled: !!periodoActivo,
  });

  // Ciclos formateados para el selector
  const opcionesCiclos = (ciclos || []).map((c: any) => ({
    value: String(c.id),
    label: `Ciclo ${c.numero}`,
  }));

  // Auto-seleccionar primer ciclo cuando carguen
  useEffect(() => {
    if (ciclos && ciclos.length > 0 && !cicloSeleccionado) {
      setCicloSeleccionado(ciclos[0].id);
    }
  }, [ciclos, cicloSeleccionado]);

  // Obtener cursos por ciclo y currícula
  const { data: cursos, isLoading: isLoadingCursos } = useQuery({
    queryKey: ['cursos-oferta-ciclo', periodoActivo?.id, cicloSeleccionado, idCurricula],
    queryFn: () => cargaHorariaService.obtenerCursosPorCiclo(periodoActivo.id, cicloSeleccionado!, idCurricula!).then(res => res.data),
    enabled: !!periodoActivo && !!cicloSeleccionado,
  });

  const mutationEliminar = useMutation({
    mutationFn: (id: number) => cargaHorariaService.eliminarOferta(id),
    onSuccess: () => {
      setToast({ mensaje: 'Oferta de curso eliminada correctamente', tipo: 'exito' });
      queryClient.invalidateQueries({ queryKey: ['cursos-oferta-ciclo'] });
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al eliminar oferta', tipo: 'error' });
    }
  });

  const alEliminar = (curso: any) => {
    if (confirm(`¿Está seguro de eliminar la oferta del curso "${curso.curso?.nombre}" para este ciclo? Esta acción no se puede deshacer si no hay horarios asociados.`)) {
      mutationEliminar.mutate(curso.id);
    }
  };

  return (
    <div className="space-y-8 max-w-[1800px] mx-auto pb-20 animate-in fade-in duration-500">
      {/* Dossier Header */}
      <div className="pb-5 border-b border-[#0A192F]/12 dark:border-white/10">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A192F]/40 dark:text-white/40 mb-1.5">
          <List className="w-3.5 h-3.5" />
          <span>Catálogo por Ciclo</span>
        </div>
        <h1 className="font-serif text-[2rem] text-[#0A192F] dark:text-white tracking-tight leading-tight">Malla y Oferta</h1>
      </div>

      <Card className="bg-white dark:bg-[#0A192F] border-none shadow-xl rounded-[2.5rem] overflow-visible z-20 relative">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#020C1B] px-4 py-3 rounded-2xl border border-gray-100 dark:border-white/10">
              <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Filtros Activos:</span>
            </div>

            <div className="w-64">
              <SelectorInstitucional
                opciones={opcionesCiclos}
                value={cicloSeleccionado?.toString() || ''}
                onChange={(val: any) => setCicloSeleccionado(val ? parseInt(val) : null)}
                placeholder="Seleccione un Ciclo"
              />
            </div>
            <div className="w-72">
              <SelectorInstitucional
                value={idCurricula?.toString() || ''}
                onChange={(val: any) => setIdCurricula(val ? parseInt(val) : null)}
                opciones={(curricula || []).map((c: any) => ({
                  value: String(c.id),
                  label: `${c.codigo} - ${c.nombre}${c.vigente ? ' (Vigente)' : ''}`
                }))}
                placeholder="Seleccione Currícula"
              />
            </div>

            {periodoActivo && (
              <div className="ml-auto flex items-center gap-2 px-5 py-3 bg-[#003366]/5 dark:bg-[#D4AF37]/10 text-[#003366] dark:text-[#D4AF37] rounded-2xl text-sm font-bold border border-[#003366]/10 dark:border-[#D4AF37]/20">
                <BookOpen className="w-4 h-4" />
                Periodo: {periodoActivo.nombre}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!cicloSeleccionado ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#0A192F] rounded-[2.5rem] border border-dashed border-gray-200 dark:border-white/10 shadow-sm">
          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-full mb-4">
            <List className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Seleccione un ciclo académico para visualizar su oferta.</p>
        </div>
      ) : isLoadingCursos ? (
        <div className="py-20 flex justify-center">
          <SpinnerCarga />
        </div>
      ) : cursos && cursos.length > 0 ? (
        <Card className="border-none shadow-xl bg-white dark:bg-[#0A192F] rounded-[2.5rem] overflow-hidden z-10 relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#020C1B] border-b border-gray-100 dark:border-white/5">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">CÓDIGO</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">CURSO</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">CRÉDITOS</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">COMPONENTES</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {cursos.map((curso: any) => (
                  <tr key={curso.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5 align-top">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#003366]/5 text-[#003366] dark:bg-white/5 dark:text-gray-300 border border-[#003366]/10 dark:border-white/10 font-mono">
                        {curso.curso?.codigo}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#003366] dark:group-hover:text-[#D4AF37] transition-colors">
                        {curso.curso?.nombre}
                      </p>
                    </td>
                    <td className="px-6 py-5 align-top text-center">
                      <span className="inline-flex items-center gap-1.5 text-[#003366] dark:text-[#D4AF37] bg-[#003366]/5 dark:bg-[#D4AF37]/10 px-2.5 py-1 rounded-lg text-xs font-bold border border-[#003366]/10 dark:border-[#D4AF37]/20">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {curso.curso?.creditos}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-col gap-2">
                        {curso.componentes && curso.componentes.map((comp: any) => (
                          <div key={comp.id} className="flex items-center gap-4 bg-white dark:bg-[#020C1B] border border-gray-100 dark:border-white/10 px-3 py-2 rounded-xl">
                            <div className="flex items-center gap-2 w-32">
                              <Clock className={cn("w-3.5 h-3.5", comp.tipo === 'TEORIA' ? 'text-blue-500' : 'text-purple-500')} />
                              <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                {comp.tipo === 'TEORIA' ? 'TEORÍA' : 'LABORATORIO'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 w-24">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {comp.horas_requeridas / (comp.grupos?.length || 1)}h/sem
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                {comp.grupos?.length || 0} GRUPO(S)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top text-right">
                      <button
                        onClick={() => alEliminar(curso)}
                        className="inline-flex items-center justify-center p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                        title="Eliminar oferta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#0A192F] rounded-[2.5rem] border border-dashed border-gray-200 dark:border-white/10 shadow-sm">
          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-full mb-4">
            <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No se encontraron cursos asignados a este ciclo.</p>
        </div>
      )}

      {toast && (
        <NotificacionToast
          mensaje={toast.mensaje}
          tipo={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
