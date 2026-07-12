'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Settings, Lock, LogOut } from 'lucide-react';

export function MenuUsuario() {
  const [abierto, setAbierto] = useState(false);
  const { usuario, cerrarSesion } = useAuthStore();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:text-[#003366] dark:hover:text-[#D4AF37] transition-colors focus:outline-none"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-[#003366] to-[#0A192F] dark:from-[#112240] dark:to-[#050f20] rounded-full flex items-center justify-center border border-[#003366]/20 dark:border-transparent hover:border-[#D4AF37] transition-all shadow-sm">
          <span className="text-sm font-bold text-white dark:text-[#D4AF37]">
            {usuario?.nombre?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      </button>

      {abierto && (
        <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#020C1B] border border-gray-200 dark:border-[#112240] rounded-xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-[#112240] bg-gray-50 dark:bg-[#050f20]">
             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Opciones de Cuenta</p>
          </div>
          <div className="p-2">
            <Link
              href="/auth/cambiar-password"
              className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-[#F0F4F8] dark:hover:bg-[#112240] hover:text-[#003366] dark:hover:text-white rounded-lg transition-colors"
              onClick={() => setAbierto(false)}
            >
              <Lock className="w-4 h-4" />
              Cambiar Contraseña
            </Link>
            <div className="h-px bg-gray-100 dark:bg-[#112240] my-1"></div>
            <button
              onClick={() => { setAbierto(false); cerrarSesion(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}