'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { periodosService } from '@/services/periodos.service';
import { ventanasService } from '@/services/ventanas.service';
import { Selector } from '@/components/ui/Selector';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { ArrowLeft, Calendar, Clock, Layout, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utilidades';
import { ModalConfirmacion } from '@/components/ui/ModalConfirmacion';

const formatearFecha = (fecha?: string | Date) => {
  if (!fecha) return '';
  const f = new Date(fecha);
  const y = f.getUTCFullYear();
  const m = String(f.getUTCMonth() + 1).padStart(2, '0');
  const d = String(f.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const obtenerHoy = () => {
  const f = new Date();
  const y = f.getFullYear();
  const m = String(f.getMonth() + 1).padStart(2, '0');
  const d = String(f.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const obtenerEnDosDias = () => {
  const f = new Date();
  f.setDate(f.getDate() + 2);
  const y = f.getFullYear();
  const m = String(f.getMonth() + 1).padStart(2, '0');
  const d = String(f.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function CrearVentanaSecretariaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [fechaInicio, setFechaInicio] = useState(obtenerHoy());
  const [fechaFin, setFechaFin] = useState(obtenerEnDosDias());
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('13:00');
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const { data: periodos, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-ventanas-crear'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: periodoActivo } = useQuery({
    queryKey: ['periodo-activo-ventanas-crear'],
    queryFn: () => periodosService.activo().then((res) => res.data),
  });

  const { data: ventanaActiva } = useQuery({
    queryKey: ['ventana-activa-crear', idPeriodo],
    queryFn: () => ventanasService.obtenerActiva(idPeriodo as number).then((res) => res.data),
    enabled: !!idPeriodo,
  });

  useEffect(() => {
    if (!idPeriodo && periodoActivo?.id) {
      setIdPeriodo(periodoActivo.id);
    }
    if (periodoActivo && !fechaInicio) {
      setFechaInicio(formatearFecha(periodoActivo.fecha_inicio));
    }
    if (periodoActivo && !fechaFin) {
      setFechaFin(formatearFecha(periodoActivo.fecha_fin));
    }
    if (!idPeriodo && !periodoActivo?.id && (periodos || []).length > 0) {
      setIdPeriodo(periodos[0].id);
    }
  }, [idPeriodo, periodoActivo, fechaInicio, fechaFin, periodos]);

  const crearMutation = useMutation({
    mutationFn: () =>
      ventanasService.generarHorario({
        idPeriodo: idPeriodo as number,
        fechaInicio,
        fechaFin,
        horaInicio,
        horaFin,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventanas-secretaria', idPeriodo] });
      queryClient.invalidateQueries({ queryKey: ['ventana-activa-crear', idPeriodo] });
      router.replace('/dashboard/secretaria/ventanas');
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al generar horario', tipo: 'error' });
      setMostrarConfirmacion(false);
    },
  });

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-20">
      {/* Header Estilo Classroom */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#0b1f3a] via-[#123b6d] to-[#0f4c81] px-10 py-12 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-white/90">
              <Sparkles className="w-3.5 h-3.5" />
              Gestión de Turnos
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Crear Ventana de Atención</h1>
            <p className="text-lg text-white/70 max-w-xl">
              Define los parámetros para generar los turnos automáticos de selección de horarios para los docentes.
            </p>
          </div>

          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 transition-all font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 animate-in slide-in-from-bottom-4 duration-700">
        
        {/* Card Principal de Configuración */}
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200/60 p-10 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Periodo */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-1">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Layout className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Periodo Académico</p>
              </div>
              <Selector
                label=""
                opciones={[
                  { valor: '', etiqueta: 'Seleccionar periodo' },
                  ...(periodos || []).map((p: any) => ({ valor: String(p.id), etiqueta: p.nombre })),
                ]}
                value={idPeriodo?.toString() || ''}
                onChange={(e) => setIdPeriodo(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all h-14 font-bold text-slate-700"
              />
            </div>

            {/* Fechas */}
            <div className="space-y-4 md:col-span-1 lg:col-span-1">
              <div className="flex items-center gap-3 ml-1">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rango de Fechas</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase pointer-events-none group-focus-within:text-emerald-500 transition-colors">Inicio</span>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-14 pr-4 py-3.5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none h-14"
                  />
                </div>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase pointer-events-none group-focus-within:text-emerald-500 transition-colors">Fin</span>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-14 pr-4 py-3.5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none h-14"
                  />
                </div>
              </div>
            </div>

            {/* Horas */}
            <div className="space-y-4 md:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 ml-1">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horario Diario de Atención</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase pointer-events-none group-focus-within:text-amber-500 transition-colors">Desde</span>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-14 pr-4 py-3.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all outline-none h-14"
                  />
                </div>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase pointer-events-none group-focus-within:text-amber-500 transition-colors">Hasta</span>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-14 pr-4 py-3.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all outline-none h-14"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium ml-1">
                Los turnos se generarán automáticamente dentro de este rango horario para cada día del periodo.
              </p>
            </div>
          </div>

          {ventanaActiva && (
            <div className="flex items-start gap-5 p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] animate-in zoom-in-95">
              <div className="p-4 bg-white rounded-2xl text-amber-500 shadow-sm shrink-0">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-black text-amber-900 tracking-tight">Ventana de Atención Activa</p>
                <p className="text-sm text-amber-800/70 leading-relaxed font-medium">
                  El sistema ha detectado una ventana de atención vigente para este periodo. Para garantizar la integridad de los turnos ya asignados, no se permite la creación de una nueva ventana simultánea.
                </p>
              </div>
            </div>
          )}

          <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-inner">
                <Layout className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado del Proceso</p>
                <p className={cn(
                  "text-base font-black tracking-tight",
                  ventanaActiva ? "text-amber-600" : "text-emerald-600"
                )}>
                  {ventanaActiva ? 'Acción Bloqueada' : 'Listo para Procesar'}
                </p>
              </div>
            </div>

            <div className="flex gap-4 w-full sm:w-auto">
              <button
                onClick={() => setMostrarConfirmacion(true)}
                disabled={
                  !idPeriodo ||
                  !fechaInicio ||
                  !fechaFin ||
                  !horaInicio ||
                  !horaFin ||
                  crearMutation.isPending ||
                  !!ventanaActiva
                }
                className={cn(
                  "flex-1 sm:flex-none px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3",
                  ventanaActiva || !idPeriodo 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-[#0f4c81] text-white hover:bg-[#0b1f3a] shadow-blue-900/20"
                )}
              >
                {crearMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generar Ventanas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ModalConfirmacion
        isOpen={mostrarConfirmacion}
        onClose={() => setMostrarConfirmacion(false)}
        onConfirm={() => crearMutation.mutate()}
        titulo="¿Generar nuevas ventanas?"
        mensaje="Esta acción creará automáticamente los turnos de atención para todos los docentes habilitados en este periodo académico."
        tipo="pregunta"
        textoConfirmar="Generar ahora"
        textoCancelar="Revisar datos"
        isLoading={crearMutation.isPending}
      />

      {toast && (
        <NotificacionToast 
          mensaje={toast.mensaje} 
          tipo={toast.tipo === 'exito' ? 'success' : 'error'} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
