import { useState, useEffect, useMemo } from 'react';

interface UsePaginacionOptions {
  /** Items per page. Default 10. */
  porPagina?: number;
}

export function usePaginacion<T>(items: T[], options: UsePaginacionOptions = {}) {
  const { porPagina = 10 } = options;
  const [paginaActual, setPaginaActual] = useState(1);

  // Reset to page 1 whenever the dataset changes (filters, search, etc.)
  useEffect(() => {
    setPaginaActual(1);
  }, [items.length]);

  const totalPaginas = Math.max(1, Math.ceil(items.length / porPagina));

  const itemsPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * porPagina;
    return items.slice(inicio, inicio + porPagina);
  }, [items, paginaActual, porPagina]);

  const irAPagina = (pagina: number) => {
    setPaginaActual(Math.min(Math.max(1, pagina), totalPaginas));
  };

  return {
    paginaActual,
    totalPaginas,
    itemsPagina,
    irAPagina,
    totalItems: items.length,
    porPagina,
    inicio: (paginaActual - 1) * porPagina + 1,
    fin: Math.min(paginaActual * porPagina, items.length),
  };
}
