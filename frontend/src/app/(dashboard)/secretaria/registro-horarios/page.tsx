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
      {/* Header Institucional UNT */}
      <div className="relative overflow-hidden rounded-[3rem] bg-[#0A192F] px-10 py-12 text-white shadow-2xl border border-[#112240] z-20">
        <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute left-1/4 bottom-0 h-48 w-48 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full text-[10px] font-black uppercase tracking-widest text-[#D4AF37] shadow-sm">
              <CalendarClock className="w-3.5 h-3.5" />
              Asistencia Administrativa
            </div>
            <h1 className="text-4xl font-serif font-bold tracking-tight text-white drop-shadow-sm">
              Registro Manual de <span className="text-[#D4AF37]">Horarios</span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl font-medium leading-relaxed">
              Asigna de manera excepcional la carga lectiva para docentes que requieren apoyo administrativo o técnico directo.
            </p>
          </div>
          
          <div className="w-full lg:w-96 bg-[#020C1B]/50 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl dark">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 ml-1">Periodo Académico Activo</p>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="p-3 bg-[#D4AF37]/20 rounded-xl border border-[#D4AF37]/30">
                <Calendar className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-sm font-black text-white">{periodoActivo?.nombre || 'No identificado'}</p>
                <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-0.5">Escuela de Ing. de Sistemas</p>
              </div>
            </div>
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

        {/* CONSOLA DE CONFIGURACIÓN Y AUDITORÍA */}
        {docenteId && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* PANEL IZQUIERDO: CONFIGURACIÓN DE CARGA (7/12) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#0A192F] rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-[#112240] p-8 space-y-8 flex flex-col">
              <div className="flex items-center gap-4 border-b border-gray-100 dark:border-[#112240] pb-5">
                <div className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                  <BookOpen className="w-5 h-5 text-[#003366] dark:text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">Configuración de Carga</h3>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Asignación de componentes y espacios</p>
                </div>
              </div>
              
              <div className="flex-1 space-y-8">
                {/* Lista de Cursos */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">1. Seleccione la carga pendiente</p>
                  <div className="bg-gray-50/50 dark:bg-[#020C1B] rounded-2xl border border-gray-100 dark:border-[#112240] p-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                    <PanelSeleccionCurso
                      componentes={progreso || []}
                      componenteSeleccionado={componenteSeleccionado}
                      alCambiarComponente={(id) => setComponenteSeleccionado(id || null)}
                    />
                  </div>
                </div>
                
                {/* Entorno Físico y Grupo */}
                <div className="bg-[#003366]/5 dark:bg-[#020C1B]/50 rounded-2xl p-6 border border-[#003366]/10 dark:border-white/5 relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#003366] dark:bg-[#D4AF37] rounded-l-2xl" />
                  <p className="text-[10px] font-black text-[#003366]/70 dark:text-white/50 uppercase tracking-widest mb-5 ml-1">2. Configure el entorno físico</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Grupo Académico</p>
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
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Infraestructura Fija</p>
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
            
            {/* PANEL DERECHO: AUDITORÍA (5/12) */}
            <div className="lg:col-span-5 bg-[#0A192F] rounded-[2.5rem] shadow-2xl p-8 text-white relative overflow-hidden border border-[#112240] flex flex-col">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center gap-4 border-b border-white/10 pb-5 mb-6 relative z-10">
                <div className="p-2.5 bg-[#D4AF37]/20 rounded-xl border border-[#D4AF37]/30 shadow-inner">
                  <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Auditoría en Tiempo Real</h3>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-0.5">Control institucional estricto</p>
                </div>
              </div>
              
              <div className="space-y-6 flex-1 relative z-10 flex flex-col">
                {/* Reglas Vigentes (Panel Validaciones) */}
                <div className="flex-1 bg-[#020C1B]/60 rounded-2xl border border-white/10 p-5 flex flex-col">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center justify-between">
                    <span>Reglas y Conflictos</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Monitoreo Activo" />
                  </p>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[120px]">
                    <PanelValidaciones validacion={validacion || null} />
                  </div>
                </div>
                
                {/* Progreso de Horas */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-4">Progreso Consolidado</p>
                  <div className="max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                    <IndicadorProgresoHoras progreso={progreso || []} />
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        )}

        {/* FILA INFERIOR: MATRIZ Y VISTA PREVIA */}
        <div className="space-y-8">
          
          {/* Matriz de Disponibilidad (Ahora a todo lo ancho) */}
          <div className="bg-white dark:bg-[#0A192F] rounded-[3rem] shadow-xl border border-gray-100 dark:border-[#112240] p-10 space-y-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#112240] pb-8">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-[#003366]/5 dark:bg-[#003366]/30 rounded-3xl text-[#003366] dark:text-[#D4AF37] border border-[#003366]/10 dark:border-[#003366]/50 shadow-sm">
                  <LayoutDashboard className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Ocupación de Infraestructura</h2>
                  <p className="text-sm text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">
                    {ambienteId ? (
                      <span className="flex items-center gap-2">
                        Analizando el espacio: <span className="text-[#003366] dark:text-[#D4AF37] font-black">{matriz?.ambienteCodigo || 'Cargando...'}</span>
                      </span>
                    ) : 'Seleccione una configuración física para proceder'}
                  </p>
                </div>
              </div>
              {ambienteId && (
                <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-800/30 text-xs font-black uppercase tracking-widest shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sincronización Activa
                </div>
              )}
            </div>

            <div className="min-h-[600px] overflow-x-auto custom-scrollbar pt-4">
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

          {/* Horario del Docente y Confirmación Final */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 bg-white dark:bg-[#0A192F] rounded-[3rem] shadow-xl border border-gray-100 dark:border-[#112240] p-10 space-y-8">
              <div className="flex items-center gap-6 border-b border-gray-100 dark:border-[#112240] pb-8">
                <div className="p-4 bg-[#003366]/5 dark:bg-[#003366]/30 rounded-3xl text-[#003366] dark:text-[#D4AF37] border border-[#003366]/10 dark:border-[#003366]/50 shadow-sm">
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Carga Horaria Actual</h2>
                  <p className="text-sm text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">Vista Previa Consolidada</p>
                </div>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <VistaHorarioDocente selecciones={selecciones} alQuitarCelda={quitarCeldaVistaPrevia} />
              </div>
            </div>

            <div className="bg-[#0A192F] rounded-[3rem] shadow-2xl p-10 text-white flex flex-col justify-between relative overflow-hidden group border border-[#112240]">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <div className="p-4 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-2xl w-fit">
                  <ShieldCheck className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <h3 className="text-3xl font-black tracking-tight leading-tight">Confirmar Padrón</h3>
                <p className="text-white/60 text-sm leading-relaxed font-medium">
                  Certifique que el registro cumpla con el Reglamento Académico. La confirmación establecerá estos bloques como definitivos en el sistema.
                </p>
              </div>

              <div className="pt-8 relative z-10">
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
