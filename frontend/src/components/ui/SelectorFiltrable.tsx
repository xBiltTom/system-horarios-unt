import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utilidades';
import { Search, ChevronDown, X } from 'lucide-react';

interface Opcion {
  valor?: string | number;
  etiqueta?: string;
  value?: string | number;
  label?: string;
}

interface SelectorFiltrableProps {
  label: string;
  opciones: Opcion[];
  value: string | number;
  onChange: (valor: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SelectorFiltrable({
  label,
  opciones,
  value,
  onChange,
  placeholder = "Buscar...",
  className,
  disabled
}: SelectorFiltrableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Compatibilidad hacia atrás: soporta { valor, etiqueta } o { value, label }
  const normalizeOp = (op: Opcion) => ({
    val: op.value !== undefined ? op.value : op.valor,
    lbl: op.label !== undefined ? op.label : op.etiqueta || ''
  });

  const opcionSeleccionada = opciones.find(op => normalizeOp(op).val === value);
  const lblSeleccionado = opcionSeleccionada ? normalizeOp(opcionSeleccionada).lbl : placeholder;

  const opcionesFiltradas = opciones.filter(op =>
    normalizeOp(op).lbl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (valor: string | number) => {
    onChange(valor);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={cn("space-y-1.5 relative", className)} ref={containerRef}>
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 transition-colors">{label}</label>
      
      <div className="relative">
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-between w-full rounded-2xl border px-4 py-4 shadow-sm transition-all duration-200 cursor-pointer",
            !disabled && !isOpen && "bg-slate-50/50 hover:bg-white border-gray-200 text-gray-900 dark:bg-white/5 dark:hover:bg-[#020C1B] dark:border-white/10 dark:text-white",
            isOpen && "border-[#003366] bg-white text-[#003366] ring-4 ring-[#003366]/5 dark:border-[#D4AF37] dark:bg-[#020C1B] dark:text-[#D4AF37] dark:ring-[#D4AF37]/10",
            disabled && "opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-400"
          )}
        >
          <span className={cn("truncate", !opcionSeleccionada && "text-gray-400 dark:text-gray-500")}>
            {lblSeleccionado}
          </span>
          <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", isOpen && "rotate-180")} />
        </div>

        {isOpen && (
          <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-[#0A192F] rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-3 border-b border-gray-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  autoFocus
                  type="text"
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#020C1B] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#003366] dark:focus:border-[#D4AF37] focus:ring-2 focus:ring-[#003366]/10 dark:focus:ring-[#D4AF37]/10 text-gray-900 dark:text-white placeholder:text-gray-400"
                  placeholder={placeholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                {searchTerm && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto py-1 custom-scrollbar">
              {opcionesFiltradas.length > 0 ? (
                opcionesFiltradas.map((op, i) => {
                  const val = normalizeOp(op).val;
                  const lbl = normalizeOp(op).lbl;
                  return (
                    <div
                      key={`${val}-${i}`}
                      onClick={() => handleSelect(val!)}
                      className={cn(
                        "px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300",
                        val === value && "bg-[#003366]/5 dark:bg-[#D4AF37]/10 text-[#003366] dark:text-[#D4AF37] font-bold"
                      )}
                    >
                      {lbl}
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm italic">
                  No se encontraron resultados
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
