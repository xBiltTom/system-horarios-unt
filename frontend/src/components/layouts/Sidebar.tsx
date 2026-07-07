'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { cn } from '@/lib/utilidades';
import {
  LayoutDashboard,
  Calendar,
  Users,
  BookOpen,
  School,
  Clock,
  Settings,
  CheckSquare,
  Eye,
  FileDown,
  MapPin,
  GraduationCap,
  LayoutGrid,
  FileText,
  Moon,
  Sun,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { usuario } = useAuthStore();
  const { modoOscuro, toggleTema } = useThemeStore();
  
  const esAdmin = usuario?.rol === 'ADMINISTRADOR';
  const esDirector = usuario?.rol === 'DIRECTOR';
  const esSecretaria = usuario?.rol === 'SECRETARIA';

  const rutaActiva = (href: string) => {
    if (href === '/dashboard' || href === '/dashboard/admin') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const enlacesAdmin = [
    { href: '/dashboard/admin', etiqueta: 'Panel Admin', Icono: LayoutDashboard },
    { href: '/dashboard/periodos', etiqueta: 'Períodos Académicos', Icono: Calendar },
    { href: '/dashboard/usuarios', etiqueta: 'Cuentas de Usuario', Icono: Users },
    { href: '/dashboard/ambientes', etiqueta: 'Infraestructura', Icono: School },
    { href: '/dashboard/cursos', etiqueta: 'Catálogo Cursos', Icono: BookOpen },
    { href: '/dashboard/curricula', etiqueta: 'Currículas', Icono: FileText },
    { href: '/dashboard/configuracion/restricciones', etiqueta: 'Reglas del Sistema', Icono: Settings },
  ];

  const enlacesDirector = [
    { href: '/dashboard/admin', etiqueta: 'Dashboard Dirección', Icono: LayoutDashboard },
    { href: '/dashboard/director/docentes', etiqueta: 'Escalafón Docente', Icono: Users },
    { href: '/dashboard/director/oferta-academica', etiqueta: 'Oferta Académica', Icono: GraduationCap },
    { href: '/dashboard/director/oferta-ciclos', etiqueta: 'Malla por Ciclos', Icono: LayoutGrid },
    { href: '/dashboard/director/carga-horaria', etiqueta: 'Asignación Carga', Icono: Clock },
  ];

  const enlacesSecretaria = [
    { href: '/dashboard/secretaria', etiqueta: 'Panel Principal', Icono: LayoutDashboard },
    { href: '/dashboard/secretaria/ambientes', etiqueta: 'Aulas y Laboratorios', Icono: School },
    { href: '/dashboard/secretaria/docentes', etiqueta: 'Plana Docente', Icono: Users },
    { href: '/dashboard/secretaria/cursos-asignados', etiqueta: 'Asignaturas', Icono: BookOpen },
    { href: '/dashboard/secretaria/grupos', etiqueta: 'Grupos Académicos', Icono: Eye },
    { href: '/dashboard/secretaria/ventanas', etiqueta: 'Ventanas Atención', Icono: Clock },
    { href: '/dashboard/secretaria/registro-horarios', etiqueta: 'Auditoría Manual', Icono: CheckSquare },
    { href: '/dashboard/secretaria/reportes', etiqueta: 'Emisión Reportes', Icono: FileDown },
    { href: '/dashboard/horarios/vista-aula', etiqueta: 'Malla Aulas', Icono: MapPin },
    { href: '/dashboard/horarios/vista-ciclo', etiqueta: 'Malla Ciclos', Icono: Calendar },
  ];

  const enlacesDocente = [
    { href: '/dashboard/docente', etiqueta: 'Mi Expediente', Icono: LayoutDashboard },
    { href: '/dashboard/docente/carga-no-lectiva', etiqueta: 'Declaración Horas', Icono: FileText },
    { href: '/dashboard/horarios/seleccion', etiqueta: 'Registro Horario', Icono: CheckSquare },
    { href: '/dashboard/horarios/vista-docente', etiqueta: 'Carga Oficial', Icono: Eye },
  ];

  let enlaces = enlacesDocente;
  if (esAdmin) enlaces = enlacesAdmin;
  else if (esDirector) enlaces = enlacesDirector;
  else if (esSecretaria) enlaces = enlacesSecretaria;

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col bg-slate-50 dark:bg-[#0A192F] text-[#0A192F] dark:text-white shadow-2xl transition-all duration-300 border-r border-gray-200 dark:border-[#112240]">
      {/* Brand Header */}
      <div className="flex flex-col items-center justify-center py-10 border-b border-gray-200 dark:border-[#112240]">
        <img 
          src="/logo-unt1.png" 
          alt="Sello UNT" 
          className="h-16 w-auto opacity-100 mb-6 bg-white p-1.5 rounded-lg shadow-sm" 
        />
        <div className="text-center">
          <h2 className="text-lg font-serif tracking-widest text-[#0A192F] dark:text-white uppercase">UNT | Sistemas</h2>
          <div className="w-10 h-px bg-[#0A192F]/20 dark:bg-[#D4AF37] mx-auto mt-3"></div>
        </div>
      </div>

      {/* Rol Identifier */}
      <div className="px-6 py-4 bg-white dark:bg-[#050f20] border-b border-gray-200 dark:border-[#112240] flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Sesión Activa:</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#0A192F] dark:text-[#D4AF37]">
          {usuario?.rol || 'USUARIO'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        <ul className="space-y-1">
          {enlaces.map((enlace) => {
            const activo = rutaActiva(enlace.href);
            const Icon = enlace.Icono;

            return (
              <li key={enlace.href}>
                <Link
                  href={enlace.href}
                  className={cn(
                    'group flex items-center gap-4 px-6 py-3.5 text-xs font-semibold uppercase tracking-widest transition-all duration-300 border-l-2',
                    activo
                      ? 'border-[#0A192F] bg-gradient-to-r from-[#0A192F]/5 to-transparent text-[#0A192F] dark:border-[#D4AF37] dark:from-[#D4AF37]/10 dark:text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-transparent dark:hover:border-gray-700'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors duration-300',
                      activo ? 'text-[#0A192F] dark:text-[#D4AF37]' : 'text-gray-400 group-hover:text-[#0A192F] dark:text-gray-600 dark:group-hover:text-gray-400'
                    )}
                    strokeWidth={activo ? 2.5 : 2}
                  />
                  <span>{enlace.etiqueta}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Theme Toggle */}
      <div className="border-t border-gray-200 dark:border-[#112240] p-6 flex flex-col items-center gap-4">
        <button 
          onClick={toggleTema}
          className="flex items-center gap-3 px-4 py-2 rounded-full border border-gray-200 dark:border-[#112240] bg-white dark:bg-[#050f20] hover:bg-gray-100 dark:hover:bg-[#112240] transition-colors w-full justify-center"
        >
          {modoOscuro ? <Sun className="w-4 h-4 text-[#D4AF37]" /> : <Moon className="w-4 h-4 text-[#0A192F]" />}
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            {modoOscuro ? 'Modo Claro' : 'Modo Oscuro'}
          </span>
        </button>
        <div className="text-center mt-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">Oficina de Registro</p>
          <p className="text-[9px] uppercase tracking-widest text-gray-500 dark:text-gray-700 mt-1">Plataforma 2026</p>
        </div>
      </div>
    </aside>
  );
}
