'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDisponibilidad } from '@/hooks/useDisponibilidad';
import { useSeleccionHorario } from '@/hooks/useSeleccionHorario';
import { useValidacionTiempoReal } from '@/hooks/useValidacionTiempoReal';
import { useWebSocket } from '@/hooks/useWebSocket';
import { periodosService } from '@/services/periodos.service';
import { ambientesService } from '@/services/ambientes.service';
import { docentesService } from '@/services/docentes.service';
import { configuracionService } from '@/services/configuracion.service';
import { horariosService } from '@/services/horarios.service';
import { gruposService } from '@/services/grupos.service';
import { MatrizDisponibilidad } from '@/components/horarios/MatrizDisponibilidad';
import { PanelSeleccionCurso } from '@/components/horarios/PanelSeleccionCurso';
import { IndicadorProgresoHoras } from '@/components/horarios/IndicadorProgresoHoras';
import { PanelValidaciones } from '@/components/horarios/PanelValidaciones';
import { VistaHorarioDocente } from '@/components/horarios/VistaHorarioDocente';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { ConfirmacionHorario } from '@/components/horarios/ConfirmacionHorario';
import { 
  CheckSquare, 
  User, 
  School, 
  BookOpen, 
  Users, 
  Clock, 
  ShieldCheck, 
  Calendar,
  LayoutDashboard,
  Search,
  ArrowRight,
  Activity,
  CalendarClock
} from 'lucide-react';
import { SelectorFiltrable } from '@/components/ui/SelectorFiltrable';
import { NotificacionToast } from '@/components/ui/NotificacionToast';

