'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { periodosService } from '@/services/periodos.service';
import { ventanasService } from '@/services/ventanas.service';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { ArrowLeft, Calendar, Clock, Layout, Sparkles, AlertCircle, HelpCircle, CalendarClock } from 'lucide-react';
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
      router.replace('/secretaria/ventanas');
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al generar horario', tipo: 'error' });
      setMostrarConfirmacion(false);
    },
  });

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-20">
      {/* Dossier Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#0A192F]/12 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A192F]/40 dark:text-white/40 mb-1.5">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Gestión de Accesos</span>
          </div>
          <h1 className="font-serif text-[2rem] text-[#0A192F] dark:text-white tracking-tight leading-tight">Crear Ventana de Atención</h1>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#0A192F]/15 dark:border-white/15 text-sm font-bold text-[#0A192F]/60 dark:text-white/50 hover:text-[#0A192F] dark:hover:text-white hover:border-[#0A192F]/30 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 animate-in slide-in-from-bottom-4 duration-700">
        
        {/* Card Principal de Configuración */}
        <div className="bg-white dark:bg-[#0A192F] rounded-2xl shadow-xl border border-gray-100 dark:border-[#112240] p-10 space-y-12 relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-gray-50/50 dark:bg-white/5 rounded-full transition-transform group-hover:scale-150 duration-700 pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Periodo */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-1">
                <div className="p-2 bg-[#003366]/5 dark:bg-[#003366]/30 border border-[#003366]/10 dark:border-[#003366]/50 rounded-xl">
                  <Layout className="w-4 h-4 text-[#003366] dark:text-[#D4AF37]" />
                </div>
                <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Periodo Lectivo</p>
              </div>
              <div className="h-14">
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

            {/* Fechas */}
            <div className="space-y-4 md:col-span-1 lg:col-span-1">
              <div className="flex items-center gap-3 ml-1">
                <div className="p-2 bg-[#003366]/5 dark:bg-[#003366]/30 border border-[#003366]/10 dark:border-[#003366]/50 rounded-xl">
                  <Calendar className="w-4 h-4 text-[#003366] dark:text-[#D4AF37]" />
                </div>
                <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Fechas del Proceso</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="relative group/input">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400 uppercase pointer-events-none group-focus-within/input:text-[#003366] dark:group-focus-within/input:text-[#D4AF37] transition-colors">Inicio</span>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 dark:border-[#112240] bg-gray-50/50 dark:bg-[#020C1B] pl-14 pr-4 py-3.5 text-xs font-bold text-gray-800 dark:text-white focus:bg-white dark:focus:bg-[#0A192F] focus:ring-4 focus:ring-[#003366]/10 dark:focus:ring-[#D4AF37]/10 focus:border-[#003366] dark:focus:border-[#D4AF37] transition-all outline-none h-14"
                  />
                </div>
                <div className="relative group/input">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400 uppercase pointer-events-none group-focus-within/input:text-[#003366] dark:group-focus-within/input:text-[#D4AF37] transition-colors">Fin</span>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 dark:border-[#112240] bg-gray-50/50 dark:bg-[#020C1B] pl-14 pr-4 py-3.5 text-xs font-bold text-gray-800 dark:text-white focus:bg-white dark:focus:bg-[#0A192F] focus:ring-4 focus:ring-[#003366]/10 dark:focus:ring-[#D4AF37]/10 focus:border-[#003366] dark:focus:border-[#D4AF37] transition-all outline-none h-14"
                  />
                </div>
              </div>
            </div>

            {/* Horas */}
            <div className="space-y-4 md:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 ml-1">
                <div className="p-2 bg-[#003366]/5 dark:bg-[#003366]/30 border border-[#003366]/10 dark:border-[#003366]/50 rounded-xl">
                  <Clock className="w-4 h-4 text-[#003366] dark:text-[#D4AF37]" />
                </div>
                <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Rango Diario de Atención</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group/input">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400 uppercase pointer-events-none group-focus-within/input:text-[#003366] dark:group-focus-within/input:text-[#D4AF37] transition-colors">Apertura</span>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 dark:border-[#112240] bg-gray-50/50 dark:bg-[#020C1B] pl-[4.5rem] pr-4 py-3.5 text-sm font-bold text-gray-800 dark:text-white focus:bg-white dark:focus:bg-[#0A192F] focus:ring-4 focus:ring-[#003366]/10 dark:focus:ring-[#D4AF37]/10 focus:border-[#003366] dark:focus:border-[#D4AF37] transition-all outline-none h-14"
                  />
                </div>
                <div className="relative group/input">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400 uppercase pointer-events-none group-focus-within/input:text-[#003366] dark:group-focus-within/input:text-[#D4AF37] transition-colors">Cierre</span>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 dark:border-[#112240] bg-gray-50/50 dark:bg-[#020C1B] pl-16 pr-4 py-3.5 text-sm font-bold text-gray-800 dark:text-white focus:bg-white dark:focus:bg-[#0A192F] focus:ring-4 focus:ring-[#003366]/10 dark:focus:ring-[#D4AF37]/10 focus:border-[#003366] dark:focus:border-[#D4AF37] transition-all outline-none h-14"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 font-bold ml-1 uppercase tracking-widest mt-2">
                * Los turnos se distribuirán equitativamente dentro de este lapso.
              </p>
            </div>
          </div>

          {ventanaActiva && (
            <div className="relative z-10 flex items-start gap-5 p-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30 rounded-xl animate-in zoom-in-95">
              <div className="p-4 bg-white dark:bg-[#0A192F] rounded-2xl text-amber-600 dark:text-amber-400 shadow-sm shrink-0 border border-amber-100 dark:border-amber-800/50">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-black text-amber-900 dark:text-amber-500 tracking-tight">Acceso Institucional Vigente</p>
                <p className="text-sm text-amber-800/80 dark:text-amber-200/70 leading-relaxed font-bold">
                  El sistema certifica una ventana de atención activa para este periodo académico. Para garantizar la consistencia e integridad de los padrones, no se permite sobreescribir ni generar ventanas paralelas simultáneas.
                </p>
              </div>
            </div>
          )}

          <div className="relative z-10 pt-10 border-t border-gray-100 dark:border-[#112240] flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-white/10 shadow-inner">
                <Layout className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Estado del Proceso</p>
                <p className={cn(
                  "text-base font-black tracking-tight",
                  ventanaActiva ? "text-amber-600 dark:text-amber-400" : "text-[#003366] dark:text-[#D4AF37]"
                )}>
                  {ventanaActiva ? 'Acción Restringida' : 'Autorizado para Generación'}
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
                  "flex-1 sm:flex-none px-12 py-5 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3",
                  ventanaActiva || !idPeriodo 
                    ? "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none"
                    : "bg-[#0A192F] text-white hover:bg-[#003366] dark:bg-[#D4AF37] dark:text-[#0A192F] dark:hover:bg-[#b08d28] shadow-[#0A192F]/20 dark:shadow-[#D4AF37]/20"
                )}
              >
                {crearMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generar Padrón de Turnos
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
