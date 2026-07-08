'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { periodosService } from '@/services/periodos.service';
import { cargaNoLectivaService, type SeccionNoLectivaKey } from '@/services/carga-no-lectiva.service';
import { useAuthStore } from '@/stores/auth.store';
import { configuracionService } from '@/services/configuracion.service';
import { Boton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { cn } from '@/lib/utilidades';
import { ArrowLeft, CalendarDays, FileText, Save, Trash2, UserRound, Printer, AlertCircle, Plus, LayoutList, BookOpen } from 'lucide-react';
import { MatrizCargaNoLectiva } from '@/components/horarios/MatrizCargaNoLectiva';

type FormularioSeccion = {
  horas: string;
  codigo_resolucion: string;
  descripcion: string;
};

type FormularioDocente = {
  codigo_ibm: string;
  modalidad: string;
  categoria: string;
  dedicacion: string;
  telefono: string;
};

type ReglasCargaNoLectiva = {
  horas_objetivo: number;
  horas_lectivas: number;
  horas_no_lectivas_requeridas: number;
  limite_min_preparacion_evaluacion: number;
  limites_fijos_por_seccion: Record<string, number>;
};

const SECCIONES: Array<{ clave: SeccionNoLectivaKey; titulo: string; ayuda: string }> = [
  { clave: 'PREPARACION_EVALUACION', titulo: 'Preparación y Evaluación', ayuda: 'Horas para preparación de clases y evaluación de actividades.' },
  { clave: 'CONSEJERIA_TUTORIA', titulo: 'Consejería y Tutoría', ayuda: 'Horas dedicadas a consejería académica y tutoría.' },
  { clave: 'INVESTIGACION', titulo: 'Investigación', ayuda: 'Registro de horas asignadas a investigación.' },
  { clave: 'CAPACITACION', titulo: 'Capacitación', ayuda: 'Horas para cursos, talleres o actualización.' },
  { clave: 'ACTIVIDADES_GOBIERNO', titulo: 'Actividades de Gobierno', ayuda: 'Participación en órganos de gobierno y reuniones.' },
  { clave: 'ACTIVIDADES_ADMINISTRACION', titulo: 'Administración', ayuda: 'Labores administrativas y de coordinación.' },
  { clave: 'ASESORIA_TESIS', titulo: 'Asesoría de Tesis / Exp. Prof.', ayuda: 'Asesorías de tesis, proyectos o experiencia profesional.' },
  { clave: 'RESPONSABILIDAD_SOCIAL', titulo: 'Responsabilidad Social', ayuda: 'Actividades de proyección y responsabilidad social.' },
  { clave: 'COMITES_COMISIONES', titulo: 'Comités y Comisiones', ayuda: 'Participación en comités y comisiones institucionales.' },
];

const MODALIDADES = [
  { valor: 'NOMBRADO', etiqueta: 'Nombrado' },
  { valor: 'CONTRATADO', etiqueta: 'Contratado' },
];

const CATEGORIAS = [
  { valor: 'PRINCIPAL', etiqueta: 'Principal' },
  { valor: 'ASOCIADO', etiqueta: 'Asociado' },
  { valor: 'AUXILIAR', etiqueta: 'Auxiliar' },
  { valor: 'JEFE_PRACTICA', etiqueta: 'Jefe de Práctica' },
  { valor: 'PROFESOR', etiqueta: 'Profesor' },
  { valor: 'ALUMNO', etiqueta: 'Alumno' },
];

const DEDICACIONES = [
  { valor: 'TIEMPO_COMPLETO_40H', etiqueta: 'Tiempo Completo 40h' },
  { valor: 'DEDICACION_EXCLUSIVA_40H', etiqueta: 'Dedicación Exclusiva 40h' },
  { valor: 'TIEMPO_PARCIAL_20H', etiqueta: 'Tiempo Parcial 20h' },
  { valor: 'TIEMPO_PARCIAL_16H', etiqueta: 'Tiempo Parcial 16h' },
  { valor: 'TIEMPO_PARCIAL_12H', etiqueta: 'Tiempo Parcial 12h' },
  { valor: 'TIEMPO_PARCIAL_10H', etiqueta: 'Tiempo Parcial 10h' },
  { valor: 'TIEMPO_PARCIAL_8H', etiqueta: 'Tiempo Parcial 8h' },
];

const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

const crearSeccionesIniciales = () =>
  SECCIONES.reduce((acumulado, seccion) => {
    acumulado[seccion.clave] = {
      horas: '',
      codigo_resolucion: '',
      descripcion: '',
    };
    return acumulado;
  }, {} as Record<SeccionNoLectivaKey, FormularioSeccion>);

const crearDocenteInicial = (): FormularioDocente => ({
  codigo_ibm: '',
  modalidad: 'NOMBRADO',
  categoria: 'PRINCIPAL',
  dedicacion: 'TIEMPO_COMPLETO_40H',
  telefono: '',
});

const formatearHoras = (valor: number) => (Number.isInteger(valor) ? `${valor}` : valor.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));

