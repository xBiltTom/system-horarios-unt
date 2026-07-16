'use client';

import React from 'react';
import { Modal } from './Modal';
import { Boton } from './Boton';
import { AlertTriangle, HelpCircle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utilidades';

interface ModalConfirmacionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  mensaje: string;
  tipo?: 'peligro' | 'pregunta' | 'info' | 'exito';
  textoConfirmar?: string;
  textoCancelar?: string;
  isLoading?: boolean;
}

export function ModalConfirmacion({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  mensaje,
  tipo = 'pregunta',
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  isLoading = false
}: ModalConfirmacionProps) {
  
  const config = {
    peligro: {
      icon: <AlertTriangle className="w-12 h-12 text-rose-500" />,
      bg: 'bg-rose-50',
      btn: 'variante="peligro" as const',
      border: 'border-rose-100'
    },
    pregunta: {
      icon: <HelpCircle className="w-12 h-12 text-indigo-500" />,
      bg: 'bg-indigo-50',
      btn: 'variante="primario" as const',
      border: 'border-indigo-100'
    },
    info: {
      icon: <Info className="w-12 h-12 text-blue-500" />,
      bg: 'bg-blue-50',
      btn: 'variante="primario" as const',
      border: 'border-blue-100'
    },
    exito: {
      icon: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
      bg: 'bg-emerald-50',
      btn: 'variante="primario" as const',
      border: 'border-emerald-100'
    }
  };

  const current = config[tipo];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="flex flex-col items-center text-center space-y-6 py-4">
        <div className={cn("p-6 rounded-xl shadow-inner", current.bg)}>
          {current.icon}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{titulo}</h3>
          <p className="text-slate-500 text-sm leading-relaxed max-w-[280px] mx-auto font-medium">
            {mensaje}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
          <Boton 
            variante="secundario" 
            onClick={onClose} 
            className="flex-1 rounded-2xl py-4 h-auto uppercase tracking-widest text-[10px] font-black"
            disabled={isLoading}
          >
            {textoCancelar}
          </Boton>
          <Boton 
            variante={tipo === 'peligro' ? 'peligro' : 'primario'}
            onClick={onConfirm} 
            className="flex-1 rounded-2xl py-4 h-auto uppercase tracking-widest text-[10px] font-black shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : textoConfirmar}
          </Boton>
        </div>
      </div>
    </Modal>
  );
}
