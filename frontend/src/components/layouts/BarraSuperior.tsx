'use client';
import { useAuthStore } from '@/stores/auth.store';
import { MenuUsuario } from './MenuUsuario';
import { LogOut, Bell } from 'lucide-react';

export function BarraSuperior() {
  const { usuario, cerrarSesion } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 bg-[#F0F4F8]/90 dark:bg-[#0A192F]/90 backdrop-blur-md border-b border-gray-200 dark:border-[#112240] h-20 flex items-center justify-between px-8 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-serif text-[#003366] dark:text-white tracking-wide">
            {usuario?.nombre || 'Panel de Administración'}
          </h1>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">
            {usuario?.email}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-[#F0F4F8] dark:bg-[#112240] text-[#003366] dark:text-[#D4AF37] px-4 py-1.5 rounded-full border border-gray-200 dark:border-[#1a365d]">
            {usuario?.rol || 'Administrador'}
          </span>
          <button className="p-2 text-gray-400 hover:text-[#003366] dark:text-gray-500 dark:hover:text-[#D4AF37] transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 dark:bg-red-500 rounded-full animate-pulse"></span>
          </button>
        </div>
        
        <div className="h-8 w-px bg-gray-200 dark:bg-[#112240]"></div>

        <div className="flex items-center gap-4">
          <MenuUsuario />
          <button 
            onClick={cerrarSesion} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}