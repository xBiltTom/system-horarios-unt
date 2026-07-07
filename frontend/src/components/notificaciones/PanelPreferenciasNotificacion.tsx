'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificacionesService } from '@/services/notificaciones.service';
import { Boton } from '@/components/ui/Boton';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { Mail, MessageCircle, Send, Settings2 } from 'lucide-react';

interface PanelPreferenciasNotificacionProps {
  docenteId: number;
}

export function PanelPreferenciasNotificacion({ docenteId }: PanelPreferenciasNotificacionProps) {
  const queryClient = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['preferencias-notificacion', docenteId],
    queryFn: () => notificacionesService.obtenerPreferencias(docenteId).then((r) => r.data),
    enabled: !!docenteId,
  });

  const mutation = useMutation({
    mutationFn: (datos: any) => notificacionesService.actualizarPreferencias(docenteId, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preferencias-notificacion', docenteId] }),
  });

  if (isLoading) return <SpinnerCarga />;

  const toggle = (campo: string, valor: boolean) => {
    mutation.mutate({ [campo]: valor });
  };

  return (
    <div className="bg-white dark:bg-[#0A192F] rounded-[2rem] border border-gray-200/60 dark:border-white/5 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-white/5">
        <Settings2 className="w-5 h-5 text-[#003366] dark:text-[#D4AF37]" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Canales Activos</h3>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg">
              <Mail className="w-4 h-4 text-[#003366] dark:text-[#D4AF37]" />
            </div>
            Correo
          </div>
          <button
            onClick={() => toggle('correoHabilitado', !prefs?.correoHabilitado)}
            className={`w-12 h-6 rounded-full transition-all duration-300 relative focus:outline-none ${prefs?.correoHabilitado ? 'bg-[#003366] dark:bg-[#D4AF37]' : 'bg-gray-200 dark:bg-white/10'}`}
          >
            <div className={`w-5 h-5 bg-white absolute top-0.5 left-0.5 rounded-full shadow transform transition-transform duration-300 ${prefs?.correoHabilitado ? 'translate-x-6 dark:bg-[#0A192F]' : 'translate-x-0 dark:bg-gray-400'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            <div className="p-2 bg-gray-100 dark:bg-green-900/30 rounded-lg">
              <MessageCircle className="w-4 h-4 text-[#003366] dark:text-green-400" />
            </div>
            WhatsApp
          </div>
          <button
            onClick={() => toggle('whatsappHabilitado', !prefs?.whatsappHabilitado)}
            className={`w-12 h-6 rounded-full transition-all duration-300 relative focus:outline-none ${prefs?.whatsappHabilitado ? 'bg-[#003366] dark:bg-[#D4AF37]' : 'bg-gray-200 dark:bg-white/10'}`}
          >
            <div className={`w-5 h-5 bg-white absolute top-0.5 left-0.5 rounded-full shadow transform transition-transform duration-300 ${prefs?.whatsappHabilitado ? 'translate-x-6 dark:bg-[#0A192F]' : 'translate-x-0 dark:bg-gray-400'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            <div className="p-2 bg-gray-100 dark:bg-blue-900/30 rounded-lg">
              <Send className="w-4 h-4 text-[#003366] dark:text-blue-400" />
            </div>
            Telegram
          </div>
          <button
            onClick={() => toggle('telegramHabilitado', !prefs?.telegramHabilitado)}
            className={`w-12 h-6 rounded-full transition-all duration-300 relative focus:outline-none ${prefs?.telegramHabilitado ? 'bg-[#003366] dark:bg-[#D4AF37]' : 'bg-gray-200 dark:bg-white/10'}`}
          >
            <div className={`w-5 h-5 bg-white absolute top-0.5 left-0.5 rounded-full shadow transform transition-transform duration-300 ${prefs?.telegramHabilitado ? 'translate-x-6 dark:bg-[#0A192F]' : 'translate-x-0 dark:bg-gray-400'}`} />
          </button>
        </div>
      </div>

      {mutation.isSuccess && <NotificacionToast mensaje="Preferencias actualizadas" tipo="exito" onClose={() => mutation.reset()} />}
    </div>
  );
}