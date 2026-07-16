'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, X, Send, Loader2, User, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { periodosService } from '@/services/periodos.service';
import { estadisticasService } from '@/services/estadisticas.service';
import { cargaHorariaService } from '@/services/carga-horaria.service';
import { ventanasService } from '@/services/ventanas.service';
import { docentesService } from '@/services/docentes.service';
import { ambientesService } from '@/services/ambientes.service';
import { horariosService } from '@/services/horarios.service';
import { reportesService, descargarBlob } from '@/services/reportes.service';
import { chatService } from '@/services/chat.service';
import { cn } from '@/lib/utilidades';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

type UserRole = 'ADMIN' | 'DIRECTOR' | 'SECRETARIA' | 'DOCENTE';

interface Sugerencia {
  texto: string;
  consulta: string;
}

const DIAS_MAP: Record<string, string> = {
  lunes: 'LUNES', martes: 'MARTES', miercoles: 'MIERCOLES',
  jueves: 'JUEVES', viernes: 'VIERNES', sabado: 'SABADO', domingo: 'DOMINGO',
};

const DIAS_LABEL: Record<string, string> = {
  LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
};

export const NanoChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bienvenido. Soy el Asistente UNT, unidad de soporte del Sistema de Horarios. Ingrese su requerimiento.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { usuario } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const role = usuario?.rol as UserRole;

  const sugerencias = useMemo((): Sugerencia[] => {
    if (role === 'DOCENTE') return [
      { texto: 'Mis cursos', consulta: '¿Cuáles son mis cursos asignados?' },
      { texto: 'Mis horas', consulta: '¿Cuántas horas lectivas tengo?' },
      { texto: 'Mi horario hoy', consulta: '¿Qué clases tengo hoy?' },
      { texto: 'Mi horario semana', consulta: '¿Cuál es mi horario completo esta semana?' },
      { texto: 'Componentes de curso', consulta: '¿Qué componentes tengo de cada curso?' },
      { texto: 'Declaración de carga', consulta: '¿He presentado mi declaración de carga?' },
    ];
    if (role === 'SECRETARIA' || role === 'ADMIN') return [
      { texto: 'Docentes pendientes', consulta: '¿Qué docentes faltan cargar horario?' },
      { texto: 'Estado ventanas', consulta: 'Estado de las ventanas de atención' },
      { texto: 'Ambientes disponibles', consulta: '¿Qué ambientes están disponibles?' },
      { texto: 'Cursos por ciclo', consulta: '¿Qué cursos se dictan en el ciclo 1?' },
      { texto: 'Horario docente', consulta: '¿Qué horario tiene el docente [nombre]?' },
      { texto: 'Resumen general', consulta: 'Resumen general del periodo activo' },
    ];
    if (role === 'DIRECTOR') return [
      { texto: 'Cursos del ciclo 1', consulta: 'Cursos del ciclo 1' },
      { texto: 'Resumen general', consulta: 'Resumen general del periodo' },
      { texto: 'Total docentes', consulta: '¿Cuántos docentes hay registrados?' },
      { texto: 'Total cursos', consulta: '¿Cuántos cursos se dictan en total?' },
      { texto: 'Cursos electivos', consulta: '¿Cuántos cursos electivos vs regulares hay?' },
    ];
    return [];
  }, [role]);

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[¿?¡!.]/g, '')
      .trim();
  };

  const matchesKeywords = (text: string, keywords: string[]): boolean => {
    return keywords.some((keyword) => text.includes(keyword));
  };

  const getPeriodoActivo = async () => {
    const periodosRes = await periodosService.listar();
    const periodos = periodosRes.data || periodosRes;
    return periodos.find((p: any) => p.activo);
  };

  const buscarDocente = async (nombre: string): Promise<any | null> => {
    try {
      const res = await docentesService.buscar(nombre);
      const docentes = res.data || res;
      if (Array.isArray(docentes) && docentes.length > 0) {
        return docentes[0];
      }
      return null;
    } catch {
      return null;
    }
  };

  const consultarGemini = async (text: string): Promise<string | null> => {
    try {
      const res = await chatService.consultar({ consulta: text, rol: role });
      if (res.data?.respuesta) return res.data.respuesta;
      return null;
    } catch {
      return null;
    }
  };

  const formatBloquesHorario = (bloques: any[]): string => {
    const sorted = [...bloques].sort((a, b) => {
      const dias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
      const diaDiff = dias.indexOf(a.dia) - dias.indexOf(b.dia);
      if (diaDiff !== 0) return diaDiff;
      return (a.horaInicio || '').localeCompare(b.horaInicio || '');
    });

    return sorted.map((b: any) => {
      const dia = DIAS_LABEL[b.dia] || b.dia;
      const horaInicio = b.horaInicio ? b.horaInicio.slice(0, 5) : '--:--';
      const horaFin = b.horaFin ? b.horaFin.slice(0, 5) : '--:--';
      const curso = b.cursoNombre || b.curso?.nombre || 'Curso';
      const codigo = b.cursoCodigo || b.curso?.codigo || '';
      const aula = b.ambienteNombre || b.ambiente?.nombre || '';
      return `- ${dia} ${horaInicio}-${horaFin} | ${codigo ? codigo + ' ' : ''}${curso}${aula ? ' (' + aula + ')' : ''}`;
    }).join('\n');
  };

  const extractDocenteName = (text: string): string | null => {
    const patterns = [
      /(?:horario|clases|pdf|descargar|enviar|horario del?)\s+(?:docente\s+)?(.+)/,
      /(?:que dias trabaja|que dias tiene|cuando trabaja|dias de clase del?)\s+(?:docente\s+)?(.+)/,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1].trim().length > 0) {
        return match[1].trim();
      }
    }
    return null;
  };

  // ============ DOCENTE QUERY HANDLERS ============

  const getHoyDia = () => {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return dias[new Date().getDay()];
  };

  const handleDocenteQuery = async (text: string): Promise<string> => {
    const idDocente = usuario?.idDocente;
    if (!idDocente) {
      return 'Error: Registro docente no hallado en la base de datos.';
    }

    // Handle horario-related queries (hoy, semana, dia especifico)
    if (matchesKeywords(text, ['horario', 'mi horario', 'ver horario', 'cual es mi horario', 'ver mi horario', 'que clases', 'mis clases', 'clases hoy', 'clases mañana', 'horario completo', 'horario semana'])) {
      try {
        const periodoActivo = await getPeriodoActivo();
        if (!periodoActivo) return 'Advertencia: No existe un periodo académico configurado como activo.';

        const res = await horariosService.obtenerSeleccionesTemporales(idDocente);
        let bloques = res.data || res;
        if (!Array.isArray(bloques)) bloques = [];

        if (bloques.length === 0) {
          return 'Información: No registra carga horaria en el periodo vigente.';
        }

        // Check if querying a specific day
        let diaFiltrado = null;
        if (matchesKeywords(text, ['hoy'])) {
          diaFiltrado = getHoyDia();
        } else {
          for (const dia of Object.keys(DIAS_MAP)) {
            if (text.includes(dia)) {
              diaFiltrado = dia;
              break;
            }
          }
        }

        if (diaFiltrado) {
          const diaDb = DIAS_MAP[diaFiltrado as keyof typeof DIAS_MAP];
          const bloquesDia = bloques.filter((b: any) => b.dia === diaDb);
          if (bloquesDia.length === 0) {
            return `No tienes clases ${diaFiltrado === getHoyDia() ? 'hoy' : 'el ' + diaFiltrado}.`;
          }
          const textoBloques = formatBloquesHorario(bloquesDia);
          return `Tu horario ${diaFiltrado === getHoyDia() ? 'hoy' : 'el ' + diaFiltrado} es:\n${textoBloques}`;
        }

        // Otherwise, show full week
        const textoBloques = formatBloquesHorario(bloques);
        return `Tu horario completo de la semana es:\n${textoBloques}`;
      } catch (err) {
        console.error('Error loading docente horario:', err);
        return 'Error de conexión al procesar su horario. Reintente en unos minutos.';
      }
    }

    if (matchesKeywords(text, ['curso', 'cursos', 'asignado', 'asignados', 'mis curso', 'mis cursos', 'que cursos', 'cuales son mis cursos', 'dame mis cursos'])) {
      try {
        const periodoActivo = await getPeriodoActivo();
        if (!periodoActivo) return 'Advertencia: No existe un periodo académico configurado como activo.';

        const resumen = await estadisticasService.resumenDocente(idDocente, periodoActivo.id);
        const componentes = resumen.data?.componentes || [];

        if (componentes.length === 0) {
          return 'Información: No se encontraron cursos asignados a su perfil en el periodo actual.';
        }

        const cursos = componentes.map((c: any) => {
          const cursoCodigo = c.cursoCodigo || '';
          const cursoNombre = c.nombreCurso || 'Curso sin nombre';
          const componente = c.tipoComponente || 'Componente';
          return `- ${cursoCodigo ? cursoCodigo + ': ' : ''}${cursoNombre} (${componente}) - ${c.horasAsignadas}h/sem`;
        }).join('\n');

        return `Reporte de cursos asignados (Periodo Vigente):\n${cursos}`;
      } catch (err) {
        console.error('Error loading courses:', err);
        return 'Error de conexión al cargar los cursos. Reintente en unos minutos.';
      }
    }

    if (matchesKeywords(text, ['hora', 'horas', 'lectiva', 'lectivas', 'cuantas horas', 'cuantas hora', 'total horas', 'horas totales', 'carga horaria', 'mi carga'])) {
      try {
        const periodoActivo = await getPeriodoActivo();
        if (!periodoActivo) return 'Advertencia: No existe un periodo académico configurado como activo.';

        const resumen = await estadisticasService.resumenDocente(idDocente, periodoActivo.id);
        const totalHoras = resumen.data?.horasLectivas || 0;
        const horasMax = resumen.data?.horasMaximas || 40;
        const porcentaje = Math.round((totalHoras / horasMax) * 100);

        return `Resumen de carga lectiva: ${totalHoras} horas asignadas de un máximo de ${horasMax} horas (${porcentaje}% de su capacidad).`;
      } catch (err) {
        console.error('Error loading hours:', err);
        return 'Error al procesar la información de horas lectivas.';
      }
    }

    return '__GENERIC_FALLBACK__Módulo de consulta docente. Puede verificar cursos asignados, carga lectiva o revisar su horario personal. Indique qué información requiere.';
  };

  // ============ SECRETARIA QUERY HANDLERS ============

  const handleDocenteSchedule = async (text: string): Promise<string | null> => {
    const name = extractDocenteName(text);
    if (!name) return null;

    const docente = await buscarDocente(name);
    if (!docente) return null;

    const periodoActivo = await getPeriodoActivo();
    if (!periodoActivo) return `No se pudo encontrar información del docente "${name}" en el periodo activo.`;

    try {
      const res = await horariosService.obtenerSeleccionesTemporales(docente.id);
      const bloques = res.data || res;
      if (!Array.isArray(bloques) || bloques.length === 0) {
        return `Información: El docente ${docente.apellidos}, ${docente.nombres} no registra horario en el sistema.`;
      }
      const bloquesTexto = formatBloquesHorario(bloques);
      return `Horario de ${docente.apellidos}, ${docente.nombres}:\n${bloquesTexto}`;
    } catch {
      return `Error al consultar el horario del docente ${docente.apellidos}, ${docente.nombres}.`;
    }
  };

  const handleDocenteScheduleByDay = async (text: string): Promise<string | null> => {
    const diaEncontrado = Object.keys(DIAS_MAP).find((d) => text.includes(d));
    if (!diaEncontrado) return null;

    const name = extractDocenteName(text);
    if (!name) return null;

    const docente = await buscarDocente(name);
    if (!docente) return null;

    const periodoActivo = await getPeriodoActivo();
    if (!periodoActivo) return 'No se pudo obtener información del periodo activo.';

    try {
      const res = await horariosService.obtenerSeleccionesTemporales(docente.id);
      const bloques = res.data || res;
      if (!Array.isArray(bloques) || bloques.length === 0) {
        return `El docente ${docente.apellidos}, ${docente.nombres} no tiene horario cargado.`;
      }

      const dia = DIAS_MAP[diaEncontrado];
      const bloquesDia = bloques.filter((b: any) => b.dia === dia);
      if (bloquesDia.length === 0) {
        return `El docente ${docente.apellidos}, ${docente.nombres} no tiene clases el ${diaEncontrado}.`;
      }

      const bloquesTexto = formatBloquesHorario(bloquesDia);
      return `Clases de ${docente.apellidos}, ${docente.nombres} el ${diaEncontrado}:\n${bloquesTexto}`;
    } catch {
      return 'No se pudo obtener la información de clases.';
    }
  };

  const handleDocentePdf = async (text: string): Promise<string | null> => {
    const name = extractDocenteName(text);
    if (!name && !text.includes('todos') && !text.includes('global')) return null;

    const periodoActivo = await getPeriodoActivo();
    if (!periodoActivo) return 'Advertencia: No existe un periodo académico configurado como activo.';

    if (text.includes('todos') || text.includes('global')) {
      try {
        const res = await reportesService.pdfGlobal(periodoActivo.id);
        descargarBlob(res.data, `horarios-global-${periodoActivo.nombre}.pdf`);
        return 'Descargando el reporte PDF global de todos los horarios.';
      } catch {
        return 'No se pudo generar el reporte PDF global.';
      }
    }

    const docente = await buscarDocente(name!);
    if (!docente) return `No se encontró un docente con el nombre "${name}".`;

    try {
      const res = await reportesService.pdfDocente(docente.id, periodoActivo.id);
      const nombreArchivo = `horario-${docente.apellidos}-${docente.nombres}.pdf`.replace(/\s+/g, '-');
      descargarBlob(res.data, nombreArchivo);
      return `Descargando el horario de ${docente.apellidos}, ${docente.nombres} en PDF.`;
    } catch {
      return `No se pudo generar el PDF para ${docente.apellidos}, ${docente.nombres}.`;
    }
  };

  const handleAmbientesDisponibles = async (): Promise<string> => {
    const periodoActivo = await getPeriodoActivo();
    if (!periodoActivo) return 'Advertencia: No existe un periodo académico configurado como activo.';

    try {
      const res = await ambientesService.disponibilidadGeneral(periodoActivo.id);
      const ambientes = res.data || res;
      if (!Array.isArray(ambientes) || ambientes.length === 0) {
        return 'No se encontraron ambientes registrados en el sistema.';
      }

      return `Información de ambientes:\n${ambientes.map((a: any) => {
        const nombre = a.nombre || a.ambiente?.nombre || `Ambiente #${a.id}`;
        const capacidad = a.capacidad || a.ambiente?.capacidad || '?';
        const ocupado = a.ocupado ? ' (ocupado)' : ' (disponible)';
        return `- ${nombre} (${capacidad} pers.)${ocupado}`;
      }).join('\n')}`;
    } catch {
      return 'No se pudo cargar la información de ambientes.';
    }
  };

  const handleCursosPorCiclo = async (text: string): Promise<string | null> => {
    try {
      const periodoActivo = await getPeriodoActivo();
      if (!periodoActivo) return 'Advertencia: No existe un periodo académico configurado como activo.';

      const ciclos = await periodosService.obtenerCiclosActivo();
      const ciclosList = ciclos.data || ciclos;

      if (ciclosList.length === 0) {
        return 'No hay ciclos disponibles para el periodo activo.';
      }

      let cicloSeleccionado = null;
      for (let i = 1; i <= 10; i++) {
        if (text.includes(`ciclo ${i}`) || text.includes(`${i} ciclo`)) {
          cicloSeleccionado = ciclosList.find((c: any) => c.numero === i);
          break;
        }
      }

      if (!cicloSeleccionado) {
        const ciclosDisponibles = ciclosList.map((c: any) => `Ciclo ${c.numero}`).join(', ');
        return `¿De qué ciclo quieres conocer los cursos? Los ciclos disponibles son: ${ciclosDisponibles}. Por favor, menciona el número del ciclo.`;
      }

      const cursosPorCiclo = await cargaHorariaService.obtenerCursosPorCiclo(periodoActivo.id, cicloSeleccionado.id);
      const cursosList = cursosPorCiclo.data || cursosPorCiclo;

      if (cursosList.length === 0) {
        return `No hay cursos asignados al Ciclo ${cicloSeleccionado.numero} en el periodo activo.`;
      }

      const nombresCursos = cursosList.map((c: any) => {
        const codigo = c.curso?.codigo || c.cursoCodigo || '';
        const nombre = c.curso?.nombre || c.cursoNombre || 'Curso sin nombre';
        return `- ${codigo ? codigo + ': ' : ''}${nombre}`;
      }).join('\n');

      return `Cursos del Ciclo ${cicloSeleccionado.numero}:\n${nombresCursos}`;
    } catch (err) {
      console.error('Error loading courses by cycle:', err);
      return 'No pude cargar la información de los cursos por ciclo.';
    }
  };

  const handleResumenGeneral = async (): Promise<string> => {
    try {
      const periodoActivo = await getPeriodoActivo();
      if (!periodoActivo) return 'Advertencia: No existe un periodo académico configurado como activo.';

      const ciclos = await periodosService.obtenerCiclosActivo();
      const ciclosList = ciclos.data || ciclos;

      const resumen = await estadisticasService.resumen(periodoActivo.id);
      const totalDocentes = resumen.data?.totalDocentes || 0;
      const totalCursos = resumen.data?.totalCursos || 0;

      return `Resumen general del periodo activo (${periodoActivo.nombre}):
