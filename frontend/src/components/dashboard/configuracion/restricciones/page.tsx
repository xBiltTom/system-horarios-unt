'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { configuracionService } from '@/services/configuracion.service';
import { Boton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings2, Clock, Coffee, Save, ShieldAlert } from 'lucide-react';

const schema = z.object({
  FRANJA_INICIO: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  FRANJA_FIN: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  HORAS_MAX_DIARIAS: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 16, '1-16'),
  BLOQUEO_ALMUERZO_INICIO: z.string().regex(/^\d{2}:\d{2}$/),
  BLOQUEO_ALMUERZO_FIN: z.string().regex(/^\d{2}:\d{2}$/),
  TIEMPO_ATENCION_VENTANA: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 60, '1-60'),
});

type FormData = z.infer<typeof schema>;

export default function RestriccionesPage() {
  const queryClient = useQueryClient();

  const { data: restricciones, isLoading } = useQuery({
    queryKey: ['restricciones'],
    queryFn: async () => {
      const res = await configuracionService.obtenerRestricciones();
      return res.data;
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: restricciones ? {
      FRANJA_INICIO: restricciones.franjaInicio,
      FRANJA_FIN: restricciones.franjaFin,
      HORAS_MAX_DIARIAS: String(restricciones.horasMaximasDiarias),
      BLOQUEO_ALMUERZO_INICIO: restricciones.bloqueoAlmuerzoInicio,
      BLOQUEO_ALMUERZO_FIN: restricciones.bloqueoAlmuerzoFin,
      TIEMPO_ATENCION_VENTANA: String(restricciones.tiempoAtencionVentana),
    } : undefined,
  });

  useEffect(() => {
    if (restricciones) {
      reset({
        FRANJA_INICIO: restricciones.franjaInicio,
        FRANJA_FIN: restricciones.franjaFin,
        HORAS_MAX_DIARIAS: String(restricciones.horasMaximasDiarias),
        BLOQUEO_ALMUERZO_INICIO: restricciones.bloqueoAlmuerzoInicio,
        BLOQUEO_ALMUERZO_FIN: restricciones.bloqueoAlmuerzoFin,
        TIEMPO_ATENCION_VENTANA: String(restricciones.tiempoAtencionVentana),
      });
    }
  }, [restricciones, reset]);

  const mutation = useMutation({
    mutationFn: (datos: FormData) =>
      configuracionService.actualizarRestricciones(datos),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['restricciones'],
      });

      setTimeout(() => {
        mutation.reset();
      }, 3000);
    },
  });

  const onSubmit = (datos: FormData) => mutation.mutate(datos);

  if (isLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-[#003366] dark:text-white flex items-center gap-3">
          <Settings2 className="w-8 h-8 text-[#003366] dark:text-[#D4AF37]" />
          Reglas de Negocio
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">
          Configuración global de horarios de operación del campus, políticas de almuerzo y límites de dictado docente.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Horarios de Operación */}
          <div className="bg-white dark:bg-[#0A192F] rounded-xl border border-gray-200/60 dark:border-white/5 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
              <Clock className="w-5 h-5 text-[#003366] dark:text-[#D4AF37]" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Horario del Campus</h2>
            </div>
            <div className="space-y-5">
              <CampoTexto label="Apertura (HH:MM)" placeholder="07:00" {...register('FRANJA_INICIO')} error={errors.FRANJA_INICIO?.message} />
              <CampoTexto label="Cierre (HH:MM)" placeholder="22:00" {...register('FRANJA_FIN')} error={errors.FRANJA_FIN?.message} />
            </div>
          </div>

          {/* Card 2: Descanso y Almuerzo */}
          <div className="bg-white dark:bg-[#0A192F] rounded-xl border border-gray-200/60 dark:border-white/5 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
              <Coffee className="w-5 h-5 text-[#003366] dark:text-[#D4AF37]" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bloque de Almuerzo</h2>
            </div>
            <div className="space-y-5">
              <CampoTexto label="Inicio de Almuerzo (HH:MM)" placeholder="13:00" {...register('BLOQUEO_ALMUERZO_INICIO')} error={errors.BLOQUEO_ALMUERZO_INICIO?.message} />
              <CampoTexto label="Fin de Almuerzo (HH:MM)" placeholder="14:00" {...register('BLOQUEO_ALMUERZO_FIN')} error={errors.BLOQUEO_ALMUERZO_FIN?.message} />
            </div>
          </div>

          {/* Card 3: Límites Docentes */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0A192F] rounded-xl border border-gray-200/60 dark:border-white/5 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
              <ShieldAlert className="w-5 h-5 text-[#003366] dark:text-[#D4AF37]" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Parámetros de Carga Docente</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CampoTexto label="Máx. Horas Dictado Diario" type="number" placeholder="Ej: 8" {...register('HORAS_MAX_DIARIAS')} error={errors.HORAS_MAX_DIARIAS?.message} />
              <CampoTexto label="Resolución de Atenciones (Mins)" type="number" placeholder="Ej: 30" {...register('TIEMPO_ATENCION_VENTANA')} error={errors.TIEMPO_ATENCION_VENTANA?.message} />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Boton type="submit" cargando={mutation.isPending} className="rounded-2xl px-10 py-3 bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] shadow-lg shadow-[#003366]/20 dark:shadow-[#D4AF37]/20 transition-all font-bold text-lg">
            {!mutation.isPending && <Save className="w-5 h-5 mr-2 inline" />}
            {mutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
          </Boton>
        </div>

        {mutation.isSuccess && <NotificacionToast mensaje="Restricciones actualizadas correctamente." tipo="exito" onClose={() => mutation.reset()} />}
        {mutation.isError && <NotificacionToast mensaje="Error al guardar la configuración." tipo="error" onClose={() => mutation.reset()} />}
      </form>
    </div>
  );
}