export default function RegistroManualHorariosPage() {
  const queryClient = useQueryClient();
  const [docenteId, setDocenteId] = useState<number | null>(null);
  const [ambienteId, setAmbienteId] = useState<number | null>(null);
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<number | null>(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null);
  const [sesionId] = useState(crypto.randomUUID());
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);

  const { data: periodoActivo, isLoading: periodoLoading } = useQuery({
    queryKey: ['periodo-activo-secretaria'],
    queryFn: () => periodosService.activo().then((res) => res.data),
  });
  const idPeriodo = periodoActivo?.id || 0;

  const { data: docentes, isLoading: docentesLoading } = useQuery({
    queryKey: ['docentes-secretaria'],
    queryFn: () => docentesService.listar().then((res) => res.data),
  });

  const { data: ambientes } = useQuery({
    queryKey: ['ambientes-secretaria'],
    queryFn: () => ambientesService.listar().then((res) => res.data),
  });

  const { data: restricciones } = useQuery({
    queryKey: ['restricciones'],
    queryFn: () => configuracionService.obtenerRestricciones().then((res) => res.data),
  });

  const { data: progreso } = useQuery({
    queryKey: ['progreso-secretaria', docenteId],
    queryFn: () => horariosService.obtenerProgreso(docenteId as number).then((res) => res.data),
    enabled: !!docenteId,
  });

  // Pre-seleccionar componente si hay progreso
  useEffect(() => {
    if (progreso && progreso.length > 0 && componenteSeleccionado === null) {
      const pendiente = progreso.find((p: any) => p.horasAsignadas < p.horasRequeridas) || progreso[0];
      if (pendiente) {
        setComponenteSeleccionado(pendiente.idComponente);
      }
    }
  }, [progreso, componenteSeleccionado]);

  const tipoComponenteSeleccionado = useMemo(() => {
    const registro = (progreso || []).find((p: any) => p.idComponente === componenteSeleccionado);
    return (registro?.tipoComponente || '').toUpperCase();
  }, [progreso, componenteSeleccionado]);

  const ambientesFiltrados = useMemo(() => {
    const lista = (ambientes || []).filter((a: any) => a.activo);
    if (!tipoComponenteSeleccionado) return lista;
    if (tipoComponenteSeleccionado === 'LABORATORIO') return lista.filter((a: any) => a.tipo === 'LABORATORIO');
    if (tipoComponenteSeleccionado === 'PRACTICA') return lista.filter((a: any) => a.tipo === 'AULA' || a.tipo === 'LABORATORIO');
    return lista.filter((a: any) => a.tipo === 'AULA');
  }, [ambientes, tipoComponenteSeleccionado]);

  // Si el ambiente seleccionado no es compatible, resetearlo o elegir uno compatible
  useEffect(() => {
    if (ambienteId && ambientesFiltrados.length > 0) {
      const existe = ambientesFiltrados.some((a: any) => a.id === ambienteId);
      if (!existe) {
        setAmbienteId(ambientesFiltrados[0].id);
      }
    } else if (!ambienteId && ambientesFiltrados.length > 0 && docenteId) {
      setAmbienteId(ambientesFiltrados[0].id);
    }
  }, [ambientesFiltrados, ambienteId, docenteId]);

  const { data: matriz, actualizarMatriz } = useDisponibilidad(ambienteId, idPeriodo, docenteId, componenteSeleccionado);

  const { selecciones, seleccionarCelda, deseleccionarCelda } = useSeleccionHorario(docenteId || 0);

  const { data: validacion } = useValidacionTiempoReal(docenteId || 0, idPeriodo);

  const { data: gruposDisponibles, isLoading: gruposLoading } = useQuery({
    queryKey: ['grupos-por-componente-secretaria', componenteSeleccionado],
    queryFn: () => gruposService.listarPorComponente(componenteSeleccionado as number).then((res) => res.data),
    enabled: !!componenteSeleccionado,
  });

  useEffect(() => {
    if (!componenteSeleccionado) {
      setGrupoSeleccionado(null);
      return;
    }
    if (gruposDisponibles && gruposDisponibles.length > 0) {
      const primerGrupo = gruposDisponibles[0];
      setGrupoSeleccionado(primerGrupo?.id ?? null);
    }
  }, [componenteSeleccionado, gruposDisponibles]);

  const manejarMensajeWS = useCallback((data: any) => {
    if (data.tipo === 'celda_seleccionada' || data.tipo === 'celda_deseleccionada') {
      actualizarMatriz();
      queryClient.invalidateQueries({ queryKey: ['selecciones-temporales', docenteId] });
      queryClient.invalidateQueries({ queryKey: ['validacion-seleccion', docenteId, idPeriodo] });
    }
  }, [actualizarMatriz, queryClient, docenteId, idPeriodo]);
  useWebSocket(manejarMensajeWS);

  const manejarClickCelda = async (dia: string, hora: string, estado: string, info?: any) => {
    if (!docenteId) {
      setMensaje({ texto: 'Por favor, seleccione un docente primero.', tipo: 'error' });
      return;
    }

    if (estado === 'BLOQUEO_INSTITUCIONAL') {
      setMensaje({ texto: 'Ese horario está bloqueado por la franja de almuerzo configurada.', tipo: 'error' });
      return;
    }

    if (estado === 'LIBRE') {
      if (!componenteSeleccionado) {
        setMensaje({ texto: 'Selecciona primero un componente del curso.', tipo: 'error' });
        return;
      }
      if (!grupoSeleccionado) {
        setMensaje({ texto: 'Selecciona primero un grupo.', tipo: 'error' });
        return;
      }
      if (!ambienteId) {
        setMensaje({ texto: 'Selecciona un ambiente.', tipo: 'error' });
        return;
      }

      // Validar si ya se alcanzaron las horas requeridas
      const registroProgreso = (progreso || []).find((p: any) => p.idComponente === componenteSeleccionado);
      if (registroProgreso && registroProgreso.horasAsignadas >= registroProgreso.horasRequeridas) {
        setMensaje({
          texto: `Límite de horas alcanzado para ${registroProgreso.nombreCurso}.`,
          tipo: 'error',
        });
        return;
      }

      const horaFin = `${(parseInt(hora) + 1).toString().padStart(2, '0')}:00`;
      try {
        // Optimistic UI update
        queryClient.setQueryData(['matriz-disponibilidad', ambienteId, idPeriodo, docenteId, componenteSeleccionado], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            filas: old.filas.map((f: any) => {
              if (f.horaInicio !== hora) return f;
              return {
                ...f,
                celdas: f.celdas.map((c: any) => {
                  if (c.diaSemana !== dia) return c;
                  return { ...c, estado: 'SELECCION_TEMPORAL', info: { curso: 'Procesando...', tipoComponente: '', grupo: '' } };
                })
              };
            })
          };
        });

        await seleccionarCelda({
          idDocente: docenteId,
          idComponente: componenteSeleccionado,
          idGrupo: grupoSeleccionado,
          idAmbiente: ambienteId,
          diaSemana: dia.toUpperCase(),
          horaInicio: hora,
          horaFin,
          sesionId,
        });
        
        actualizarMatriz();
        queryClient.invalidateQueries({ queryKey: ['validacion-seleccion', docenteId, idPeriodo] });
        queryClient.invalidateQueries({ queryKey: ['progreso-secretaria', docenteId] });
        queryClient.invalidateQueries({ queryKey: ['selecciones-temporales', docenteId] });
        setMensaje({ texto: 'Celda asignada temporalmente.', tipo: 'success' });
      } catch (err: any) {
        actualizarMatriz();
        setMensaje({ texto: err.response?.data?.error || 'Error al seleccionar', tipo: 'error' });
      }
    } else if (estado === 'SELECCION_TEMPORAL' || estado === 'DOCENTE_OTRO_AMBIENTE') {
      try {
        // Optimistic UI update for deselection
        queryClient.setQueryData(['matriz-disponibilidad', ambienteId, idPeriodo, docenteId, componenteSeleccionado], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            filas: old.filas.map((f: any) => {
              if (f.horaInicio !== hora) return f;
              return {
                ...f,
                celdas: f.celdas.map((c: any) => {
                  if (c.diaSemana !== dia) return c;
                  return { ...c, estado: 'LIBRE', info: undefined };
                })
              };
            })
          };
        });

        await deseleccionarCelda({
          idDocente: docenteId,
          idAmbiente: info?.idAmbiente || ambienteId || undefined,
          diaSemana: dia.toUpperCase(),
          horaInicio: hora,
          sesionId: info?.sesionId || sesionId,
        });
        
        actualizarMatriz();
        queryClient.invalidateQueries({ queryKey: ['validacion-seleccion', docenteId, idPeriodo] });
        queryClient.invalidateQueries({ queryKey: ['progreso-secretaria', docenteId] });
        queryClient.invalidateQueries({ queryKey: ['selecciones-temporales', docenteId] });
        setMensaje({ texto: 'Celda liberada.', tipo: 'success' });
      } catch (err: any) {
        actualizarMatriz();
        setMensaje({ texto: err.response?.data?.error || 'Error al liberar celda', tipo: 'error' });
      }
    }
  };

  const quitarCeldaVistaPrevia = async (seleccion: any) => {
    await deseleccionarCelda({
      idDocente: docenteId!,
      idAmbiente: seleccion.idAmbiente,
      diaSemana: seleccion.diaSemana,
      horaInicio: seleccion.horaInicio,
      sesionId: seleccion.sesionId,
    });
    actualizarMatriz();
    queryClient.invalidateQueries({ queryKey: ['validacion-seleccion', docenteId, idPeriodo] });
    queryClient.invalidateQueries({ queryKey: ['progreso', docenteId] });
    queryClient.invalidateQueries({ queryKey: ['selecciones-temporales', docenteId] });
  };

  if (periodoLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto pb-20 px-4">
      {/* Dossier Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#0A192F]/12 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A192F]/40 dark:text-white/40 mb-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Asistencia Administrativa</span>
          </div>
          <h1 className="font-serif text-[2rem] text-[#0A192F] dark:text-white tracking-tight leading-tight">Registro Manual de Horarios</h1>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#0A192F]/10 dark:border-white/10 bg-[#0A192F]/3 dark:bg-white/5 shrink-0">
          <Calendar className="w-4 h-4 text-[#D4AF37]" />
          <div>
            <p className="text-[10px] font-bold text-[#0A192F]/40 dark:text-white/40 uppercase tracking-widest">Periodo Activo</p>
            <p className="text-sm font-bold text-[#0A192F] dark:text-white">{periodoActivo?.nombre || 'No identificado'}</p>
          </div>
        </div>
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-700 space-y-10">
        
        {/* PANEL DE CONTEXTO PRINCIPAL: DOCENTE */}
        <div className="bg-white dark:bg-[#0A192F] rounded-3xl shadow-lg border border-gray-100 dark:border-[#112240] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all">
          <div className="flex-1 max-w-3xl">
            <div className="flex items-center gap-4 mb-5">
              <div className="p-3 bg-[#003366]/5 dark:bg-[#003366]/30 rounded-2xl text-[#003366] dark:text-[#D4AF37] border border-[#003366]/10 dark:border-[#003366]/50 shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">Docente a Programar</h2>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Identificación en Padrón</p>
              </div>
            </div>
            
            <SelectorFiltrable
              label=""
              value={docenteId || 0}
              onChange={(val) => {
                const id = Number(val);
                setDocenteId(id || null);
                setComponenteSeleccionado(null);
                setGrupoSeleccionado(null);
                setAmbienteId(null);
              }}
              opciones={(docentes || []).map((d: any) => ({
                valor: d.id,
                etiqueta: `${d.apellidos}, ${d.nombres}`
              }))}
              placeholder="Buscar docente por nombre o apellidos..."
            />
          </div>
          
          {docenteId ? (
            <div className="lg:w-72 p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-4 shrink-0 animate-in fade-in zoom-in-95 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-[#020C1B] shadow-sm flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/50">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-500 mb-0.5">Estado de Padrón</p>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400 leading-tight">Autorizado para carga académica</p>
              </div>
            </div>
          ) : (
            <div className="lg:w-72 p-5 bg-gray-50 dark:bg-[#020C1B] rounded-2xl border border-dashed border-gray-200 dark:border-[#112240] flex items-center justify-center gap-3 shrink-0 opacity-70">
              <Search className="w-5 h-5 text-gray-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Esperando selección</p>
            </div>
          )}
        </div>

        {/* TABLERO PRINCIPAL: HERRAMIENTAS Y MATRIZ */}
        {docenteId && (
          <div className="flex flex-col xl:flex-row gap-8 animate-in slide-in-from-bottom-4 duration-500 items-start">
            
            {/* COLUMNA IZQUIERDA: HERRAMIENTAS DE DND Y AUDITORÍA (Ancho Fijo) */}
            <div className="w-full xl:w-[360px] shrink-0 space-y-6 xl:sticky xl:top-6 z-20">
              
              {/* PANEL DE CONFIGURACIÓN DE CARGA */}
              <div className="bg-white dark:bg-[#0A192F] rounded-2xl shadow-xl border border-gray-100 dark:border-[#112240] p-6 space-y-6 flex flex-col">
                <div className="flex items-center gap-4 border-b border-gray-100 dark:border-[#112240] pb-4">
                  <div className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                    <BookOpen className="w-5 h-5 text-[#003366] dark:text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">Carga Asignable</h3>
                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Arrastre a la grilla</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Lista de Cursos (Drag Sources) */}
                  <div className="bg-gray-50/50 dark:bg-[#020C1B] rounded-2xl border border-gray-100 dark:border-[#112240] p-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
                    <PanelSeleccionCurso
                      componentes={progreso || []}
                      componenteSeleccionado={componenteSeleccionado}
                      alCambiarComponente={(id) => setComponenteSeleccionado(id || null)}
                    />
                  </div>
                  
                  {/* Entorno Físico y Grupo */}
                  <div className="bg-[#003366]/5 dark:bg-[#020C1B]/50 rounded-2xl p-5 border border-[#003366]/10 dark:border-white/5 relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#003366] dark:bg-[#D4AF37] rounded-l-2xl" />
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Grupo Académico</p>
                        <SelectorInstitucional
                          opciones={[
                            { value: '', label: 'Elegir grupo...' },
                            ...((gruposDisponibles || []).map((g: any) => ({
                              value: String(g.id),
                              label: `G${g.codigo} (Cap: ${g.capacidad_maxima})`,
                            })) || []),
                          ]}
                          value={grupoSeleccionado?.toString() || ''}
                          onChange={(val) => setGrupoSeleccionado(val ? parseInt(val as string, 10) : null)}
                          disabled={!componenteSeleccionado || gruposLoading}
                          className="w-full bg-white dark:bg-[#0A192F]"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Infraestructura Fija</p>
                        <SelectorInstitucional
                          opciones={[
                            { value: '', label: 'Elegir ambiente...' },
                            ...ambientesFiltrados.map((a: any) => ({
                              value: String(a.id),
                              label: `${a.codigo} (${a.tipo === 'AULA' ? 'Aula' : 'Lab'}, Cap: ${a.capacidad})`,
                            })),
                          ]}
                          value={ambienteId?.toString() || ''}
                          onChange={(val) => setAmbienteId(val ? parseInt(val as string, 10) : null)}
                          className="w-full bg-white dark:bg-[#0A192F]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PANEL DE AUDITORÍA Y PROGRESO */}
              <div className="bg-white dark:bg-[#0A192F] rounded-2xl shadow-xl dark:shadow-2xl p-6 text-gray-900 dark:text-white border border-gray-100 dark:border-[#112240] flex flex-col">
                <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/10 pb-4 mb-5">
                  <div className="p-2.5 bg-yellow-50 dark:bg-[#D4AF37]/20 rounded-xl border border-yellow-200 dark:border-[#D4AF37]/30 shadow-sm dark:shadow-inner">
                    <ShieldCheck className="w-5 h-5 text-yellow-600 dark:text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Auditoría</h3>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div className="bg-gray-50 dark:bg-[#020C1B]/60 rounded-2xl border border-gray-100 dark:border-white/10 p-4">
                    <p className="text-[9px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest mb-3 flex items-center justify-between">
                      <span>Reglas Activas</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </p>
                    <div className="max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                      <PanelValidaciones validacion={validacion || null} />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 p-4">
                    <p className="text-[9px] font-black text-gray-600 dark:text-[#D4AF37] uppercase tracking-widest mb-3">Progreso</p>
                    <div className="max-h-[140px] overflow-y-auto custom-scrollbar pr-2">
                      <IndicadorProgresoHoras progreso={progreso || []} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: MATRIZ DE DISPONIBILIDAD Y VISTA PREVIA (Flex-1) */}
            <div className="flex-1 min-w-0 space-y-8">
              
              {/* Matriz de Disponibilidad */}
              <div className="bg-white dark:bg-[#0A192F] rounded-2xl shadow-xl border border-gray-100 dark:border-[#112240] p-6 lg:p-8 relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 dark:border-[#112240] pb-6 mb-6">
                  <div className="flex items-center gap-5">
                    <div className="p-3 bg-[#003366]/5 dark:bg-[#003366]/30 rounded-2xl text-[#003366] dark:text-[#D4AF37] border border-[#003366]/10 dark:border-[#003366]/50 shadow-sm">
                      <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Ocupación de Infraestructura</h2>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">
                        {ambienteId ? (
                          <span className="flex items-center gap-2">
                            Espacio: <span className="text-[#003366] dark:text-[#D4AF37] font-black">{matriz?.ambienteCodigo || 'Cargando...'}</span>
                          </span>
                        ) : 'Seleccione una configuración física'}
                      </p>
                    </div>
                  </div>
                  {ambienteId && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800/30 text-[10px] font-black uppercase tracking-widest shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Sincronización Activa
                    </div>
                  )}
                </div>

                <div className="min-h-[500px] overflow-x-auto custom-scrollbar">
                  <MatrizDisponibilidad
                    matriz={matriz || null}
                    alHacerClickCelda={manejarClickCelda}
                    bloqueoAlmuerzo={
                      restricciones?.bloqueoAlmuerzoInicio && restricciones?.bloqueoAlmuerzoFin
                        ? { inicio: restricciones.bloqueoAlmuerzoInicio, fin: restricciones.bloqueoAlmuerzoFin }
                        : null
                    }
                  />
                </div>
              </div>

              {/* Fila de Vista Previa y Confirmación */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-white dark:bg-[#0A192F] rounded-2xl shadow-xl border border-gray-100 dark:border-[#112240] p-6 lg:p-8">
                  <div className="flex items-center gap-4 border-b border-gray-100 dark:border-[#112240] pb-6 mb-6">
                    <div className="p-3 bg-[#003366]/5 dark:bg-[#003366]/30 rounded-2xl text-[#003366] dark:text-[#D4AF37] border border-[#003366]/10 dark:border-[#003366]/50 shadow-sm">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">Carga Horaria Final</h2>
                    </div>
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
                    <VistaHorarioDocente selecciones={selecciones} alQuitarCelda={quitarCeldaVistaPrevia} />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0A192F] rounded-2xl shadow-xl p-6 lg:p-8 text-gray-900 dark:text-white flex flex-col justify-between border border-gray-100 dark:border-[#112240]">
                  <div className="space-y-4">
                    <div className="p-3 bg-yellow-50 dark:bg-[#D4AF37]/20 border border-yellow-100 dark:border-[#D4AF37]/30 rounded-xl w-fit">
                      <ShieldCheck className="w-6 h-6 text-yellow-600 dark:text-[#D4AF37]" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight leading-tight">Confirmar Padrón</h3>
                    <p className="text-gray-500 dark:text-white/60 text-xs leading-relaxed font-medium">
                      Certifique que el registro cumpla con el Reglamento Académico. La confirmación establecerá estos bloques.
                    </p>
                  </div>
                  <div className="pt-6">
                    <ConfirmacionHorario
                      docenteId={docenteId || 0}
                      idPeriodo={idPeriodo}
                      deshabilitado={!docenteId || (validacion ? !validacion.valido : false)}
                      alConfirmar={() => {
                        queryClient.invalidateQueries({ queryKey: ['selecciones-temporales', docenteId] });
                        queryClient.invalidateQueries({ queryKey: ['horarios-general', idPeriodo] });
                        queryClient.invalidateQueries({ queryKey: ['progreso-secretaria', docenteId] });
                        actualizarMatriz();
                        setMensaje({ texto: '¡Horario registrado con éxito!', tipo: 'success' });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>

      {mensaje && (
        <NotificacionToast 
          mensaje={mensaje.texto} 
          tipo={mensaje.tipo} 
          onClose={() => setMensaje(null)} 
        />
      )}
    </div>
  );
}