- Total de ciclos: ${ciclosList.length}
- Total de docentes: ${totalDocentes}
- Total de cursos: ${totalCursos}`;
    } catch {
      return 'No pude cargar el resumen general del periodo.';
    }
  };

  const handleSecretariaQuery = async (text: string): Promise<string> => {
    if (matchesKeywords(text, ['horario de', 'horario del', 'clases de', 'clases del', 'horario docente'])) {
      const result = await handleDocenteSchedule(text);
      if (result) return result;
    }

    const dayResult = await handleDocenteScheduleByDay(text);
    if (dayResult) return dayResult;

    if (matchesKeywords(text, ['pdf de', 'pdf del', 'descargar horario', 'enviar horario'])) {
      const result = await handleDocentePdf(text);
      if (result) return result;
    }

    if (matchesKeywords(text, ['ambiente disponible', 'ambiente libre', 'aula libre', 'aula disponible', 'laboratorio disponible', 'que ambientes'])) {
      return await handleAmbientesDisponibles();
    }

    if (matchesKeywords(text, ['ciclo', 'cursos del ciclo', 'cursos por ciclo', 'cuales son los cursos del ciclo', 'dame los cursos del ciclo'])) {
      const result = await handleCursosPorCiclo(text);
      if (result) return result;
    }

    if (matchesKeywords(text, ['resumen', 'resumen general', 'estado general', 'como va el periodo', 'status del periodo', 'informacion general'])) {
      return await handleResumenGeneral();
    }

    if (matchesKeywords(text, ['falta', 'faltan', 'pendiente', 'pendientes', 'cargar horario', 'sin cargar', 'docentes pendientes', 'quien falta'])) {
      try {
        const periodoActivo = await getPeriodoActivo();
        const ventanas = await ventanasService.listar(periodoActivo?.id);
        const ventanasList = Array.isArray(ventanas) ? ventanas : ventanas.data || [];
        const pendientes = ventanasList.filter((v: any) => v.estado !== 'COMPLETADA');

        if (pendientes.length === 0) {
          return 'Estado óptimo: El 100% de la plana docente ha completado el registro de su carga horaria.';
        }

        const nombresPendientes = pendientes.flatMap((v: any) =>
          (v.atenciones || []).map((a: any) => {
            if (a.docente) return `- ${a.docente.apellidos}, ${a.docente.nombres}`;
            return `- Docente ID: ${a.id_docente || '?'}`;
          })
        ).join('\n');

        return `Los docentes que aún no han completado su horario son:\n${nombresPendientes}`;
      } catch (err) {
        console.error('Error loading windows:', err);
        return 'No pude cargar la información de las ventanas de atención.';
      }
    }

    if (matchesKeywords(text, ['ventana', 'ventanas', 'ventana de atencion', 'ventanas de atencion', 'estado de las ventanas'])) {
      try {
        const periodoActivo = await getPeriodoActivo();
        if (!periodoActivo) return 'Advertencia: No existe un periodo académico configurado como activo.';

        const ventanas = await ventanasService.listar(periodoActivo.id);
        const ventanasList = Array.isArray(ventanas) ? ventanas : ventanas.data || [];

        if (ventanasList.length === 0) {
          return 'No hay ventanas de atención configuradas para el periodo activo.';
        }

        const resumenVentanas = ventanasList.map((v: any) => {
          const estado = v.estado === 'COMPLETADA' ? 'Completada' :
                        v.estado === 'ACTIVA' ? 'Activa' :
                        v.estado === 'PENDIENTE' ? 'Pendiente' : v.estado;
          return `- Ventana ${v.id}: ${estado}`;
        }).join('\n');

        return `Estado de las ventanas de atención del periodo activo:\n${resumenVentanas}`;
      } catch {
        return 'No pude cargar la información de las ventanas de atención.';
      }
    }

    return '__GENERIC_FALLBACK__Módulo de gestión administrativa. Puede consultar docentes pendientes, estado de ventanas, horarios o disponibilidad de ambientes. Ingrese su requerimiento.';
  };

  // ============ DIRECTOR QUERY HANDLERS ============

  const handleDirectorQuery = async (text: string): Promise<string> => {
    if (matchesKeywords(text, ['ciclo', 'cursos del ciclo', 'cursos por ciclo', 'cuales son los cursos del ciclo', 'dame los cursos del ciclo'])) {
      const result = await handleCursosPorCiclo(text);
      if (result) return result;
    }

    if (matchesKeywords(text, ['resumen', 'resumen general', 'estado general', 'como va el periodo', 'status del periodo', 'informacion general'])) {
      return await handleResumenGeneral();
    }

    if (matchesKeywords(text, ['cuantos docentes', 'total docentes', 'numero de docentes', 'docentes registrados'])) {
      try {
        const periodoActivo = await getPeriodoActivo();
        if (!periodoActivo) return 'Advertencia: No existe un periodo académico configurado como activo.';
        const resumen = await estadisticasService.resumen(periodoActivo.id);
        const totalDocentes = resumen.data?.totalDocentes || 0;
        return `Hay ${totalDocentes} docentes registrados en el sistema.`;
      } catch {
        return 'No pude cargar el número de docentes.';
      }
    }

    if (matchesKeywords(text, ['cuantos cursos', 'total cursos', 'numero de cursos', 'cursos dictados'])) {
      try {
        const periodoActivo = await getPeriodoActivo();
        if (!periodoActivo) return 'Advertencia: No existe un periodo académico configurado como activo.';
        const resumen = await estadisticasService.resumen(periodoActivo.id);
        const totalCursos = resumen.data?.totalCursos || 0;
        return `Hay ${totalCursos} cursos dictados en el periodo activo.`;
      } catch {
        return 'No pude cargar el número de cursos.';
      }
    }

    return '__GENERIC_FALLBACK__Módulo de dirección académica. Puede solicitar los cursos por ciclo o un resumen consolidado del periodo vigente. Indique su requerimiento.';
  };

  // ============ MAIN PROCESSING ============

  const processMessage = async (userText: string) => {
    const normalizedText = normalizeText(userText);
    let response = '';

    try {
      if (role === 'DOCENTE') {
        response = await handleDocenteQuery(normalizedText);
      } else if (role === 'SECRETARIA' || role === 'ADMIN') {
        response = await handleSecretariaQuery(normalizedText);
      } else if (role === 'DIRECTOR') {
        response = await handleDirectorQuery(normalizedText);
      } else {
        response = 'No puedo identificar tu rol en el sistema. Por favor, inicia sesión nuevamente.';
      }

      if (response.startsWith('__GENERIC_FALLBACK__')) {
        const geminiResponse = await consultarGemini(normalizedText);
        if (geminiResponse) {
          response = geminiResponse;
        } else {
          response = response.replace('__GENERIC_FALLBACK__', '');
        }
      }
    } catch (err) {
      console.error('Error processing query:', err);
      response = 'Lo siento, ocurrió un error al procesar tu consulta. Por favor, intenta nuevamente más tarde.';
    }

    return response;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    const loadingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: loadingId, role: 'assistant', content: '', isLoading: true },
    ]);

    try {
      const response = await processMessage(text);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? { ...msg, content: response, isLoading: false }
            : msg
        )
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? { ...msg, content: 'Lo siento, ocurrió un error. Por favor, intenta nuevamente.', isLoading: false }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSugerenciaClick = (consulta: string) => {
    sendMessage(consulta);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-[1.5rem] bg-[#020C1B] dark:bg-[#D4AF37] text-[#D4AF37] dark:text-[#020C1B] shadow-[0_8px_30px_rgb(2,12,27,0.3)] dark:shadow-[0_8px_30px_rgba(212,175,55,0.3)] hover:scale-105 transition-all duration-300 group border border-[#D4AF37]/20 dark:border-transparent"
      >
        {isOpen ? (
          <X className="w-7 h-7 transition-transform duration-300" />
        ) : (
          <div className="relative">
            <Sparkles className="w-7 h-7 transition-transform duration-300 group-hover:rotate-12" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[400px] max-w-[92vw] h-[650px] max-h-[80vh] bg-white dark:bg-[#0A192F] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          
          <div className="relative px-6 py-5 bg-[#020C1B] flex items-center gap-4 shrink-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="relative z-10 w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div className="relative z-10 flex-1">
              <h3 className="font-black text-white text-lg tracking-tight">Asistente <span className="text-[#D4AF37]">UNT</span></h3>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Soporte de Sistema
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-transparent custom-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 max-w-[88%]',
                  message.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-auto shadow-sm',
                    message.role === 'user'
                      ? 'bg-white dark:bg-white/10'
                      : 'bg-[#020C1B] dark:bg-[#D4AF37]'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-[#D4AF37] dark:text-[#020C1B]" />
                  )}
                </div>
                <div
                  className={cn(
                    'p-4 text-[13px] leading-relaxed whitespace-pre-line shadow-sm',
                    message.role === 'user'
                      ? 'bg-[#020C1B] text-white rounded-[1.5rem] rounded-br-sm dark:bg-white/10 dark:text-white'
                      : 'bg-white text-gray-700 border border-gray-100 rounded-[1.5rem] rounded-bl-sm dark:bg-[#112240] dark:border-white/5 dark:text-gray-300'
                  )}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                      <span className="font-bold text-gray-400 text-xs uppercase tracking-wider">Analizando</span>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {sugerencias.length > 0 && (
            <div className="px-5 pb-3 pt-3 bg-white dark:bg-[#0A192F] border-t border-gray-100 dark:border-white/10 shrink-0">
              <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                {sugerencias.map((s) => (
                  <button
                    key={s.texto}
                    type="button"
                    onClick={() => handleSugerenciaClick(s.consulta)}
                    className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-[#020C1B] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#020C1B] dark:hover:border-transparent text-slate-600 dark:text-gray-400 transition-colors"
                  >
                    {s.texto}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className="p-4 bg-white dark:bg-[#0A192F] shrink-0"
          >
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-1.5 rounded-[1.5rem] border border-gray-200 dark:border-white/10 focus-within:ring-2 focus-within:ring-[#020C1B]/20 dark:focus-within:ring-[#D4AF37]/30 transition-all">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Consultar al asistente..."
                className="flex-1 px-4 py-3 bg-transparent focus:outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-400 font-medium"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isProcessing}
                className="w-12 h-12 flex items-center justify-center rounded-[1.2rem] bg-[#020C1B] dark:bg-[#D4AF37] text-white dark:text-[#020C1B] disabled:opacity-50 hover:scale-105 transition-transform shrink-0"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 ml-1" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
