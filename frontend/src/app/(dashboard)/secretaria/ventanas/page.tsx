'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { periodosService } from '@/services/periodos.service';
import { ventanasService } from '@/services/ventanas.service';
import { horariosService } from '@/services/horarios.service';
import { Boton } from '@/components/ui/Boton';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utilidades';
import { Edit2, Check, Clock, Calendar as CalendarIcon, X, AlertCircle, Trash2, RotateCcw, Send, Power, CalendarClock } from 'lucide-react';
import { ModalConfirmacion } from '@/components/ui/ModalConfirmacion';

const formatearFecha = (fecha?: string | Date) => {
  if (!fecha) return '';
  const f = new Date(fecha);
  const y = f.getUTCFullYear();
  const m = String(f.getUTCMonth() + 1).padStart(2, '0');
  const d = String(f.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function EstadoBadge({ razon }: { razon: string }) {
  const map: Record<string, { icon: string; label: string; cls: string }> = {
    EN_TURNO:            { icon: '🟢', label: 'En turno ahora',      cls: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 shadow-sm' },
    AUN_NO_ES_SU_TURNO:  { icon: '⏳', label: 'Próximo turno',       cls: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400' },
    TURNO_VENCIDO:       { icon: '⌛', label: 'Turno vencido',       cls: 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400' },
    SIN_ASIGNACION:      { icon: '❓', label: 'Sin asignación',      cls: 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400' },
    CANCELADO:           { icon: '✖', label: 'Cancelado',            cls: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400' },
    SIN_RESTRICCION:     { icon: '✓', label: 'Sin restricción',      cls: 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400' },
  };
  const c = map[razon] || { icon: '?', label: razon, cls: 'bg-gray-50 border-gray-200 text-gray-500' };
  return (
    <span className={cn('flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-md border whitespace-nowrap uppercase tracking-wider', c.cls)}>
      <span>{c.icon}</span>{c.label}
    </span>
  );
}

export default function VentanasSecretariaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('13:00');
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);
  const [mostrarEdicion, setMostrarEdicion] = useState(false);
  const [turnoAEditar, setTurnoAEditar] = useState<any>(null);
  const [confirmacion, setConfirmacion] = useState<{
    titulo: string;
    mensaje: string;
    tipo: 'peligro' | 'pregunta' | 'info';
    onConfirm: () => void;
    textoConfirmar?: string;
  } | null>(null);
  const [edicionTurno, setEdicionTurno] = useState({
    fecha: '',
    horaInicio: '',
    horaFin: '',
  });

  const { data: periodos, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-ventanas'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: periodoActivo } = useQuery({
    queryKey: ['periodo-activo-ventanas'],
    queryFn: () => periodosService.activo().then((res) => res.data),
  });

  useEffect(() => {
    if (!idPeriodo && periodoActivo?.id) setIdPeriodo(periodoActivo.id);
    if (periodoActivo && !fechaInicio) setFechaInicio(formatearFecha(periodoActivo.fecha_inicio));
    if (periodoActivo && !fechaFin) setFechaFin(formatearFecha(periodoActivo.fecha_fin));
    if (!idPeriodo && !periodoActivo?.id && (periodos || []).length > 0) setIdPeriodo(periodos[0].id);
  }, [idPeriodo, periodoActivo, fechaInicio, fechaFin, periodos]);

  const { data: ventanas, isLoading: ventanasLoading } = useQuery({
    queryKey: ['ventanas-secretaria', idPeriodo],
    queryFn: () => ventanasService.listar(idPeriodo as number).then((res) => res.data),
    enabled: !!idPeriodo,
    refetchInterval: 30_000,
  });

  const actualizarMutation = useMutation({
    mutationFn: () =>
      ventanasService.actualizarHorario({ idPeriodo: idPeriodo as number, fechaInicio, fechaFin, horaInicio, horaFin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventanas-secretaria', idPeriodo] });
      setToast({ mensaje: 'Horario de atención actualizado', tipo: 'exito' });
      setMostrarEdicion(false);
      setConfirmacion(null);
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al actualizar', tipo: 'error' });
      setConfirmacion(null);
    },
  });

  const desactivarMutation = useMutation({
    mutationFn: () => ventanasService.desactivar(idPeriodo as number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventanas-secretaria', idPeriodo] });
      setToast({ mensaje: 'Ventanas desactivadas', tipo: 'exito' });
      setMostrarEdicion(false);
      setConfirmacion(null);
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al desactivar', tipo: 'error' });
      setConfirmacion(null);
    },
  });

  const enviarCorreosMutation = useMutation({
    mutationFn: () => ventanasService.enviarCorreos(idPeriodo as number),
    onSuccess: (res) => {
      const enviados = res.data?.enviados ?? 0;
      const errores = res.data?.errores ?? 0;
      setToast({
        mensaje: `Correos enviados: ${enviados}${errores ? `, errores: ${errores}` : ''}`,
        tipo: errores > 0 ? 'error' : 'exito',
      });
      setConfirmacion(null);
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al enviar correos', tipo: 'error' });
      setConfirmacion(null);
    },
  });

  const resetearHorariosMutation = useMutation({
    mutationFn: () => horariosService.resetear(idPeriodo as number),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['ventanas-secretaria', idPeriodo] });
      setToast({ mensaje: res.data?.mensaje || 'Horarios reseteados correctamente', tipo: 'exito' });
      setConfirmacion(null);
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al resetear horarios', tipo: 'error' });
      setConfirmacion(null);
    },
  });

  const actualizarTurnoMutation = useMutation({
    mutationFn: () =>
      ventanasService.actualizarTurno({
        idVentana: turnoAEditar.idVentana,
        idDocente: turnoAEditar.idDocente,
        ...edicionTurno,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventanas-secretaria', idPeriodo] });
      setToast({ mensaje: 'Turno de docente actualizado correctamente', tipo: 'exito' });
      setTurnoAEditar(null);
    },
    onError: (error: any) =>
      setToast({ mensaje: error.response?.data?.error || 'Error al actualizar turno', tipo: 'error' }),
  });

  const desactivarTurnoMutation = useMutation({
    mutationFn: (datos: { idVentana: number; idDocente: number }) =>
      ventanasService.desactivarTurno(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventanas-secretaria', idPeriodo] });
      setToast({ mensaje: 'Turno desactivado correctamente', tipo: 'exito' });
      setConfirmacion(null);
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al desactivar turno', tipo: 'error' });
      setConfirmacion(null);
    },
  });

  // Flatten ventanas → filas de docente con estado de tiempo real calculado
  const filas = useMemo(() => {
    const now = new Date();
    const lista: any[] = [];
    (ventanas || []).filter((ventana: any) => ventana.estado !== 'CANCELADO').forEach((ventana: any) => {
      const vFecha = new Date(ventana.fecha);
      const y = vFecha.getUTCFullYear();
      const m = vFecha.getUTCMonth();
      const d = vFecha.getUTCDate();
      
      const [hIni, mIni] = ventana.hora_inicio.split(':').map(Number);
      const [hFin, mFin] = ventana.hora_fin.split(':').map(Number);
      
      const fechaHoraInicio = new Date(y, m, d, hIni, mIni, 0);
      const fechaHoraFin = new Date(y, m, d, hFin, mFin, 0);

      const fechaStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      let razonTiempo: string;
      if (now < fechaHoraInicio) razonTiempo = 'AUN_NO_ES_SU_TURNO';
      else if (now > fechaHoraFin) razonTiempo = 'TURNO_VENCIDO';
      else razonTiempo = 'EN_TURNO';

      (ventana.atenciones || []).forEach((atencion: any) => {
        lista.push({
          id: `${ventana.id}-${atencion.id_docente}`,
          idVentana: ventana.id,
          idDocente: atencion.id_docente,
          orden: ventana.orden,
          docente: `${atencion.docente.nombres} ${atencion.docente.apellidos}`,
          categoria: ventana.categoria,
          modalidad: ventana.modalidad,
          fecha: fechaStr,
          hora: `${ventana.hora_inicio} – ${ventana.hora_fin}`,
          horaInicio: ventana.hora_inicio,
          horaFin: ventana.hora_fin,
          estadoAtencion: atencion.estado,
          razonTiempo,
          cargoHorario: atencion.cargoHorario,
        });
      });
    });
    return lista.sort((a, b) => {
      const ordMod: Record<string, number> = { NOMBRADO: 0, CONTRATADO: 1 };
      const ordCat: Record<string, number> = { PRINCIPAL: 0, ASOCIADO: 1, AUXILIAR: 2, JEFE_PRACTICA: 3 };
      const mod = (ordMod[a.modalidad] ?? 9) - (ordMod[b.modalidad] ?? 9);
      if (mod !== 0) return mod;
      return (ordCat[a.categoria] ?? 9) - (ordCat[b.categoria] ?? 9);
    });
  }, [ventanas]);

  const ventanasActivas = useMemo(
    () => (ventanas || []).filter((ventana: any) => ventana.estado !== 'CANCELADO'),
    [ventanas]
  );

  const totalVentanas = ventanasActivas.length;
  const totalDocentes = filas.length;
  const enTurnoAhora = filas.filter((f) => f.razonTiempo === 'EN_TURNO').length;
  const completados = filas.filter((f) => f.estadoAtencion === 'COMPLETADO').length;

  const rangoVentana = useMemo(() => {
    if (ventanasActivas.length === 0) return null;
    const fechas = ventanasActivas.map((v: any) => new Date(v.fecha));
    const fechaMin = new Date(Math.min(...fechas.map((f: Date) => f.getTime())));
    const fechaMax = new Date(Math.max(...fechas.map((f: Date) => f.getTime())));
    const horaMin = ventanasActivas.reduce((acc: string, v: any) => v.hora_inicio < acc ? v.hora_inicio : acc, '23:59');
    const horaMax = ventanasActivas.reduce((acc: string, v: any) => v.hora_fin > acc ? v.hora_fin : acc, '00:00');
    return { fechaInicio: formatearFecha(fechaMin), fechaFin: formatearFecha(fechaMax), horaInicio: horaMin, horaFin: horaMax };
  }, [ventanasActivas]);

  useEffect(() => {
    if (rangoVentana && !mostrarEdicion) {
      setFechaInicio(rangoVentana.fechaInicio);
      setFechaFin(rangoVentana.fechaFin);
      setHoraInicio(rangoVentana.horaInicio);
      setHoraFin(rangoVentana.horaFin);
    }
  }, [rangoVentana, mostrarEdicion]);

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Dossier Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#0A192F]/12 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A192F]/40 dark:text-white/40 mb-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Gestión de Accesos</span>
          </div>
          <h1 className="font-serif text-[2rem] text-[#0A192F] dark:text-white tracking-tight leading-tight">Ventanas de Atención</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-end shrink-0">
          <div className="w-full sm:w-72">
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
          <Boton onClick={() => router.push('/secretaria/ventanas/crear')} className="whitespace-nowrap h-[52px] px-6 rounded-2xl bg-[#D4AF37] hover:bg-[#b08d28] text-[#0A192F] font-bold shadow-lg">
            + Crear ventana
          </Boton>
        </div>
      </div>

      {/* Stats row */}
      {totalVentanas > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Ventanas configuradas', value: totalVentanas, color: 'text-gray-800 dark:text-white' },
            { label: 'Docentes con turno',    value: totalDocentes, color: 'text-gray-800 dark:text-white' },
            { label: 'En turno ahora',        value: enTurnoAhora,  color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Turnos Completados',    value: completados,   color: 'text-gray-500 dark:text-gray-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-[#0A192F] rounded-3xl border border-gray-100 dark:border-[#112240] p-6 shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#003366]/5 dark:bg-white/5 rounded-full transition-transform group-hover:scale-150 duration-700" />
              <p className={cn('text-4xl font-extrabold relative z-10', color)}>{value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-2 relative z-10">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Ventana actual config */}
      {totalVentanas > 0 && rangoVentana && (
        <div className="bg-white dark:bg-[#0A192F] rounded-[2.5rem] border border-gray-100 dark:border-[#112240] shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 dark:border-[#112240] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="font-black text-gray-800 dark:text-white flex items-center gap-3">
              <span className="w-1.5 h-6 rounded-full bg-[#003366] dark:bg-[#D4AF37] inline-block shadow-sm" />
              Parámetros Globales de Acceso
            </h2>
            <div className="flex flex-wrap gap-2">
              <Boton variante="secundario" className="rounded-xl font-bold" onClick={() => setMostrarEdicion((prev) => !prev)}>
                {mostrarEdicion ? 'Ocultar Edición' : 'Editar Horario General'}
              </Boton>
              <Boton
                variante="peligro"
                className="rounded-xl font-bold"
                onClick={() => {
                  if (!idPeriodo) return;
                  setConfirmacion({
                    titulo: '¿Desactivar todas las ventanas?',
                    mensaje: 'Esta acción invalidará todos los turnos actuales. Los docentes ya no podrán acceder al sistema hasta que se genere una nueva ventana.',
                    tipo: 'peligro',
                    textoConfirmar: 'Desactivar ahora',
                    onConfirm: () => desactivarMutation.mutate(),
                  });
                }}
                disabled={!idPeriodo || desactivarMutation.isPending}
              >
                <Power className="w-4 h-4 mr-2" />
                {desactivarMutation.isPending ? 'Desactivando...' : 'Desactivar Accesos'}
              </Boton>
              <Boton
                variante="peligro"
                onClick={() => {
                  if (!idPeriodo) return;
                  setConfirmacion({
                    titulo: '¿RESETEAR TODOS LOS HORARIOS?',
                    mensaje: '⚠️ ¡ALERTA CRÍTICA! Esta acción ELIMINARÁ PERMANENTEMENTE todos los bloques horarios registrados en este periodo. No se puede deshacer.',
                    tipo: 'peligro',
                    textoConfirmar: 'SÍ, RESETEAR TODO',
                    onConfirm: () => resetearHorariosMutation.mutate(),
                  });
                }}
                disabled={!idPeriodo || resetearHorariosMutation.isPending}
                className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {resetearHorariosMutation.isPending ? 'Reseteando...' : 'Reset Total'}
              </Boton>
            </div>
          </div>
          <div className="px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-gray-50 dark:bg-[#020C1B] p-6 rounded-2xl border border-gray-100 dark:border-[#112240]">
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mb-1.5">Inicio del Proceso</p>
                <p className="font-bold text-gray-800 dark:text-white text-lg">{rangoVentana.fechaInicio}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mb-1.5">Fin del Proceso</p>
                <p className="font-bold text-gray-800 dark:text-white text-lg">{rangoVentana.fechaFin}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mb-1.5">Apertura Diaria</p>
                <p className="font-bold text-gray-800 dark:text-white text-lg">{rangoVentana.horaInicio}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mb-1.5">Cierre Diario</p>
                <p className="font-bold text-gray-800 dark:text-white text-lg">{rangoVentana.horaFin}</p>
              </div>
            </div>

            {mostrarEdicion && (
              <div className="mt-8 pt-8 border-t border-gray-100 dark:border-[#112240] grid grid-cols-1 md:grid-cols-5 gap-6 items-end animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="flex flex-col gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Nueva Fecha Inicio
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                    className="rounded-xl border border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] px-4 py-3 text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-[#003366] dark:focus:border-[#D4AF37] transition-all" />
                </label>
                <label className="flex flex-col gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Nueva Fecha Fin
                  <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                    className="rounded-xl border border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] px-4 py-3 text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-[#003366] dark:focus:border-[#D4AF37] transition-all" />
                </label>
                <label className="flex flex-col gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Hora Apertura
                  <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)}
                    className="rounded-xl border border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] px-4 py-3 text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-[#003366] dark:focus:border-[#D4AF37] transition-all" />
                </label>
                <label className="flex flex-col gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Hora Cierre
                  <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)}
                    className="rounded-xl border border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] px-4 py-3 text-sm font-bold text-gray-800 dark:text-white outline-none focus:border-[#003366] dark:focus:border-[#D4AF37] transition-all" />
                </label>
                <Boton className="h-[52px] rounded-xl font-bold bg-[#003366] hover:bg-[#002244] dark:bg-[#D4AF37] dark:hover:bg-[#b08d28] dark:text-[#0A192F]" onClick={() => actualizarMutation.mutate()} disabled={actualizarMutation.isPending}>
                  {actualizarMutation.isPending ? 'Procesando...' : 'Aplicar Cambios'}
                </Boton>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabla de turnos */}
      <div className="bg-white dark:bg-[#0A192F] rounded-[2.5rem] border border-gray-100 dark:border-[#112240] shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 dark:border-[#112240]">
          <h2 className="font-black text-gray-800 dark:text-white flex items-center gap-3">
            <span className="w-1.5 h-6 rounded-full bg-[#D4AF37] inline-block shadow-sm" />
            Padrón de Turnos
            <span className="ml-2 px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Jerarquía: Modalidad → Categoría → Antigüedad</span>
          </h2>
        </div>

        {ventanasLoading ? (
          <div className="p-12 flex justify-center"><SpinnerCarga /></div>
        ) : filas.length === 0 ? (
          <div className="px-8 py-20 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-3xl mb-6 shadow-inner">📅</div>
            <p className="text-xl text-gray-800 dark:text-white font-black mb-2">No hay ventanas configuradas</p>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">Debes crear una ventana base para comenzar a asignar los accesos al sistema.</p>
            <Boton onClick={() => router.push('/secretaria/ventanas/crear')} className="px-8 rounded-xl font-bold">
              Configurar Primera Ventana
            </Boton>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-[#020C1B] border-b border-gray-200 dark:border-[#112240]">
                  <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">#</th>
                  <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Docente</th>
                  <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Condición</th>
                  <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Asignación Temporal</th>
                  <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Estado Acceso</th>
                  <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Progreso</th>
                  <th className="px-8 py-5 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#112240]">
                {filas.map((fila) => (
                  <tr key={fila.id} className={cn(
                    'transition-colors group',
                    fila.razonTiempo === 'EN_TURNO' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'hover:bg-gray-50/50 dark:hover:bg-white/5'
                  )}>
                    <td className="px-8 py-5 text-gray-400 dark:text-gray-500 text-xs font-black">{fila.orden}</td>
                    <td className="px-8 py-5 font-black text-gray-700 dark:text-white">{fila.docente}</td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded uppercase tracking-wider">
                          {fila.modalidad}
                        </span>
                        <span className="text-[9px] font-bold text-[#003366] dark:text-[#D4AF37] bg-[#003366]/10 dark:bg-white/5 border border-[#003366]/20 dark:border-white/10 px-2 py-0.5 rounded uppercase tracking-wider">
                          {fila.categoria}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{fila.fecha}</span>
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 tracking-widest">{fila.hora}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <EstadoBadge razon={fila.razonTiempo} />
                    </td>
                    <td className="px-8 py-5">
                      {fila.cargoHorario ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-md border border-emerald-100 dark:border-emerald-800 uppercase tracking-widest">
                          <Check className="w-3 h-3" /> CARGADO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-md border border-amber-100 dark:border-amber-800 uppercase tracking-widest">
                          <Clock className="w-3 h-3" /> PENDIENTE
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setTurnoAEditar(fila);
                            setEdicionTurno({
                              fecha: fila.fecha,
                              horaInicio: fila.horaInicio,
                              horaFin: fila.horaFin,
                            });
                          }}
                          className="p-2 text-gray-400 hover:text-[#003366] hover:bg-gray-100 dark:hover:text-[#D4AF37] dark:hover:bg-white/10 rounded-xl transition-all"
                          title="Reprogramar Turno"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmacion({
                              titulo: '¿Desactivar turno individual?',
                              mensaje: `Se cancelará el turno asignado a ${fila.docente}.`,
                              tipo: 'peligro',
                              textoConfirmar: 'Confirmar Cancelación',
                              onConfirm: () => desactivarTurnoMutation.mutate({
                                idVentana: fila.idVentana,
                                idDocente: fila.idDocente,
                              }),
                            });
                          }}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                          title="Anular Turno"
                          disabled={desactivarTurnoMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmacion && (
        <ModalConfirmacion
          isOpen={!!confirmacion}
          onClose={() => setConfirmacion(null)}
          onConfirm={confirmacion.onConfirm}
          titulo={confirmacion.titulo}
          mensaje={confirmacion.mensaje}
          tipo={confirmacion.tipo}
          textoConfirmar={confirmacion.textoConfirmar}
          isLoading={
            enviarCorreosMutation.isPending || 
            desactivarMutation.isPending || 
            resetearHorariosMutation.isPending || 
            desactivarTurnoMutation.isPending
          }
        />
      )}

      <Modal
        isOpen={!!turnoAEditar}
        onClose={() => setTurnoAEditar(null)}
        titulo="Reprogramación de Turno"
        className="max-w-md bg-white dark:bg-[#0A192F] border-gray-100 dark:border-[#112240]"
      >
        {turnoAEditar && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#020C1B] border border-gray-200 dark:border-[#112240] flex items-start gap-4">
              <div className="p-2 bg-white dark:bg-[#0A192F] rounded-xl shadow-sm border border-gray-100 dark:border-[#112240]">
                <CalendarClock className="w-5 h-5 text-[#003366] dark:text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-800 dark:text-white">{turnoAEditar.docente}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                  {turnoAEditar.modalidad} — {turnoAEditar.categoria}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
                  Nueva Fecha Asignada
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={edicionTurno.fecha}
                    onChange={(e) => setEdicionTurno({ ...edicionTurno, fecha: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#020C1B] border border-gray-200 dark:border-[#112240] rounded-xl text-sm font-bold text-gray-700 dark:text-white focus:ring-4 focus:ring-[#003366]/10 dark:focus:ring-[#D4AF37]/10 focus:border-[#003366] dark:focus:border-[#D4AF37] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
                    Hora Apertura
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      value={edicionTurno.horaInicio}
                      onChange={(e) => setEdicionTurno({ ...edicionTurno, horaInicio: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#020C1B] border border-gray-200 dark:border-[#112240] rounded-xl text-sm font-bold text-gray-700 dark:text-white focus:ring-4 focus:ring-[#003366]/10 dark:focus:ring-[#D4AF37]/10 focus:border-[#003366] dark:focus:border-[#D4AF37] transition-all outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
                    Hora Cierre
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="time"
                      value={edicionTurno.horaFin}
                      onChange={(e) => setEdicionTurno({ ...edicionTurno, horaFin: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#020C1B] border border-gray-200 dark:border-[#112240] rounded-xl text-sm font-bold text-gray-700 dark:text-white focus:ring-4 focus:ring-[#003366]/10 dark:focus:ring-[#D4AF37]/10 focus:border-[#003366] dark:focus:border-[#D4AF37] transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Boton
                variante="borde"
                onClick={() => setTurnoAEditar(null)}
                className="flex-1 rounded-xl font-bold"
              >
                Cancelar Operación
              </Boton>
              <Boton
                onClick={() => actualizarTurnoMutation.mutate()}
                disabled={actualizarTurnoMutation.isPending}
                className="flex-1 rounded-xl font-bold bg-[#003366] hover:bg-[#002244] dark:bg-[#D4AF37] dark:hover:bg-[#b08d28] dark:text-[#0A192F]"
              >
                {actualizarTurnoMutation.isPending ? 'Procesando...' : 'Guardar Turno'}
              </Boton>
            </div>
          </div>
        )}
      </Modal>

      {toast && <NotificacionToast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
}
