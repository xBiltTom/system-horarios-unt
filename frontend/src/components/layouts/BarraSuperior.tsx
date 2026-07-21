'use client';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { useSidebarStore } from '@/stores/sidebar.store';
import { MenuUsuario } from './MenuUsuario';
import { Bell, Sun, Moon, Menu } from 'lucide-react';

export function BarraSuperior() {
  const { usuario } = useAuthStore();
  const { modoOscuro, toggleTema } = useThemeStore();
  const { open } = useSidebarStore();

  return (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#0A192F]/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-full h-16 flex items-center justify-between px-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={open}
          className="md:hidden p-2 -ml-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-[#D4AF37] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xs md:text-sm font-bold text-gray-800 dark:text-white tracking-wide">
            Bienvenido(a), {usuario?.nombre || 'Usuario'}
          </h1>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-0.5">
            {usuario?.rol || 'Administrador'} • {usuario?.email}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTema}
          className="p-2 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-[#D4AF37] transition-colors bg-gray-50 hover:bg-blue-50 dark:bg-transparent dark:hover:bg-white/5 rounded-xl"
          title={modoOscuro ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {modoOscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button className="p-2 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-[#D4AF37] transition-colors relative bg-gray-50 hover:bg-blue-50 dark:bg-transparent dark:hover:bg-white/5 rounded-xl">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 dark:bg-rose-500 rounded-full animate-pulse border-2 border-white dark:border-[#0A192F]"></span>
        </button>
        
        <div className="h-6 w-px bg-gray-200 dark:bg-[#112240] mx-1"></div>

        <MenuUsuario />
      </div>
    </header>
  );
}