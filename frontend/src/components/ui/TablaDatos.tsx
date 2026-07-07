'use client';

import React from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utilidades';

interface Columna {
  clave: string;
  titulo: string;
  render?: (item: any) => React.ReactNode;
}

interface TablaDatosProps {
  columnas: Columna[];
  datos: any[];
  alHacerClick?: (item: any) => void;
  alEditar?: (item: any) => void;
  alEliminar?: (item: any) => void;
  loading?: boolean;
}

export function TablaDatos({ 
  columnas, 
  datos, 
  alHacerClick, 
  alEditar, 
  alEliminar,
  loading 
}: TablaDatosProps) {
  const usuario = useAuthStore(state => state.usuario);
  const puedeEditar = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'DIRECTOR';

  if (loading) {
    return (
      <div className="w-full space-y-4 p-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 w-full bg-gray-100 dark:bg-[#112240] animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!datos || datos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg font-medium">No se encontraron resultados</p>
        <p className="text-sm">Intenta ajustar tu búsqueda o agregar nuevos elementos.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-[2rem] border border-gray-100 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-[#050f20] border-b border-gray-100 dark:border-[#112240]">
              {columnas.map((col) => (
                <th key={col.clave} className="px-8 py-5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {col.titulo}
                </th>
              ))}
              {(puedeEditar && (alEditar || alEliminar)) && (
                <th className="px-8 py-5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-[#112240]/50">
            {datos.map((item, index) => (
              <tr
                key={item.id || index}
                className={cn(
                  "group transition-all duration-200 hover:bg-gray-50/50 dark:hover:bg-white/5",
                  alHacerClick ? "cursor-pointer" : ""
                )}
                onClick={() => alHacerClick?.(item)}
              >
                {columnas.map((col) => (
                  <td key={col.clave} className="px-8 py-5 text-sm text-gray-700 dark:text-gray-300">
                    {col.render ? col.render(item) : item[col.clave]}
                  </td>
                ))}
                {(puedeEditar && (alEditar || alEliminar)) && (
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      {alEditar && (
                        <button
                          onClick={() => alEditar(item)}
                          className="p-2 text-gray-400 hover:text-[#003366] dark:hover:text-[#D4AF37] hover:bg-white dark:hover:bg-[#112240] rounded-xl transition-all shadow-sm hover:shadow border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {alEliminar && (
                        <button
                          onClick={() => alEliminar(item)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-[#112240] rounded-xl transition-all shadow-sm hover:shadow border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
