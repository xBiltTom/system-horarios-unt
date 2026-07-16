'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utilidades';
import { periodosService } from '@/services/periodos.service';
import { curriculaService } from '@/services/curricula.service';
import { cargaHorariaService } from '@/services/carga-horaria.service';
import { docentesService } from '@/services/docentes.service';
import { cursosService } from '@/services/cursos.service';
import { Card, CardContent } from '@/components/ui/Card';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { Boton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { Modal } from '@/components/ui/Modal';
import { SelectorFiltrable } from '@/components/ui/SelectorFiltrable';
import { Users, BookOpen, AlertCircle, Plus, Clock, GraduationCap, ArrowRight, CheckCircle2, Trash2, Edit2 } from 'lucide-react';

export default function CargaHorariaPage() {
  const queryClient = useQueryClient();
  const [idPeriodo, setIdPeriodo] = useState<number>(0);
  const [idCiclo, setIdCiclo] = useState<number>(0); // Nuevo estado para filtro por ciclo
  const [idCurricula, setIdCurricula] = useState<number | null>(null);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);
  const [modalAsignacion, setModalAsignacion] = useState(false);
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<any>(null);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState<any>(null);
  const [idDocente, setIdDocente] = useState<number>(0);
  const [horasAsignadas, setHorasAsignadas] = useState<number>(0);
  const [asignacionEditando, setAsignacionEditando] = useState<any>(null);

  const { data: responsePeriodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosService.listar().then(res => res.data)
  });
  const periodos = Array.isArray(responsePeriodos) ? responsePeriodos : responsePeriodos?.data || [];

  // Pre-seleccionar periodo activo
  useEffect(() => {
    if (periodos.length > 0 && idPeriodo === 0) {
      const activo = periodos.find((p: any) => p.activo);
      if (activo) setIdPeriodo(activo.id);
    }
  }, [periodos, idPeriodo]);

  const { data: responseDocentes } = useQuery({
    queryKey: ['docentes'],
    queryFn: () => docentesService.listar({}).then(res => res.data)
  });
  const docentes = Array.isArray(responseDocentes) ? responseDocentes : responseDocentes?.data || [];

  const { data: responseResumen } = useQuery({
    queryKey: ['resumen-carga', idPeriodo],
    queryFn: () => cargaHorariaService.obtenerResumen(idPeriodo).then(res => res.data),
    enabled: idPeriodo > 0
  });
  const resumenCarga = Array.isArray(responseResumen) ? responseResumen : responseResumen?.data || [];

  const { data: cursosConOferta, isLoading: loadingOferta } = useQuery({
    queryKey: ['cursos-con-oferta', idPeriodo, idCiclo, idCurricula],
    queryFn: () => cargaHorariaService.obtenerCursosPorCiclo(idPeriodo, idCiclo > 0 ? idCiclo : undefined, idCurricula!).then(res => res.data),
    enabled: idPeriodo > 0
  });

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

  const { data: ciclos } = useQuery({
    queryKey: ['ciclos', idPeriodo],
    queryFn: () => periodosService.obtenerCiclosPorPeriodo(idPeriodo).then(res => res.data),
    enabled: idPeriodo > 0
  });

  const mutationAsignar = useMutation({
    mutationFn: (datos: any) => {
      if (asignacionEditando) {
        return cargaHorariaService.actualizarAsignacion(asignacionEditando.id, datos);
      }
      return cargaHorariaService.asignarCarga(datos);
    },
    onSuccess: () => {
      setToast({ mensaje: 'Carga horaria procesada correctamente', tipo: 'exito' });
      setModalAsignacion(false);
      queryClient.invalidateQueries({ queryKey: ['resumen-carga', idPeriodo] });
      queryClient.invalidateQueries({ queryKey: ['cursos-con-oferta', idPeriodo] });
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al procesar carga', tipo: 'error' });
    }
  });

  const mutationEliminar = useMutation({
    mutationFn: (id: number) => cargaHorariaService.eliminarAsignacion(id),
    onSuccess: () => {
      setToast({ mensaje: 'Asignación eliminada', tipo: 'exito' });
      queryClient.invalidateQueries({ queryKey: ['resumen-carga', idPeriodo] });
      queryClient.invalidateQueries({ queryKey: ['cursos-con-oferta', idPeriodo] });
    }
  });

  const abrirModalAsignacion = (comp: any, oferta: any, asig?: any) => {
    setComponenteSeleccionado(comp);
    setOfertaSeleccionada(oferta);
    if (asig) {
      setAsignacionEditando(asig);
      setIdDocente(asig.id_docente);
      setHorasAsignadas(asig.horas_asignadas);
    } else {
      const horasAsignadasActual = comp.asignaciones.reduce((acc: number, a: any) => acc + a.horas_asignadas, 0);
      const faltan = comp.horas_requeridas - horasAsignadasActual;
      setAsignacionEditando(null);
      setIdDocente(0);
      setHorasAsignadas(faltan > 0 ? faltan : 0);
    }
    setModalAsignacion(true);
  };

  const manejarAsignar = () => {
    if (!idDocente || !horasAsignadas) return;
    
    const payload: any = {
      id_componente: componenteSeleccionado.id,
      id_docente: Number(idDocente),
      horas_asignadas: Math.round(Number(horasAsignadas))
    };

    mutationAsignar.mutate(payload);
  };

  const manejarEliminarAsignacion = (id: number) => {
    if (confirm('¿Seguro que desea eliminar esta asignación?')) {
      mutationEliminar.mutate(id);
    }
  };

  // Calcular progreso del ciclo seleccionado
  const obtenerProgresoCiclo = () => {
    if (!cursosConOferta || cursosConOferta.length === 0) return { porcentaje: 0, requeridas: 0, asignadas: 0 };
    
    let totalRequeridas = 0;
    let totalAsignadas = 0;
    
    cursosConOferta.forEach((oferta: any) => {
      oferta.componentes?.forEach((comp: any) => {
        totalRequeridas += comp.horas_requeridas || 0;
        totalAsignadas += comp.asignaciones?.reduce((acc: number, asig: any) => acc + asig.horas_asignadas, 0) || 0;
      });
    });
    
    const porcentaje = totalRequeridas > 0 ? Math.min(Math.round((totalAsignadas / totalRequeridas) * 100), 100) : 0;
    return { porcentaje, requeridas: totalRequeridas, asignadas: totalAsignadas };
  };

  const progresoCiclo = obtenerProgresoCiclo();

  const getCardColor = (id: number) => {
    const colors = [
      { bg: 'bg-blue-50/50', icon: 'bg-blue-100 text-blue-600', border: 'border-blue-100' },
      { bg: 'bg-indigo-50/50', icon: 'bg-indigo-100 text-indigo-600', border: 'border-indigo-100' },
      { bg: 'bg-violet-50/50', icon: 'bg-violet-100 text-violet-600', border: 'border-violet-100' },
      { bg: 'bg-emerald-50/50', icon: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-100' },
      { bg: 'bg-amber-50/50', icon: 'bg-amber-100 text-amber-600', border: 'border-amber-100' },
      { bg: 'bg-rose-50/50', icon: 'bg-rose-100 text-rose-600', border: 'border-rose-100' },
      { bg: 'bg-cyan-50/50', icon: 'bg-cyan-100 text-cyan-600', border: 'border-cyan-100' },
    ];
    return colors[id % colors.length];
  };

  return (
    <div className="space-y-8 max-w-[1800px] mx-auto pb-20 animate-in fade-in duration-500">
      {/* Header Institucional */}
      {/* Dossier Header */}
      <div className="pb-5 border-b border-[#0A192F]/12 dark:border-white/10">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A192F]/40 dark:text-white/40 mb-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Gestión Académica</span>
        </div>
        <h1 className="font-serif text-[2rem] text-[#0A192F] dark:text-white tracking-tight leading-tight">Carga Horaria Docente</h1>
      </div>

      <Card className="bg-white dark:bg-[#0A192F] border-none shadow-xl rounded-2xl overflow-visible relative z-20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="w-full sm:w-64">
              <SelectorInstitucional
                label="Período Lectivo"
                value={idPeriodo}
                onChange={(val: any) => setIdPeriodo(Number(val))}
                opciones={[
                  { value: 0, label: '-- Seleccionar Periodo --' },
                  ...(periodos?.map((p: any) => ({ value: p.id, label: p.nombre })) || [])
                ]}
              />
            </div>

            <div className="w-full sm:w-64">
              <SelectorInstitucional
                label="Filtrar por Ciclo"
                value={idCiclo}
                onChange={(val: any) => setIdCiclo(Number(val))}
                disabled={!idPeriodo}
                opciones={[
                  { value: 0, label: '-- Todos los Ciclos --' },
                  ...(ciclos?.map((c: any) => ({ value: c.id, label: `Ciclo ${c.numero}` })) || [])
                ]}
              />
            </div>

            <div className="w-full sm:w-80">
              <SelectorInstitucional
                label="Filtrar por Currícula"
                value={idCurricula?.toString() || ''}
                onChange={(val: any) => setIdCurricula(val ? parseInt(val) : null)}
                opciones={(curricula || []).map((c: any) => ({
                  value: String(c.id),
                  label: `${c.codigo} - ${c.nombre}${c.vigente ? ' (Vigente)' : ''}`
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!idPeriodo ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#0A192F] rounded-2xl border border-dashed border-gray-200 dark:border-white/10 shadow-sm text-center">
          <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-full mb-4">
            <Clock className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">No se ha seleccionado un período</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Selecciona un periodo lectivo en los filtros superiores para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-serif font-bold text-[#003366] dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#003366] dark:text-[#D4AF37]" /> Oferta Académica y Asignaciones
              </h2>
              
              {idCiclo > 0 && (
                <div className="flex items-center gap-4 bg-white dark:bg-[#0A192F] px-4 py-3 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm animate-in fade-in zoom-in duration-300">
                  <div className="flex flex-col w-40">
                    <div className="flex items-center justify-between gap-4 mb-1.5">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Carga del Ciclo</span>
                      <span className="text-[10px] font-bold text-[#003366] dark:text-[#D4AF37]">{progresoCiclo.porcentaje}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#003366] dark:bg-[#D4AF37] transition-all duration-1000"
                        style={{ width: `${progresoCiclo.porcentaje}%` }}
                      />
                    </div>
                  </div>
                  <div className="pl-4 border-l border-gray-100 dark:border-white/10">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Horas Cubiertas</p>
                    <p className="text-xs font-extrabold text-gray-900 dark:text-white">{progresoCiclo.asignadas}h / {progresoCiclo.requeridas}h</p>
                  </div>
                </div>
              )}
            </div>

            {loadingOferta ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 animate-pulse rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-4 max-h-[800px] overflow-y-auto custom-scrollbar pr-2">
                {cursosConOferta?.map((oferta: any) => {
                  return (
                    <Card key={oferta.id} className="border border-gray-100 dark:border-white/5 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-[#0A192F] transition-all duration-300 relative z-10 shrink-0">
                      <div className="px-6 py-4 border-b border-gray-50 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                          <div className="px-3 py-1 bg-[#003366]/5 dark:bg-white/5 border border-[#003366]/10 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-[#003366] dark:text-gray-300">
                            {oferta.curso?.codigo}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{oferta.curso?.nombre}</h3>
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <span className="px-3 py-1 bg-white dark:bg-[#020C1B] border border-gray-200 dark:border-white/10 rounded-xl text-[10px] font-bold text-gray-500 dark:text-gray-400 shadow-sm uppercase tracking-wider">
                            {oferta.ciclo?.nombre || `Ciclo ${oferta.id_ciclo}`}
                          </span>
                        </div>
                      </div>
                      
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-50 dark:divide-white/5">
                          {oferta.componentes.map((comp: any) => {
                            const horasAsignadasActual = comp.asignaciones.reduce((acc: number, a: any) => acc + a.horas_asignadas, 0);
                            const totalRequerido = comp.horas_requeridas;
                            const faltan = totalRequerido - horasAsignadasActual;
                            
                            return (
                              <div key={comp.id} className="p-6 flex flex-col xl:flex-row gap-6 hover:bg-gray-50/30 dark:hover:bg-white/[0.01] transition-colors group/row relative z-10">
                                {/* Info Componente */}
                                <div className="w-full xl:w-1/3 flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className={cn("w-4 h-4", comp.tipo === 'TEORIA' ? 'text-blue-500' : 'text-purple-500')} />
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                      {comp.tipo === 'TEORIA' ? 'Teoría-Práctica' : 'Laboratorio'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    <span className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md text-gray-700 dark:text-gray-300 font-bold">{totalRequerido}h</span> totales requeridas
                                  </div>
                                </div>

                                {/* Asignaciones & Actions */}
                                <div className="flex-1 flex flex-col gap-3">
                                  <div className="flex flex-wrap gap-2">
                                    {comp.asignaciones.map((asig: any) => (
                                      <div key={asig.id} className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-white dark:bg-[#020C1B] border border-gray-200 dark:border-white/10 rounded-2xl text-xs shadow-sm group/asig transition-all hover:border-[#003366]/30 dark:hover:border-[#D4AF37]/30">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                          {asig.docente.apellidos[0]}
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="font-bold text-gray-700 dark:text-gray-200 leading-tight">{asig.docente.apellidos}</span>
                                          <span className="text-[9px] text-gray-500 uppercase tracking-widest">{asig.horas_asignadas} horas</span>
                                        </div>
                                        <div className="flex gap-1 pl-2 border-l border-gray-100 dark:border-white/10 opacity-0 group-hover/asig:opacity-100 transition-opacity">
                                          <button onClick={() => abrirModalAsignacion(comp, oferta, asig)} className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors" title="Editar asignación"><Edit2 className="w-3.5 h-3.5"/></button>
                                          <button onClick={() => manejarEliminarAsignacion(asig.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors" title="Eliminar asignación"><Trash2 className="w-3.5 h-3.5"/></button>
                                        </div>
                                      </div>
                                    ))}
                                    
                                    {faltan > 0 && (
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold border border-red-100 dark:border-red-900/20">
                                        <div className="animate-pulse w-1.5 h-1.5 bg-red-500 rounded-full" />
                                        Faltan {faltan}h
                                      </div>
                                    )}
                                    {faltan <= 0 && (
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 rounded-2xl text-xs font-bold border border-green-200 dark:border-green-900/20">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Completo
                                      </div>
                                    )}
                                  </div>

                                  {faltan > 0 && (
                                    <div className="flex justify-start">
                                      <button 
                                        onClick={() => abrirModalAsignacion(comp, oferta)}
                                        className="inline-flex items-center gap-2 text-xs font-bold text-[#003366] dark:text-[#D4AF37] hover:text-[#002244] dark:hover:text-[#F3E5AB] bg-[#003366]/5 dark:bg-[#D4AF37]/10 hover:bg-[#003366]/10 dark:hover:bg-[#D4AF37]/20 px-3 py-1.5 rounded-xl transition-colors"
                                      >
                                        <Plus className="w-3.5 h-3.5" /> Nueva Asignación
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-serif font-bold text-[#003366] dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#003366] dark:text-[#D4AF37]" /> Carga Docente General
            </h2>
            <div className="flex flex-col gap-3 max-h-[800px] overflow-y-auto custom-scrollbar pr-2">
              {[...resumenCarga]
                .sort((a: any, b: any) => {
                  const totalA = a.asignaciones.reduce((acc: number, as: any) => acc + as.horas_asignadas, 0);
                  const totalB = b.asignaciones.reduce((acc: number, as: any) => acc + as.horas_asignadas, 0);
                  const maxA = a.horas_max_semana || 40;
                  const maxB = b.horas_max_semana || 40;
                  return (totalB / maxB) - (totalA / maxA); // Orden descendente por porcentaje
                })
                .map((docente: any) => {
                  const total = docente.asignaciones.reduce((acc: number, a: any) => acc + a.horas_asignadas, 0);
                  const max = docente.horas_max_semana || 40;
                  const porcentaje = Math.min((total / max) * 100, 100);
                  const isSaturated = porcentaje >= 100;
                  
                  return (
                    <div key={docente.id} className="p-4 bg-white dark:bg-[#0A192F] rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{docente.apellidos}, <span className="font-medium text-gray-500 dark:text-gray-400">{docente.nombres}</span></p>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                          isSaturated ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10"
                        )}>
                          {total}h / {max}h
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500",
                            isSaturated ? "bg-red-500" : porcentaje > 80 ? "bg-amber-500" : "bg-[#003366] dark:bg-[#D4AF37]"
                          )}
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      <Modal 
        isOpen={modalAsignacion} 
        onClose={() => setModalAsignacion(false)} 
        titulo={asignacionEditando ? "Actualizar Carga" : "Nueva Asignación de Carga"}
        className="max-w-2xl"
        overflowVisible={true}
      >
        <div className="space-y-8 min-h-[400px]">
          {/* Cabecera del Curso Institucional */}
          <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10 flex items-start gap-4">
            <div className="p-3 bg-[#003366]/10 dark:bg-[#D4AF37]/10 rounded-xl text-[#003366] dark:text-[#D4AF37]">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                {ofertaSeleccionada?.curso?.nombre}
              </h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2 mt-1">
                <span className="font-bold text-gray-700 dark:text-gray-300">{ofertaSeleccionada?.curso?.codigo}</span>
                <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  componenteSeleccionado?.tipo === 'TEORIA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                }`}>
                  {componenteSeleccionado?.tipo === 'TEORIA' ? 'Teoría-Práctica' : 'Laboratorio'}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-8">
              <SelectorFiltrable
                label="Docente"
                value={idDocente}
                onChange={(valor) => setIdDocente(Number(valor))}
                opciones={docentes.map((d: any) => ({
                  value: d.id,
                  label: `${d.apellidos}, ${d.nombres}`
                }))}
                placeholder="Buscar docente..."
              />
            </div>
            <div className="md:col-span-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Horas a Asignar</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input 
                    type="number" 
                    className="block w-full rounded-2xl border px-4 pl-12 py-4 shadow-sm transition-all duration-200 outline-none bg-slate-50/50 hover:bg-white border-gray-200 text-gray-900 focus:border-[#003366] focus:ring-4 focus:ring-[#003366]/5 dark:bg-white/5 dark:hover:bg-[#020C1B] dark:border-white/10 dark:text-white dark:focus:border-[#D4AF37] dark:focus:ring-[#D4AF37]/10"
                    value={horasAsignadas} 
                    onChange={(e) => setHorasAsignadas(Number(e.target.value))} 
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de carga docente (opcional) */}
          {idDocente > 0 && (
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <p className="text-sm text-amber-700 font-medium">
                Verifica que el docente tenga disponibilidad horaria antes de confirmar.
              </p>
            </div>
          )}

          <div className="pt-2">
            <Boton 
              onClick={manejarAsignar} 
              disabled={mutationAsignar.isPending} 
              className="w-full py-4 text-lg font-bold rounded-2xl shadow-lg shadow-[#003366]/20 dark:shadow-[#D4AF37]/10 bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F]"
            >
              {mutationAsignar.isPending ? 'Procesando...' : (asignacionEditando ? 'Actualizar Carga Horaria' : 'Confirmar Asignación')}
            </Boton>
          </div>
        </div>
      </Modal>

      {toast && <NotificacionToast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
}
