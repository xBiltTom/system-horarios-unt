'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Boton } from './Boton';
import { Download, Printer } from 'lucide-react';

interface Props {
  abierto: boolean;
  cerrar: () => void;
  pdfBlob: Blob | null;
  nombreArchivo: string;
  onConfirmar: () => void;
}

export function ModalPrevisualizacionPDF({ abierto, cerrar, pdfBlob, nombreArchivo, onConfirmar }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (pdfBlob && abierto) {
      const url = window.URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      return () => window.URL.revokeObjectURL(url);
    }
    if (!abierto) {
      setPdfUrl(null);
    }
  }, [pdfBlob, abierto]);

  return (
    <Modal 
      abierto={abierto} 
      cerrar={cerrar} 
      titulo={`Vista Previa: ${nombreArchivo}`} 
      className="max-w-6xl w-full h-[90vh] flex flex-col mx-4" 
      classNameContenido="flex-1 p-0 flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-900 rounded-b-[2.5rem]"
    >
      {pdfUrl ? (
        <div className="flex-1 w-full flex flex-col h-full relative">
          <iframe 
            src={`${pdfUrl}#toolbar=0&navpanes=0`} 
            className="w-full flex-1 border-0"
            title="Vista previa PDF"
          />
          <div className="p-4 bg-white dark:bg-[#0A192F] border-t border-gray-200 dark:border-[#112240] flex justify-end gap-3 rounded-b-[2.5rem]">
             <Boton variant="outline" onClick={cerrar}>
               Cancelar
             </Boton>
             <Boton onClick={onConfirmar} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Download className="w-4 h-4" />
                Confirmar y Descargar
             </Boton>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 h-full">
           <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando vista previa...</p>
        </div>
      )}
    </Modal>
  );
}