export default function CargaNoLectivaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { usuario } = useAuthStore();
  const [idPeriodo, setIdPeriodo] = useState<number>(0);
  const [docente, setDocente] = useState<FormularioDocente>(crearDocenteInicial());
  const [secciones, setSecciones] = useState<Record<SeccionNoLectivaKey, FormularioSeccion>>(crearSeccionesIniciales());
  const [habilitaGobierno, setHabilitaGobierno] = useState(false);
  const [habilitaAdministracion, setHabilitaAdministracion] = useState(false);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);

  const [pestanaActiva, setPestanaActiva] = useState<'declaracion' | 'calendario' | 'formatos'>('declaracion');

  const [seccionActiva, setSeccionActiva] = useState<SeccionNoLectivaKey | null>(null);
  const [bloquesAsignados, setBloquesAsignados] = useState<any[]>([]);
  const [erroresSecciones, setErroresSecciones] = useState<Record<string, string>>({});

  const { data: periodosData } = useQuery({
    queryKey: ['periodos-carga-no-lectiva'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: restricciones } = useQuery({
    queryKey: ['restricciones'],
    queryFn: () => configuracionService.obtenerRestricciones().then((res) => res.data.data || res.data),
  });

  const periodos = Array.isArray(periodosData) ? periodosData : periodosData?.data || [];

  useEffect(() => {
    if (periodos.length > 0 && idPeriodo === 0) {
      const periodoActivo = periodos.find((periodo: any) => periodo.activo);
      if (periodoActivo) {
        setIdPeriodo(periodoActivo.id);
      }
    }
  }, [periodos, idPeriodo]);

  const { data: declaracionData, isLoading: cargandoDeclaracion } = useQuery({
    queryKey: ['mi-carga-no-lectiva', usuario?.idDocente, idPeriodo],
    queryFn: () => cargaNoLectivaService.obtenerMiDeclaracion(idPeriodo).then((res) => res.data),
    enabled: !!usuario?.idDocente && idPeriodo > 0,
  });

  const reglas: ReglasCargaNoLectiva | null = declaracionData?.reglas ?? null;
  const sugeridas: Partial<Record<SeccionNoLectivaKey, number>> = declaracionData?.secciones_sugeridas ?? {};

  const { data: horarioData } = useQuery({
    queryKey: ['horario-docente-combinado', usuario?.idDocente, idPeriodo],
    queryFn: async () => {
      const res = await cargaNoLectivaService.obtenerMiHorarioNoLectivo(idPeriodo);
      return res.data;
    },
    enabled: !!usuario?.idDocente && idPeriodo > 0 && !!declaracionData?.declaracion?.id,
  });

  useEffect(() => {
    if (horarioData?.no_lectivos) {
      setBloquesAsignados(horarioData.no_lectivos.map((b: any) => ({
        dia_semana: b.dia_semana,
        hora_inicio: b.hora_inicio.substring(0, 5),
        hora_fin: b.hora_fin.substring(0, 5),
        seccion: b.seccion
      })));
    }
  }, [horarioData]);

  useEffect(() => {
    if (declaracionData?.docente) {
      setDocente({
        codigo_ibm: declaracionData.docente.codigo_ibm ?? '',
        modalidad: declaracionData.docente.modalidad ?? 'NOMBRADO',
        categoria: declaracionData.docente.categoria ?? 'PRINCIPAL',
        dedicacion: declaracionData.docente.dedicacion ?? 'TIEMPO_COMPLETO_40H',
        telefono: declaracionData.docente.telefono ?? '',
      });
    } else if (usuario?.docente) {
      setDocente((actual) => ({
        ...actual,
        categoria: usuario.docente?.categoria || actual.categoria,
      }));
    }

    const nuevasSecciones = crearSeccionesIniciales();
    const seccionesGuardadas = declaracionData?.declaracion?.secciones || [];
    if (seccionesGuardadas.length > 0) {
      seccionesGuardadas.forEach((seccion: any) => {
        if (seccion?.seccion && nuevasSecciones[seccion.seccion as SeccionNoLectivaKey]) {
          nuevasSecciones[seccion.seccion as SeccionNoLectivaKey] = {
            horas: String(seccion.horas_declaradas ?? 0),
            codigo_resolucion: seccion.codigo_resolucion ?? '',
            descripcion: seccion.descripcion ?? '',
          };
        }
      });
    } else {
      SECCIONES.forEach((seccion) => {
        const sugerida = Number(sugeridas?.[seccion.clave] ?? 0);
        if (sugerida > 0) {
          nuevasSecciones[seccion.clave].horas = String(sugerida);
        }
      });
    }

    setHabilitaGobierno(Boolean(declaracionData?.banderas?.habilita_actividades_gobierno));
    setHabilitaAdministracion(Boolean(declaracionData?.banderas?.habilita_actividades_administracion));

    setSecciones(nuevasSecciones);
  }, [declaracionData, usuario]);

  useEffect(() => {
    validarSeccionesEnTiempoReal();
  }, [secciones, reglas]);

  const validarSeccionesEnTiempoReal = () => {
    const nuevosErrores: Record<string, string> = {};
    if (!reglas) return setErroresSecciones(nuevosErrores);

    const horasPreparacion = Number(secciones.PREPARACION_EVALUACION.horas || 0);
    const limiteMinPreparacion = Number(reglas.limite_min_preparacion_evaluacion || 0);
    if (horasPreparacion < limiteMinPreparacion) {
      nuevosErrores.PREPARACION_EVALUACION = `Mínimo requerido: ${formatearHoras(limiteMinPreparacion)}h (50% de la carga lectiva).`;
    }

    if (reglas.limites_fijos_por_seccion) {
      Object.entries(reglas.limites_fijos_por_seccion).forEach(([clave, max]) => {
        const limite = Number(max);
        const horas = Number(secciones[clave as SeccionNoLectivaKey]?.horas || 0);
        if (limite > 0 && horas > limite) {
          nuevosErrores[clave] = `Máximo permitido: ${formatearHoras(limite)}h.`;
        }
      });
    }

    const horasGobierno = Number(secciones.ACTIVIDADES_GOBIERNO.horas || 0);
    // Ya no bloqueamos por frontend, se valida administrativamente con la resolución
    
    const horasAdministracion = Number(secciones.ACTIVIDADES_ADMINISTRACION.horas || 0);
    // Ya no bloqueamos por frontend, se valida administrativamente con la resolución

    setErroresSecciones(nuevosErrores);
  };

  const mutationGuardar = useMutation({
    mutationFn: (datos: any) => cargaNoLectivaService.guardarMiDeclaracion(idPeriodo, datos),
    onSuccess: async (response: any) => {
      setToast({ mensaje: 'Carga no lectiva guardada correctamente', tipo: 'exito' });
      await queryClient.invalidateQueries({ queryKey: ['mi-carga-no-lectiva', usuario?.idDocente, idPeriodo] });
      setPestanaActiva('calendario');
      if (response?.data?.docente) {
        setDocente({
          codigo_ibm: response.data.docente.codigo_ibm ?? '',
          modalidad: response.data.docente.modalidad ?? 'NOMBRADO',
          categoria: response.data.docente.categoria ?? 'PRINCIPAL',
          dedicacion: response.data.docente.dedicacion ?? 'TIEMPO_COMPLETO_40H',
          telefono: response.data.docente.telefono ?? '',
        });
      }
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'No se pudo guardar la carga no lectiva', tipo: 'error' });
    },
  });

  const mutationGuardarHorario = useMutation({
    mutationFn: () => cargaNoLectivaService.guardarMiHorarioNoLectivo(idPeriodo, bloquesAsignados),
    onSuccess: async () => {
      setToast({ mensaje: 'Horario no lectivo guardado correctamente', tipo: 'exito' });
      await queryClient.invalidateQueries({ queryKey: ['horario-docente-combinado', usuario?.idDocente, idPeriodo] });
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al guardar el horario', tipo: 'error' });
    }
  });

  const mutationEliminar = useMutation({
    mutationFn: () => cargaNoLectivaService.eliminarMiDeclaracion(idPeriodo),
    onSuccess: async () => {
      setToast({ mensaje: 'Declaración eliminada', tipo: 'exito' });
      setDocente(crearDocenteInicial());
      setSecciones(crearSeccionesIniciales());
      setHabilitaGobierno(false);
      setHabilitaAdministracion(false);
      await queryClient.invalidateQueries({ queryKey: ['mi-carga-no-lectiva', usuario?.idDocente, idPeriodo] });
      setPestanaActiva('declaracion');
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'No se pudo eliminar la declaración', tipo: 'error' });
    },
  });

  const totalHoras = Object.values(secciones).reduce((acumulado, seccion) => acumulado + Number(seccion.horas || 0), 0);
  const horasLectivas = Number(reglas?.horas_lectivas ?? 0);
  const horasObjetivo = Number(docente.dedicacion.match(/(\d+)H$/)?.[1] || reglas?.horas_objetivo || 0);
  const horasTotales = horasLectivas + totalHoras;

  const manejarCambioSeccion = (clave: SeccionNoLectivaKey, campo: keyof FormularioSeccion, valor: string) => {
    if (campo === 'horas') {
      const num = parseInt(valor, 10);
      const nuevoValor = !isNaN(num) && num >= 0 ? String(num) : valor.replace(/[^0-9]/g, '');
      setSecciones((actual) => ({
        ...actual,
        [clave]: {
          ...actual[clave],
          [campo]: nuevoValor,
        },
      }));
    } else {
      setSecciones((actual) => ({
        ...actual,
        [clave]: {
          ...actual[clave],
          [campo]: valor,
        },
      }));
    }
  };

  const handleCeldaClick = (diaSemana: string, horaInicio: string) => {
    if (!seccionActiva) {
      setToast({ mensaje: 'Primero selecciona una sección (Pinceles) de la lista inferior', tipo: 'error' });
      return;
    }
    
    const hh = parseInt(horaInicio.split(':')[0]);
    
    const isLectivo = horarioData?.lectivos?.find((l: any) => l.dia_semana === diaSemana && parseInt(l.hora_inicio) <= hh && parseInt(l.hora_fin) > hh);
    if (isLectivo) {
      setToast({ mensaje: 'Esta hora ya está ocupada por una clase lectiva.', tipo: 'error' });
      return;
    }

    const bloqueExistenteIndex = bloquesAsignados.findIndex((b) => b.dia_semana === diaSemana && b.hora_inicio === horaInicio);
    const esMismaSeccion = bloqueExistenteIndex >= 0 && bloquesAsignados[bloqueExistenteIndex].seccion === seccionActiva;

    // Si no estamos removiendo, verificamos que tengamos cupo disponible
    if (!esMismaSeccion) {
      const declaradas = Number(secciones[seccionActiva].horas) || 0;
      const asignadas = bloquesAsignados.filter((b) => b.seccion === seccionActiva).length;
      if (asignadas >= declaradas) {
        setToast({ mensaje: `No puedes exceder el máximo de horas (${declaradas}h) declaradas para esta sección.`, tipo: 'error' });
        return;
      }

      const resActivas = restricciones?.franjaInicio ? restricciones : restricciones?.data;
      const maxHorasDiarias = resActivas?.horasMaximasDiarias ? Number(resActivas.horasMaximasDiarias) : 9;

      const horasLectivasEnDia = horarioData?.lectivos?.filter((l: {dia_semana: string}) => l.dia_semana === diaSemana).reduce((acc: number, l: {hora_fin: string, hora_inicio: string}) => acc + (parseInt(l.hora_fin) - parseInt(l.hora_inicio)), 0) || 0;
      const horasNoLectivasEnDia = bloquesAsignados.filter((b) => b.dia_semana === diaSemana).length;
      
      if (horasLectivasEnDia + horasNoLectivasEnDia >= maxHorasDiarias) {
        setToast({ mensaje: `Límite diario alcanzado. No puedes asignar más de ${maxHorasDiarias}h en un mismo día (Lectiva + No Lectiva).`, tipo: 'error' });
        return;
      }
    }

    const horaFin = `${(hh + 1).toString().padStart(2, '0')}:00`;

    setBloquesAsignados((prev) => {
      const index = prev.findIndex((b) => b.dia_semana === diaSemana && b.hora_inicio === horaInicio);
      
      if (index >= 0) {
        const prevBloques = [...prev];
        if (prevBloques[index].seccion === seccionActiva) {
          prevBloques.splice(index, 1);
        } else {
          prevBloques[index] = { dia_semana: diaSemana, hora_inicio: horaInicio, hora_fin: horaFin, seccion: seccionActiva };
        }
        return prevBloques;
      }
      
      return [...prev, { dia_semana: diaSemana, hora_inicio: horaInicio, hora_fin: horaFin, seccion: seccionActiva }];
    });
  };

  const construirMatriz = () => {
    const filas = [];
    
    let inicio = 7;
    let fin = 22;
    let almuerzoInicio = -1;
    let almuerzoFin = -1;

    const resActivas = restricciones?.franjaInicio ? restricciones : restricciones?.data;

    if (resActivas) {
      if (resActivas.franjaInicio) inicio = parseInt(resActivas.franjaInicio.split(':')[0]);
      if (resActivas.franjaFin) fin = parseInt(resActivas.franjaFin.split(':')[0]);
      if (resActivas.bloqueoAlmuerzoInicio) almuerzoInicio = parseInt(resActivas.bloqueoAlmuerzoInicio.split(':')[0]);
      if (resActivas.bloqueoAlmuerzoFin) almuerzoFin = parseInt(resActivas.bloqueoAlmuerzoFin.split(':')[0]);
    }

    for (let hora = inicio; hora < fin; hora++) {
      const hh = hora.toString().padStart(2, '0');
      const horaStr = `${hh}:00`;
      
      const celdas = DIAS_SEMANA.map((dia) => {
        if (hora >= almuerzoInicio && hora < almuerzoFin) {
          return { diaSemana: dia, horaInicio: horaStr, estado: 'BLOQUEO_ALMUERZO' as const };
        }

        const bloqueLectivo = horarioData?.lectivos?.find((l: any) => l.dia_semana === dia && parseInt(l.hora_inicio) <= hora && parseInt(l.hora_fin) > hora);
        const bloqueAsignado = bloquesAsignados.find((b) => b.dia_semana === dia && b.hora_inicio === horaStr);
        
        if (bloqueLectivo) return { diaSemana: dia, horaInicio: horaStr, estado: 'LECTIVO' as const, info: { origen: bloqueLectivo.origen || 'Clase Lectiva' } };
        if (bloqueAsignado) return { diaSemana: dia, horaInicio: horaStr, estado: 'NO_LECTIVO' as const, info: { seccion: bloqueAsignado.seccion } };
        return { diaSemana: dia, horaInicio: horaStr, estado: 'LIBRE' as const };
      });
      
      filas.push({ horaInicio: horaStr, celdas });
    }
    return { filas };
  };

  const calcularProgresoAsignacion = (clave: string) => {
    const declaradas = Number(secciones[clave as SeccionNoLectivaKey].horas) || 0;
    const asignadas = bloquesAsignados.filter((b) => b.seccion === clave).length;
    return { declaradas, asignadas, completado: asignadas >= declaradas && declaradas > 0, exceso: asignadas > declaradas };
  };

  const guardarDeclaracion = () => {
    if (!usuario?.idDocente || !idPeriodo) return;

    if (reglas && Math.abs(horasTotales - horasObjetivo) > 0.01) {
      setToast({ mensaje: 'Completa la jornada para guardar', tipo: 'error' });
      return;
    }

    const payload = {
      docente: {
        codigo_ibm: docente.codigo_ibm,
        modalidad: docente.modalidad,
        categoria: docente.categoria,
        dedicacion: docente.dedicacion,
        telefono: docente.telefono,
      },
      habilita_actividades_gobierno: habilitaGobierno,
      habilita_actividades_administracion: habilitaAdministracion,
      secciones: SECCIONES.map((seccion) => ({
        seccion: seccion.clave,
        horas: Number(secciones[seccion.clave].horas || 0),
        codigo_resolucion: secciones[seccion.clave].codigo_resolucion || null,
        descripcion: secciones[seccion.clave].descripcion || null,
      })),
    };

    mutationGuardar.mutate(payload);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="relative rounded-[3rem] bg-[#0A192F] px-8 py-10 md:px-12 md:py-14 text-white shadow-2xl border border-[#112240] mx-4 sm:mx-6 lg:mx-8 mt-6">
        <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-[#D4AF37]/5 blur-3xl" />
          <div className="absolute left-1/4 bottom-0 h-56 w-56 bg-white/5 blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-5">
            <button onClick={() => router.push('/docente')} className="rounded-full p-3 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors shadow-sm">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-col gap-3">
              <span className="inline-flex w-max items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#D4AF37] shadow-sm">
                Panel Docente
              </span>
              <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-white">
                Declaración y Matriz No Lectiva
              </h1>
              <p className="text-sm md:text-base text-gray-400 font-medium">
                Distribuye tus horas no lectivas para el período <strong className="text-white">{periodos?.find((p: any) => p.id === idPeriodo)?.nombre || 'actual'}</strong>.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-72 space-y-3 rounded-[2rem] border border-white/10 bg-[#020C1B]/60 p-5 shadow-2xl backdrop-blur-xl">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5" />
              Periodo Académico
            </label>
            <div className="relative mt-2 dark">
              <SelectorInstitucional
                value={idPeriodo}
                onChange={(val: any) => setIdPeriodo(Number(val))}
                opciones={periodos?.map((p: any) => ({
                  value: p.id,
                  label: p.nombre,
                })) || []}
                placeholder="-- Seleccionar período --"
              />
            </div>
          </div>
        </div>

        {/* Navegación de Pestañas */}
        <div className="relative z-10 mt-10">
          <div className="flex overflow-x-auto custom-scrollbar bg-[#020C1B]/50 rounded-2xl p-2 border border-white/5 shadow-inner w-full lg:w-fit gap-2">
            <button 
              onClick={() => setPestanaActiva('declaracion')}
              className={cn(
                'flex flex-shrink-0 items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300',
                pestanaActiva === 'declaracion' ? 'bg-white text-[#0A192F] shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <LayoutList className="h-4 w-4" />
              1. Declaración de Horas
            </button>
            <button 
              onClick={() => {
                if (!declaracionData?.declaracion?.id) {
                  setToast({ mensaje: 'Primero debes guardar tu declaración (Paso 1)', tipo: 'error' });
                  return;
                }
                setPestanaActiva('calendario');
              }}
              className={cn(
                'flex flex-shrink-0 items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300',
                pestanaActiva === 'calendario' ? 'bg-white text-[#0A192F] shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5',
                !declaracionData?.declaracion?.id ? 'opacity-50 cursor-not-allowed' : ''
              )}
            >
              <CalendarDays className="h-4 w-4" />
              2. Matriz de Distribución
            </button>
            <button 
              onClick={() => {
                if (!declaracionData?.declaracion?.id) {
                  setToast({ mensaje: 'Primero debes guardar tu declaración (Paso 1)', tipo: 'error' });
                  return;
                }
                setPestanaActiva('formatos');
              }}
              className={cn(
                'flex flex-shrink-0 items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300',
                pestanaActiva === 'formatos' ? 'bg-white text-[#0A192F] shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5',
                !declaracionData?.declaracion?.id ? 'opacity-50 cursor-not-allowed' : ''
              )}
            >
              <FileText className="h-4 w-4" />
              3. Formatos Oficiales
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {!usuario?.idDocente ? (
          <Card className="border-none shadow-lg rounded-[2rem]">
            <CardContent className="py-16 text-center text-slate-500">
              Este módulo solo está disponible para docentes autenticados.
            </CardContent>
          </Card>
        ) : !idPeriodo ? (
          <Card className="border-none shadow-lg rounded-[2rem]">
            <CardContent className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
              <CalendarDays className="h-10 w-10 text-slate-300" />
              Selecciona un período académico para comenzar.
            </CardContent>
          </Card>
        ) : pestanaActiva === 'declaracion' ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Columna izquierda: Dossier */}
            <div className="lg:col-span-8 space-y-8">
              {/* Datos del docente */}
              <div className="bg-white dark:bg-[#020C1B] rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-xl relative">
                <div className="px-8 py-6 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center gap-4 rounded-t-[2.5rem]">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-500/30">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Ficha del Docente</h2>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Información de Contrato</p>
                  </div>
                </div>
                <div className="p-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <CampoTexto label="Nombres" value={declaracionData?.docente?.nombres || usuario?.docente?.nombres || ''} disabled className="lg:col-span-2" />
                  <CampoTexto label="Apellidos" value={declaracionData?.docente?.apellidos || usuario?.docente?.apellidos || ''} disabled className="lg:col-span-2" />
                  <CampoTexto
                    label="Código IBM"
                    value={docente.codigo_ibm}
                    onChange={(e) => setDocente((actual) => ({ ...actual, codigo_ibm: e.target.value }))}
                    placeholder="Ingresa tu IBM"
                    disabled={Boolean(declaracionData?.docente?.codigo_ibm)}
                    ayuda={declaracionData?.docente?.codigo_ibm ? 'Inmutable' : undefined}
                    className="lg:col-span-2"
                  />
                  <div className="space-y-1.5 lg:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Condición</label>
                    <SelectorInstitucional value={docente.modalidad} onChange={(val: any) => setDocente((actual) => ({ ...actual, modalidad: String(val) }))} opciones={MODALIDADES.map(m => ({value: m.valor, label: m.etiqueta}))} />
                  </div>
                  <div className="space-y-1.5 lg:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Categoría</label>
                    <SelectorInstitucional value={docente.categoria} onChange={(val: any) => setDocente((actual) => ({ ...actual, categoria: String(val) }))} opciones={CATEGORIAS.map(c => ({value: c.valor, label: c.etiqueta}))} />
                  </div>
                  <div className="space-y-1.5 lg:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Dedicación</label>
                    <SelectorInstitucional value={docente.dedicacion} onChange={(val: any) => setDocente((actual) => ({ ...actual, dedicacion: String(val) }))} opciones={DEDICACIONES.map(d => ({value: d.valor, label: d.etiqueta}))} />
                  </div>
                  <CampoTexto
                    label="Teléfono"
                    value={docente.telefono}
                    onChange={(e) => setDocente((actual) => ({ ...actual, telefono: e.target.value }))}
                    placeholder="Opcional"
                    className="lg:col-span-2"
                  />
                  <CampoTexto
                    label="Correo institucional"
                    value={declaracionData?.docente?.email || usuario?.email || ''}
                    disabled
                    className="lg:col-span-2"
                  />
                </div>
              </div>

              {/* Secciones no lectivas */}
              <div className="bg-white dark:bg-[#020C1B] rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-xl relative">
                <div className="px-8 py-6 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center gap-4 rounded-t-[2.5rem]">
                  <div className="p-3 bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-500/30">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Declaración de Horas</h2>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Desglose de Actividades No Lectivas</p>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-white/10">
                  {SECCIONES.map((seccion) => {
                    const deshabilitado = false;
                    const maxPermitido = reglas?.limites_fijos_por_seccion?.[seccion.clave];
                    const tieneError = Boolean(erroresSecciones[seccion.clave]);
                    
                    return (
                      <div key={seccion.clave} className={cn("p-8 flex flex-col xl:flex-row gap-8 items-start transition-colors", deshabilitado ? "bg-gray-50 dark:bg-white/5 opacity-60" : "hover:bg-slate-50/30 dark:hover:bg-white/[0.02]", tieneError && "bg-red-50/30 dark:bg-red-500/10")}>
                        {/* Title and Help text */}
                        <div className="w-full xl:w-1/3 space-y-2">
                          <h3 className="text-base font-black text-gray-900 dark:text-white tracking-tight">{seccion.titulo}</h3>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed pr-4">{seccion.ayuda}</p>
                          {deshabilitado && (
                            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/20 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-500/30">Inhabilitado</span>
                          )}
                        </div>
                        
                        {/* Description Textarea */}
                        <div className="w-full xl:w-1/2">
                          <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Detalle (Opcional)</label>
                          <textarea
                            value={secciones[seccion.clave].descripcion}
                            onChange={(e) => manejarCambioSeccion(seccion.clave, 'descripcion', e.target.value)}
                            disabled={deshabilitado}
                            placeholder={deshabilitado ? "Sección inactiva." : "Especificar número de alumnos, grupos de investigación, u otros detalles..."}
                            rows={3}
                            className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 shadow-sm transition-all focus:border-indigo-500 dark:focus:border-[#D4AF37] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-[#D4AF37]/10 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-white/5"
                          />
                        </div>

                        {/* Hours and Code */}
                        <div className="w-full xl:w-[20%] flex flex-col gap-4">
                            <div className="relative">
                              <CampoTexto
                                label={maxPermitido ? `Horas (Max: ${maxPermitido})` : "Horas"}
                                type="number"
                                step="1"
                                min="0"
                                value={secciones[seccion.clave].horas}
                                onChange={(e) => manejarCambioSeccion(seccion.clave, 'horas', e.target.value)}
                                disabled={deshabilitado}
                                placeholder="0"
                                className={cn("text-center text-xl font-black h-12 shadow-inner", tieneError ? 'border-red-300 dark:border-red-500/50 focus:border-red-500 focus:ring-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' : 'text-indigo-950 dark:text-white bg-gray-50 dark:bg-white/5')}
                              />
                              {tieneError && (
                                <p className="absolute -bottom-6 left-0 text-[10px] font-bold text-red-600 dark:text-red-400 leading-tight w-[200px]" title={erroresSecciones[seccion.clave]}>
                                  {erroresSecciones[seccion.clave]}
                                </p>
                              )}
                            </div>
                            <CampoTexto
                              label="Resolución"
                              value={secciones[seccion.clave].codigo_resolucion}
                              onChange={(e) => manejarCambioSeccion(seccion.clave, 'codigo_resolucion', e.target.value)}
                              disabled={deshabilitado}
                              placeholder="Ej. RES-001"
                              className="text-xs h-10 font-mono uppercase"
                            />
                        </div>
                      </div>
                    )})}
                </div>
              </div>

              {/* Detalle de carga lectiva */}
              <div className="bg-white dark:bg-[#020C1B] rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-xl relative">
                <div className="px-8 py-6 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex items-center gap-4 rounded-t-[2.5rem]">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-500/30">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Carga Lectiva Asignada</h2>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Cursos del Semestre</p>
                  </div>
                </div>
                <div className="p-0 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-white/5 text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/10">
                        <th className="py-4 pl-8 pr-4 font-black">Código</th>
                        <th className="py-4 pr-4 font-black">Curso</th>
                        <th className="py-4 pr-4 font-black">Ciclo</th>
                        <th className="py-4 pr-4 font-black">Componente</th>
                        <th className="py-4 pr-8 font-black text-right">Horas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                      {(declaracionData?.carga_lectiva ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-gray-400 dark:text-gray-500 font-bold">No hay carga lectiva asignada.</td>
                        </tr>
                      ) : (
                        (declaracionData?.carga_lectiva ?? []).map((fila: any, index: number) => (
                          <tr key={`${fila.curso_codigo}-${index}`} className="hover:bg-gray-50/30 dark:hover:bg-white/5 transition-colors">
                            <td className="py-4 pl-8 pr-4 font-mono font-bold text-gray-500 dark:text-gray-400">{fila.curso_codigo}</td>
                            <td className="py-4 pr-4 font-bold text-gray-900 dark:text-white">{fila.curso_nombre}</td>
                            <td className="py-4 pr-4 font-medium text-gray-600 dark:text-gray-300">{fila.ciclo}</td>
                            <td className="py-4 pr-4">
                              <span className="inline-block px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-100 dark:border-indigo-500/30">{fila.componente}</span>
                            </td>
                            <td className="py-4 pr-8 text-right font-black text-lg text-gray-900 dark:text-white">{formatearHoras(Number(fila.horas ?? 0))}h</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Columna derecha: Validator/Ledger */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8 lg:self-start">
              <div className="bg-[#020C1B] rounded-[2.5rem] border border-[#112240] shadow-2xl overflow-hidden flex flex-col relative group">
                <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />
                <div className="absolute bottom-0 left-0 h-32 w-32 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />
                
                <div className="px-8 py-6 border-b border-[#112240] flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-gray-300">
                      <Save className="h-4 w-4" />
                    </div>
                    <h2 className="text-lg font-black text-white tracking-wide">Validador de Jornada</h2>
                  </div>
                  <span className="relative flex h-3 w-3">
                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", Math.abs(horasTotales - horasObjetivo) < 0.01 && Object.keys(erroresSecciones).length === 0 ? "bg-emerald-400" : "bg-amber-400")}></span>
                    <span className={cn("relative inline-flex rounded-full h-3 w-3", Math.abs(horasTotales - horasObjetivo) < 0.01 && Object.keys(erroresSecciones).length === 0 ? "bg-emerald-500" : "bg-amber-500")}></span>
                  </span>
                </div>

                <div className="p-8 space-y-8 relative z-10 font-mono">
                  {/* Ledger lines */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-white/10 pb-3">
                      <span className="text-xs font-bold text-gray-400 tracking-wider">01. LECTIVA</span>
                      <span className="text-xl font-black text-white">{formatearHoras(horasLectivas)}<span className="text-sm text-gray-500 ml-1">h</span></span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-3">
                      <span className="text-xs font-bold text-gray-400 tracking-wider">02. NO LECTIVA</span>
                      <span className="text-xl font-black text-white">{formatearHoras(totalHoras)}<span className="text-sm text-gray-500 ml-1">h</span></span>
                    </div>
                    <div className="flex justify-between items-end border-b-2 border-white/20 pb-3 pt-2">
                      <span className="text-sm font-black text-white tracking-wider">TOTAL CALCULADO</span>
                      <span className="text-3xl font-black text-indigo-400">{formatearHoras(horasTotales)}<span className="text-sm text-indigo-500/50 ml-1">h</span></span>
                    </div>
                    <div className="flex justify-between items-end pt-2">
                      <span className="text-xs font-bold text-gray-500 tracking-wider">META DEDICACIÓN</span>
                      <span className="text-xl font-black text-gray-300">{formatearHoras(horasObjetivo)}<span className="text-sm text-gray-600 ml-1">h</span></span>
                    </div>
                  </div>

                  {/* Status Box */}
                  <div className={cn(
                    "rounded-2xl p-5 border",
                    Math.abs(horasTotales - horasObjetivo) < 0.01 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  )}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Estado de la Declaración</p>
                    <p className="text-sm font-bold leading-relaxed">
                      {Math.abs(horasTotales - horasObjetivo) < 0.01
                        ? '> JORNADA CUADRADA CORRECTAMENTE.'
                        : horasTotales < horasObjetivo
                          ? `> FALTAN ${formatearHoras(horasObjetivo - horasTotales)}H PARA CUBRIR META.`
                          : `> EXCESO DE ${formatearHoras(horasTotales - horasObjetivo)}H DETECTADO.`}
                    </p>
                  </div>

                  {Object.keys(erroresSecciones).length > 0 && (
                    <div className="rounded-2xl p-5 bg-red-500/10 border border-red-500/30 text-red-400">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Errores Detectados</p>
                      <p className="text-sm font-bold leading-relaxed">
                        > REVISA LOS CAMPOS MARCADOS EN ROJO.
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      onClick={guardarDeclaracion}
                      disabled={Math.abs(horasTotales - horasObjetivo) > 0.01 || Object.keys(erroresSecciones).length > 0 || mutationGuardar.isPending || cargandoDeclaracion}
                      className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl bg-white text-[#0A192F] font-black text-sm uppercase tracking-widest transition-all hover:bg-gray-200 disabled:opacity-50 disabled:bg-white/10 disabled:text-gray-400 disabled:cursor-not-allowed group shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    >
                      {mutationGuardar.isPending ? 'PROCESANDO...' : 'GUARDAR Y CONTINUAR'}
                      {!mutationGuardar.isPending && <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : pestanaActiva === 'calendario' ? (
          <div className="grid grid-cols-1 gap-8">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white/60 backdrop-blur-md" id="paso2">
              <CardHeader className="bg-gradient-to-r from-unt-primary to-[#0f4c81] text-white flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-6 px-6">
                <CardTitle className="flex items-center gap-3 text-white text-xl">
                  <CalendarDays className="h-6 w-6" />
                  Paso 2: Distribución de Horario No Lectivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-8 pb-10 px-6">
                <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-5 backdrop-blur-sm shadow-sm flex gap-4 items-start">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900 space-y-1">
                    <p><strong>Instrucciones:</strong> Asigna tus bloques horarios en el calendario guiándote de los "Pinceles" inferiores.</p>
                    <ul className="list-disc pl-5 opacity-90 text-xs">
                      <li>Selecciona una sección no lectiva en la paleta lateral.</li>
                      <li>Haz clic en los espacios libres del calendario (gris son tus clases lectivas inmodificables).</li>
                      <li>Asegúrate de pintar exactamente las mismas horas que declaraste.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-6 items-start">
                  
                  {/* Pinceles Laterales */}
                  <div className="w-full xl:w-72 flex-shrink-0 bg-slate-50/80 rounded-2xl p-5 border border-slate-200 shadow-sm xl:sticky xl:top-6">
                    <h4 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      Paleta de Secciones
                    </h4>
                    <div className="flex flex-row xl:flex-col flex-wrap gap-3">
                      {Object.entries(secciones)
                        .filter(([k, v]) => Number(v.horas) > 0)
                        .map(([clave, v]) => {
                          const progreso = calcularProgresoAsignacion(clave);
                          return (
                            <button
                              key={clave}
                              onClick={() => setSeccionActiva(clave as SeccionNoLectivaKey)}
                              className={cn(
                                'flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 w-full',
                                seccionActiva === clave 
                                  ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500/20' 
                                  : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                              )}
                            >
                              <div className="flex flex-col gap-1 w-full">
                                <span className={cn('text-xs font-bold truncate', seccionActiva === clave ? 'text-indigo-900' : 'text-slate-700')}>
                                  {SECCIONES.find(s => s.clave === clave)?.titulo || clave.replace(/_/g, ' ')}
                                </span>
                                <div className="flex items-center justify-between mt-1">
                                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', progreso.completado ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                                    {progreso.asignadas} / {progreso.declaradas}h
                                  </span>
                                  {progreso.completado && <span className="text-emerald-500 text-[10px] font-bold">✓ Listo</span>}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Calendario */}
                  <div className="flex-grow min-w-0 bg-white rounded-2xl p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-x-auto w-full">
                    <MatrizCargaNoLectiva 
                      matriz={construirMatriz()} 
                      alHacerClickCelda={handleCeldaClick} 
                      bloqueado={mutationGuardarHorario.isPending}
                    />
                  </div>
                </div>
                  
                <div className="flex justify-end pt-8 mt-6">
                  <Boton 
                    onClick={() => mutationGuardarHorario.mutate()} 
                    cargando={mutationGuardarHorario.isPending}
                    disabled={Object.keys(secciones).some((key) => {
                      const k = key as SeccionNoLectivaKey;
                      const horasStr = secciones[k].horas;
                      return Number(horasStr) > 0 && bloquesAsignados.filter((b) => b.seccion === k).length < Number(horasStr);
                    })}
                    variante="primario"
                    className="px-10 py-5 text-base rounded-[1.5rem] shadow-lg shadow-unt-primary/20 hover:scale-[1.02] transition-transform"
                  >
                    <Save className="h-5 w-5" />
                    Guardar Horario No Lectivo
                  </Boton>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white/60 backdrop-blur-md" id="paso3">
              <CardHeader className="bg-gradient-to-r from-unt-primary to-[#0f4c81] text-white flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-6 px-6">
                <CardTitle className="flex items-center gap-3 text-white text-xl">
                  <FileText className="h-6 w-6" />
                  Paso 3: Formatos Automáticos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-8 pb-10 px-6">
                <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-5 backdrop-blur-sm shadow-sm flex gap-4 items-start">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900 space-y-1">
                    <p><strong>Instrucciones:</strong> Descarga los formatos oficiales con tu declaración no lectiva ya completada.</p>
                  </div>
                </div>

                <div className="w-full">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-4">Formatos Disponibles</p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm text-slate-700">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.14em] text-slate-500">
                            <th className="py-3 pr-4 font-semibold">Formato</th>
                            <th className="py-3 pr-4 font-semibold">Sede</th>
                            <th className="py-3 pr-4 font-semibold">Estado</th>
                            <th className="py-3 pr-4 font-semibold text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(declaracionData?.formatos ?? []).map((formato: any) => (
                            <tr key={formato.tipo} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 pr-4 font-medium">{formato.etiqueta}</td>
                              <td className="py-3 pr-4">{formato.sede}</td>
                              <td className="py-3 pr-4">
                                <span className={cn('inline-flex rounded-full px-3 py-1.5 text-xs font-bold', 
                                  formato.estado === 'GENERADO' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-amber-100 text-amber-700'
                                )}>
                                  {formato.estado}
                                </span>
                              </td>
                              <td className="py-3 pr-4 text-right">
                                <Boton
                                  onClick={() => window.open(`/imprimir/formatos/${formato.tipo}?idPeriodo=${idPeriodo}`, '_blank')}
                                  variante="borde"
                                  className="h-10 rounded-xl px-4 text-xs font-bold text-unt-primary hover:bg-unt-primary/10"
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  Imprimir
                                </Boton>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </main>
      {toast && <NotificacionToast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
}
