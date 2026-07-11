'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utilidades';

interface Opcion {
  value: string | number;
  label: string;
}

interface SelectorInstitucionalProps {
  label?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  opciones: Opcion[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SelectorInstitucional({ label, value, onChange, opciones, placeholder = 'Seleccionar...', className, disabled = false }: SelectorInstitucionalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = opciones.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  return (
    <div className={cn("relative w-full space-y-1.5", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 transition-colors">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-4 py-3.5 text-left rounded-2xl border transition-all duration-200 outline-none shadow-sm",
          !isOpen && "bg-slate-50/50 hover:bg-white border-gray-200 text-gray-900 dark:bg-white/5 dark:hover:bg-[#020C1B] dark:border-white/10 dark:text-white",
          isOpen && "border-[#003366] bg-white text-[#003366] ring-4 ring-[#003366]/5 dark:border-[#D4AF37] dark:bg-[#020C1B] dark:text-[#D4AF37] dark:ring-[#D4AF37]/10",
          disabled && "cursor-not-allowed opacity-60 hover:bg-slate-50/50 dark:hover:bg-white/5"
        )}
      >
        <span className="block truncate text-sm font-medium tracking-wide">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 opacity-70", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#020C1B] border border-gray-200 dark:border-[#112240] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <ul className="max-h-60 overflow-y-auto custom-scrollbar py-1">
            <li 
              onClick={() => { onChange(0); setIsOpen(false); }}
              className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
            >
              {placeholder}
            </li>
            {opciones.map((opcion) => {
              const isSelected = opcion.value === value;
              return (
                <li
                  key={opcion.value}
                  onClick={() => {
                    onChange(opcion.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors",
                    isSelected 
                      ? "bg-[#F0F4F8] dark:bg-[#112240] text-[#003366] dark:text-[#D4AF37] font-bold" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                  )}
                >
                  <span className="truncate">{opcion.label}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
