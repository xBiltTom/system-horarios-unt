'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { notificacionesService } from '@/services/notificaciones.service';
import { Boton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { MessageCircle, CheckCircle } from 'lucide-react';

interface VerificacionWhatsAppProps {
  docenteId: number;
}

export function VerificacionWhatsApp({ docenteId }: VerificacionWhatsAppProps) {
  const [codigo, setCodigo] = useState('');
  const mutation = useMutation({
    mutationFn: () => notificacionesService.verificarWhatsApp(docenteId, codigo),
  });

  return (
    <div className="bg-white dark:bg-[#0A192F] rounded-xl border border-gray-200/60 dark:border-white/5 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-white/5 mb-6">
          <MessageCircle className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Vincular WhatsApp</h3>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          Ingresa el código de 6 dígitos que te enviamos al teléfono para validar la conexión.
        </p>
        
        <CampoTexto
          label="Código de verificación"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Ej: 123456"
        />
      </div>

      <div className="mt-8 pt-4 border-t border-gray-100 dark:border-white/5">
        <Boton
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || codigo.length < 6}
          className="w-full rounded-xl py-3 bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] transition-all font-bold"
        >
          {mutation.isPending ? 'Verificando...' : 'Verificar Conexión'}
        </Boton>
      </div>

      {mutation.isSuccess && <NotificacionToast mensaje="WhatsApp verificado correctamente" tipo="exito" onClose={() => mutation.reset()} />}
      {mutation.isError && <NotificacionToast mensaje="Código inválido o expirado" tipo="error" onClose={() => mutation.reset()} />}
    </div>
  );
}