'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { notificacionesService } from '@/services/notificaciones.service';
import { Boton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { Send, CheckCircle } from 'lucide-react';

interface VerificacionTelegramProps {
  docenteId: number;
}

export function VerificacionTelegram({ docenteId }: VerificacionTelegramProps) {
  const [telegramId, setTelegramId] = useState('');
  const mutation = useMutation({
    mutationFn: () => notificacionesService.vincularTelegram(docenteId, telegramId),
  });

  return (
    <div className="bg-white dark:bg-[#0A192F] rounded-xl border border-gray-200/60 dark:border-white/5 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-white/5 mb-6">
          <Send className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Vincular Telegram</h3>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          Abre el bot de notificaciones en Telegram, presiona /start y pega tu ID de chat aquí.
        </p>
        
        <CampoTexto
          label="ID de Chat"
          value={telegramId}
          onChange={(e) => setTelegramId(e.target.value)}
          placeholder="Ej: 123456789"
        />
      </div>

      <div className="mt-8 pt-4 border-t border-gray-100 dark:border-white/5">
        <Boton
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !telegramId}
          className="w-full rounded-xl py-3 bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] transition-all font-bold"
        >
          {mutation.isPending ? 'Vinculando...' : 'Vincular Telegram'}
        </Boton>
      </div>

      {mutation.isSuccess && <NotificacionToast mensaje="Telegram vinculado exitosamente" tipo="exito" onClose={() => mutation.reset()} />}
      {mutation.isError && <NotificacionToast mensaje="Hubo un error al vincular el ID" tipo="error" onClose={() => mutation.reset()} />}
    </div>
  );
}