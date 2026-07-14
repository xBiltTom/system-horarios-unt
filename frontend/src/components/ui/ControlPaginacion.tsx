'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ControlPaginacionProps {
  paginaActual: number;
  totalPaginas: number;
  totalItems: number;
  inicio: number;
  fin: number;
  irAPagina: (pagina: number) => void;
  /** Label for the item type e.g. "registros", "docentes". Default "registros" */
  etiqueta?: string;
}

export function ControlPaginacion({
  paginaActual,
  totalPaginas,
  totalItems,
  inicio,
  fin,
  irAPagina,
  etiqueta = 'registros',
}: ControlPaginacionProps) {
  if (totalItems === 0 || totalPaginas <= 1) return null;

  // Build visible page numbers with ellipsis
  const paginas = (): (number | '...')[] => {
    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (paginaActual > 3) pages.push('...');
    for (let i = Math.max(2, paginaActual - 1); i <= Math.min(totalPaginas - 1, paginaActual + 1); i++) {
      pages.push(i);
    }
    if (paginaActual < totalPaginas - 2) pages.push('...');
    pages.push(totalPaginas);
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
      {/* Info */}
      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
        Mostrando{' '}
        <span className="font-bold text-gray-600 dark:text-gray-300">{inicio}–{fin}</span>
        {' '}de{' '}
        <span className="font-bold text-gray-600 dark:text-gray-300">{totalItems}</span>
        {' '}{etiqueta}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => irAPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
          className="p-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {paginas().map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400 dark:text-gray-500 text-sm select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => irAPagina(p as number)}
              className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-bold transition-all border ${
                paginaActual === p
                  ? 'bg-[#0A192F] dark:bg-white text-white dark:text-[#0A192F] border-[#0A192F] dark:border-white shadow-sm'
                  : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
              aria-label={`Página ${p}`}
              aria-current={paginaActual === p ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => irAPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          className="p-2 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
