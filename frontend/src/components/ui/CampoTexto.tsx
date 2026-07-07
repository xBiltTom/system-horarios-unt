import React, { forwardRef } from 'react';
import { cn } from '@/lib/utilidades';

export interface CampoTextoProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  ayuda?: string;
}

export const CampoTexto = forwardRef<HTMLInputElement, CampoTextoProps>(
  ({ label, error, ayuda, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{label}</label>
        <input
          ref={ref}
          className={cn(
            "block w-full rounded-2xl border border-gray-200 dark:border-[#112240] px-4 py-4 text-gray-900 dark:text-white shadow-sm transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:border-[#003366] dark:focus:border-[#D4AF37] focus:ring-4 focus:ring-[#003366]/10 dark:focus:ring-[#D4AF37]/20 focus:outline-none bg-gray-50/50 dark:bg-[#050f20] hover:bg-white dark:hover:bg-[#112240]",
            error ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "hover:border-gray-300 dark:hover:border-[#1a365d]",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs font-bold text-red-600 ml-1">{error}</p>}
        {ayuda && !error && <p className="mt-1 text-[10px] font-medium text-gray-400 ml-1 uppercase tracking-wider">{ayuda}</p>}
      </div>
    );
  }
);

CampoTexto.displayName = 'CampoTexto';
