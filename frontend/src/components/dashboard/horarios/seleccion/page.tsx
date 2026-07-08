'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { useDisponibilidad } from '@/hooks/useDisponibilidad';
import { useSeleccionHorario } from '@/hooks/useSeleccionHorario';
import { useValidacionTiempoReal } from '@/hooks/useValidacionTiempoReal';
import { useWebSocket } from '@/hooks/useWebSocket';
import { periodosService } from '@/services/periodos.service';
import { ambientesService } from '@/services/ambientes.service';
import { configuracionService } from '@/services/configuracion.service';
import { horariosService } from '@/services/horarios.service';
import { MatrizDisponibilidad } from '@/components/horarios/MatrizDisponibilidad';
import { PanelSeleccionCurso } from '@/components/horarios/PanelSeleccionCurso';
import { IndicadorProgresoHoras } from '@/components/horarios/IndicadorProgresoHoras';
import { PanelValidaciones } from '@/components/horarios/PanelValidaciones';

import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { useQueryClient } from '@tanstack/react-query';
import { gruposService } from '@/services/grupos.service';
import { ConfirmacionHorario } from '@/components/horarios/ConfirmacionHorario';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { ventanasService } from '@/services/ventanas.service';

export default function SeleccionHorarioPage() {
  const { usuario } = useAuthStore();
  const queryClient = useQueryClient();
  const docenteId = usuario?.idDocente || 0;

  const [ambienteId, setAmbienteId] = useState<number | null>(null);
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<number | null>(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null);
  const [sesionId] = useState(crypto.randomUUID());
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);
  const [initialPreselectDone, setInitialPreselectDone] = useState(false);

  // Persistence across navigation transitions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAmbiente = localStorage.getItem('seleccion_ambienteId');
      const savedComp = localStorage.getItem('seleccion_componenteSeleccionado');
      const savedGrupo = localStorage.getItem('seleccion_grupoSeleccionado');
      if (savedAmbiente) setAmbienteId(parseInt(savedAmbiente));
      if (savedComp) setComponenteSeleccionado(parseInt(savedComp));
      if (savedGrupo) setGrupoSeleccionado(parseInt(savedGrupo));
    }
  }, []);

  useEffect(() => {
    if (ambienteId !== null) {
      localStorage.setItem('seleccion_ambienteId', ambienteId.toString());
    } else {
      localStorage.removeItem('seleccion_ambienteId');
    }
  }, [ambienteId]);

  useEffect(() => {
    if (componenteSeleccionado !== null) {
      localStorage.setItem('seleccion_componenteSeleccionado', componenteSeleccionado.toString());
    } else {
      localStorage.removeItem('seleccion_componenteSeleccionado');
    }
  }, [componenteSeleccionado]);

  useEffect(() => {
    if (grupoSeleccionado !== null) {
      localStorage.setItem('seleccion_grupoSeleccionado', grupoSeleccionado.toString());
    } else {
      localStorage.removeItem('seleccion_grupoSeleccionado');
    }
  }, [grupoSeleccionado]);

  const { data: periodoActivo } = useQuery({
    queryKey: ['periodo-activo'],
    queryFn: () => periodosService.activo().then((res) => res.data),
  });
  const idPeriodo = periodoActivo?.id || 0;

  const { data: ambientes } = useQuery({
    queryKey: ['ambientes'],
    queryFn: () => ambientesService.listar().then((res) => res.data),
  });

  const { data: restricciones } = useQuery({
    queryKey: ['restricciones'],
    queryFn: () => configuracionService.obtenerRestricciones().then((res) => res.data.data || res.data),
  });

  const { data: progreso } = useQuery({
    queryKey: ['progreso', docenteId],
    queryFn: () => horariosService.obtenerProgreso(docenteId).then((res) => res.data),
    enabled: !!docenteId,
  });

  // Pre-seleccionar inteligentemente el primer componente que tenga horas pendientes o el primero
  useEffect(() => {
    if (progreso && progreso.length > 0 && componenteSeleccionado === null) {
      const savedComp = localStorage.getItem('seleccion_componenteSeleccionado');
      if (savedComp) {
        const idComp = parseInt(savedComp);
        if (progreso.some((p: any) => p.idComponente === idComp)) {
          setComponenteSeleccionado(idComp);
          return;
        }
      }
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

  // Pre-selección inicial del primer ambiente disponible si no hay guardado en localStorage
  useEffect(() => {
    if (!initialPreselectDone && ambientesFiltrados && ambientesFiltrados.length > 0) {
      setInitialPreselectDone(true);
      const saved = localStorage.getItem('seleccion_ambienteId');
      if (!saved) {
        setAmbienteId(ambientesFiltrados[0].id);
      }
    }
  }, [ambientesFiltrados, initialPreselectDone]);

  // Si el ambiente seleccionado no es compatible con el componente elegido, auto-seleccionar uno compatible
  useEffect(() => {
    if (ambienteId && ambientesFiltrados && ambientesFiltrados.length > 0) {
      const existe = ambientesFiltrados.some((a: any) => a.id === ambienteId);
      if (!existe) {
        setAmbienteId(ambientesFiltrados[0].id);
      }
    }
  }, [ambientesFiltrados, ambienteId]);

  const { data: matriz, actualizarMatriz } = useDisponibilidad(ambienteId, idPeriodo, docenteId, componenteSeleccionado);

  const { selecciones, seleccionarCelda, deseleccionarCelda } = useSeleccionHorario(docenteId);

  const { data: validacion } = useValidacionTiempoReal(docenteId, idPeriodo);

  const { data: gruposDisponibles, isLoading: gruposLoading } = useQuery({
    queryKey: ['grupos-por-componente', componenteSeleccionado],
    queryFn: () => gruposService.listarPorComponente(componenteSeleccionado as number).then((res) => res.data),
    enabled: !!componenteSeleccionado,
  });

  // --- Ventana de atención (Variante B: control por tiempo) ---
  const { data: turnoData } = useQuery({
    queryKey: ['mi-turno', docenteId, idPeriodo],
    queryFn: () => ventanasService.miTurno(idPeriodo).then((res) => res.data),
    enabled: !!docenteId && !!idPeriodo,
    refetchInterval: 60_000, // re-check every minute
  });

  const esBloqueado = useMemo(() => {
    if (!turnoData) return false;
    if (turnoData.acceso) return false;
    return true;
  }, [turnoData]);

  useEffect(() => {
    if (!componenteSeleccionado) {
      setGrupoSeleccionado(null);
      return;
    }
    if (gruposDisponibles && gruposDisponibles.length > 0) {
      const savedGrupo = localStorage.getItem('seleccion_grupoSeleccionado');
      if (savedGrupo) {
        const idGrupo = parseInt(savedGrupo);
        if (gruposDisponibles.some((g: any) => g.id === idGrupo)) {
          setGrupoSeleccionado(idGrupo);
          return;
        }
      }
      const primerGrupo = gruposDisponibles[0];
      setGrupoSeleccionado(primerGrupo?.id ?? null);
    }
  }, [componenteSeleccionado, gruposDisponibles]);

  // WebSocket para actualizar matriz en tiempo real
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
      setMensaje({ texto: 'No se pudo identificar el docente autenticado.', tipo: 'error' });
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
        setMensaje({ texto: 'Selecciona primero un grupo para el componente.', tipo: 'error' });
        return;
      }

      if (!ambienteId) {
        setMensaje({ texto: 'Selecciona un ambiente antes de elegir una celda.', tipo: 'error' });
        return;
      }

      // Validar si ya se alcanzaron o excedieron las horas requeridas
      const registroProgreso = (progreso || []).find((p: any) => p.idComponente === componenteSeleccionado);
      if (registroProgreso && registroProgreso.horasAsignadas >= registroProgreso.horasRequeridas) {
        setMensaje({
          texto: `No puedes seleccionar más horas para ${registroProgreso.nombreCurso} (${registroProgreso.tipoComponente}). Límite alcanzado: ${registroProgreso.horasRequeridas}h.`,
          tipo: 'error',
        });
        return;
      }

      const horaFin = `${(parseInt(hora) + 1).toString().padStart(2, '0')}:00`;
      try {
        // Optimistic UI update: Invalidate query before call to feel faster
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
          idPeriodo: idPeriodo || undefined,
          diaSemana: dia,
          horaInicio: hora,
          horaFin,
          sesionId,
        });
        
        actualizarMatriz();
        queryClient.invalidateQueries({ queryKey: ['validacion-seleccion', docenteId, idPeriodo] });
        queryClient.invalidateQueries({ queryKey: ['progreso', docenteId] });
        queryClient.invalidateQueries({ queryKey: ['selecciones-temporales', docenteId] });
        setMensaje({ texto: 'Celda seleccionada correctamente.', tipo: 'success' });
      } catch (err: any) {
        // Rollback optimistic update on error
        actualizarMatriz();
        setMensaje({ texto: err.response?.data?.error || 'Error al seleccionar la celda.', tipo: 'error' });
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
          diaSemana: dia,
          horaInicio: hora,
          sesionId: info?.sesionId || sesionId,
        });
        
        actualizarMatriz();
        queryClient.invalidateQueries({ queryKey: ['validacion-seleccion', docenteId, idPeriodo] });
        queryClient.invalidateQueries({ queryKey: ['progreso', docenteId] });
        queryClient.invalidateQueries({ queryKey: ['selecciones-temporales', docenteId] });
        setMensaje({ texto: 'Celda liberada correctamente.', tipo: 'success' });
      } catch (err: any) {
        // Rollback optimistic update on error
        actualizarMatriz();
        setMensaje({ texto: err.response?.data?.error || 'No se pudo liberar la celda.', tipo: 'error' });
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-2 animate-fadeIn">
      {/* Header section with premium look */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 dark:border-white/10 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#003366] dark:bg-[#D4AF37] text-white dark:text-[#020C1B] shadow-lg shadow-[#003366]/20 dark:shadow-[#D4AF37]/20">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            Elegir mi Horario
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-3 ml-2">
            Gestiona la asignación de tus cursos en los ambientes disponibles para el período académico activo.
          </p>
        </div>
        {periodoActivo && (
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Periodo Activo: <span className="text-[#003366] dark:text-[#D4AF37]">{periodoActivo.nombre}</span>
          </div>
        )}
      </div>

      {/* Turn status banner */}
      {!!docenteId && !!idPeriodo && turnoData && (
        <div
          className={[
            'rounded-3xl border px-6 py-5 flex flex-col md:flex-row md:items-center gap-5 shadow-sm transition-all duration-300',
            turnoData.acceso === true
              ? turnoData.razon === 'SIN_RESTRICCION' || turnoData.razon === 'NO_ES_DOCENTE'
                ? 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-white/5 dark:border-white/10 dark:text-slate-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/10 dark:border-emerald-500/20 dark:text-emerald-300'
              : turnoData.razon === 'AUN_NO_ES_SU_TURNO'
              ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/10 dark:border-amber-500/20 dark:text-amber-300'
              : 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-900/10 dark:border-rose-500/20 dark:text-rose-300',
          ].join(' ')}
        >
          <span className={[
            'flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm',
            turnoData.acceso
              ? turnoData.razon === 'SIN_RESTRICCION' ? 'bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
              : turnoData.razon === 'AUN_NO_ES_SU_TURNO' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
          ].join(' ')}>
            {turnoData.acceso
              ? turnoData.razon === 'SIN_RESTRICCION' ? <CheckCircle2 className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />
              : turnoData.razon === 'AUN_NO_ES_SU_TURNO' ? <Clock className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-black text-base tracking-tight">
              {turnoData.acceso
                ? turnoData.razon === 'SIN_RESTRICCION'
                  ? 'Sin restricción de turno activa'
                  : '¡Es tu ventana de atención!'
                : turnoData.razon === 'AUN_NO_ES_SU_TURNO'
                ? 'Tu turno aún no ha comenzado'
                : turnoData.razon === 'TURNO_VENCIDO'
                ? 'Tu ventana de atención venció'
                : turnoData.razon === 'SIN_CONFIGURACION'
                ? 'Selección no habilitada'
                : 'No tienes ventana de atención asignada'}
            </p>
            <p className="text-sm font-medium mt-1 opacity-80 leading-relaxed">
              {turnoData.acceso
                ? turnoData.razon === 'EN_TURNO'
                  ? `Acceso activo hasta las ${turnoData.turnoAsignado?.horaFin}`
                  : 'Las ventanas de tiempo no están configuradas para este periodo'
                : turnoData.razon === 'SIN_CONFIGURACION'
                ? 'No hay ventanas configuradas para este periodo académico.'
                : turnoData.turnoAsignado
                ? `Tu ventana: ${turnoData.turnoAsignado.fecha} de ${turnoData.turnoAsignado.horaInicio} a ${turnoData.turnoAsignado.horaFin}`
                : 'Consulta con la secretaría para conocer tu turno'}
            </p>
          </div>
          {esBloqueado && (
            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Acción Bloqueada
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Grid Layout - Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Console (Command Center) - Always Dark */}
        <div className="lg:col-span-4 lg:col-start-1">
          <div className="dark bg-[#020C1B] rounded-[2.5rem] border border-white/10 shadow-2xl p-8 relative overflow-hidden flex flex-col gap-8 h-full">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            
            {/* Panel Header */}
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
                <span className="w-1.5 h-6 rounded-full bg-[#D4AF37]"></span>
                Panel de Control
              </h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 ml-4">
                Configuración de Asignación
              </p>
            </div>

            {/* Panel de Cursos */}
            <div className="relative z-10 space-y-4">
              <h3 className="text-sm font-bold text-gray-400">1. Seleccionar Carga Pendiente</h3>
              <PanelSeleccionCurso
                componentes={progreso || []}
                componenteSeleccionado={componenteSeleccionado}
                alCambiarComponente={(id) => setComponenteSeleccionado(id || null)}
              />
            </div>

            {/* Selectores */}
            <div className="relative z-10 space-y-6 pt-6 border-t border-white/10">
              <h3 className="text-sm font-bold text-gray-400">2. Ubicación y Grupo</h3>
              <SelectorInstitucional
                label="Ambiente (Aula/Lab)"
                opciones={[
                  { value: '', label: 'Seleccionar ambiente...' },
                  ...ambientesFiltrados.map((a: any) => ({
                    value: String(a.id),
                    label: `${a.codigo} (${a.tipo === 'AULA' ? 'Aula' : 'Lab'}, Cap: ${a.capacidad})`,
                  })),
                ]}
                value={ambienteId?.toString() || ''}
                onChange={(val) => setAmbienteId(val ? parseInt(val.toString()) : null)}
              />

              {componenteSeleccionado && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <SelectorInstitucional
                    label="Grupo Académico"
                    opciones={[
                      { value: '', label: 'Seleccionar grupo...' },
                      ...((gruposDisponibles || []).map((g: any) => ({
                        value: String(g.id),
                        label: `Grupo ${g.codigo} (Cap: ${g.capacidad_maxima})`,
                      })) || []),
                    ]}
                    value={grupoSeleccionado?.toString() || ''}
                    onChange={(val) => setGrupoSeleccionado(val ? parseInt(val.toString()) : null)}
                  />
                </div>
              )}
            </div>

            {/* Avance de horas */}
            <div className="relative z-10 pt-6 border-t border-white/10">
              <h3 className="text-sm font-bold text-gray-400 mb-4">Progreso de Asignación</h3>
              <IndicadorProgresoHoras progreso={progreso || []} />
            </div>

            {/* Validaciones */}
            <div className="relative z-10 pt-6 border-t border-white/10">
              <h3 className="text-sm font-bold text-gray-400 mb-4">Validaciones del Sistema</h3>
              <PanelValidaciones validacion={validacion || null} />
            </div>
          </div>
        </div>

        {/* Right column: Availability Matrix (Canvas) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card: Course selection & groups */}

          {/* Matrix Card */}
          <div className="bg-white dark:bg-[#020C1B] rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-xl p-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-6 mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                  <span className="w-1.5 h-6 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                  Horarios en Ambiente
                </h2>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1 ml-4">Disponibilidad de Aulas en Tiempo Real</p>
              </div>
              {ambienteId && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Verificando Disponibilidad
                </span>
              )}
            </div>
            <MatrizDisponibilidad
              matriz={matriz || null}
              alHacerClickCelda={manejarClickCelda}
              bloqueado={esBloqueado}
              bloqueoAlmuerzo={
                (restricciones?.franjaInicio ? restricciones : restricciones?.data)?.bloqueoAlmuerzoInicio && (restricciones?.franjaInicio ? restricciones : restricciones?.data)?.bloqueoAlmuerzoFin
                  ? { 
                      inicio: (restricciones?.franjaInicio ? restricciones : restricciones?.data).bloqueoAlmuerzoInicio, 
                      fin: (restricciones?.franjaInicio ? restricciones : restricciones?.data).bloqueoAlmuerzoFin 
                    }
                  : null
              }
            />
          </div>

          {/* Confirmation Box */}
          {!!docenteId && !!idPeriodo && (
            <div className="bg-white dark:bg-[#020C1B] rounded-[2.5rem] border border-gray-100 dark:border-white/10 p-8 flex flex-col items-center justify-between gap-6 md:flex-row shadow-xl">
              <div className="text-center md:text-left">
                <h3 className="font-black text-gray-900 dark:text-white text-lg tracking-tight">¿Listo con tus selecciones?</h3>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 max-w-md leading-relaxed">
                  Confirma tus selecciones temporales. Al confirmar, tus bloques se guardarán en la base de datos como Borrador Oficial.
                </p>
              </div>
              <ConfirmacionHorario
                docenteId={docenteId}
                idPeriodo={idPeriodo}
                deshabilitado={esBloqueado || (validacion ? !validacion.valido : false)}
                alConfirmar={() => {
                  queryClient.invalidateQueries({ queryKey: ['selecciones-temporales', docenteId] });
                  queryClient.invalidateQueries({ queryKey: ['validacion-seleccion', docenteId, idPeriodo] });
                  queryClient.invalidateQueries({ queryKey: ['horarios-general', idPeriodo] });
                  queryClient.invalidateQueries({ queryKey: ['progreso', docenteId] });
                  actualizarMatriz();
                  setMensaje({ texto: '¡Horario confirmado correctamente en la base de datos!', tipo: 'success' });
                }}
              />
            </div>
          )}
        </div>

      </div>

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
