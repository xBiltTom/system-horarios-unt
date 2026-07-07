'use client';
import { useAuthStore } from '@/stores/auth.store';
import { PanelPreferenciasNotificacion } from '@/components/notificaciones/PanelPreferenciasNotificacion';
import { VerificacionWhatsApp } from '@/components/notificaciones/VerificacionWhatsApp';
import { VerificacionTelegram } from '@/components/notificaciones/VerificacionTelegram';
import { BellRing } from 'lucide-react';

export default function PreferenciasNotificacionesPage() {
  const { usuario } = useAuthStore();
  const docenteId = usuario?.idDocente || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-[#003366] dark:text-white flex items-center gap-3">
          <BellRing className="w-8 h-8 text-[#003366] dark:text-[#D4AF37]" />
          Preferencias de Notificación
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium">
          Personaliza cómo y dónde deseas recibir las alertas del sistema de horarios.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <PanelPreferenciasNotificacion docenteId={docenteId} />
        <VerificacionWhatsApp docenteId={docenteId} />
        <VerificacionTelegram docenteId={docenteId} />
      </div>
    </div>
  );
}