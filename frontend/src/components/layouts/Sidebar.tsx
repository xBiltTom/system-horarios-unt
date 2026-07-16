'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useSidebarStore } from '@/stores/sidebar.store';
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
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { usuario } = useAuthStore();
  const { isOpen, close } = useSidebarStore();
  
  const esAdmin = usuario?.rol === 'ADMINISTRADOR';
  const esDirector = usuario?.rol === 'DIRECTOR';
  const esSecretaria = usuario?.rol === 'SECRETARIA';

  const rutaActiva = (href: string) => {
    if (href === '/' || href === '/admin') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const enlacesAdmin = [
    { href: '/admin', etiqueta: 'Panel de Administración', Icono: LayoutDashboard },
    { href: '/periodos', etiqueta: 'Períodos Académicos', Icono: Calendar },
    { href: '/usuarios', etiqueta: 'Usuarios y Roles', Icono: Users },
    { href: '/ambientes', etiqueta: 'Infraestructura Física', Icono: School },
    { href: '/cursos', etiqueta: 'Unidades Didácticas', Icono: BookOpen },
    { href: '/curricula', etiqueta: 'Planes de Estudio', Icono: FileText },
    { href: '/configuracion/restricciones', etiqueta: 'Configuración Global', Icono: Settings },
  ];

  const enlacesDirector = [
    { href: '/admin', etiqueta: 'Dirección Estratégica', Icono: LayoutDashboard },
    { href: '/director/docentes', etiqueta: 'Escalafón Docente', Icono: Users },
    { href: '/director/oferta-academica', etiqueta: 'Oferta Académica', Icono: GraduationCap },
    { href: '/director/oferta-ciclos', etiqueta: 'Malla por Ciclos', Icono: LayoutGrid },
    { href: '/director/carga-horaria', etiqueta: 'Supervisión de Carga Académica', Icono: Clock },
  ];

  const enlacesSecretaria = [
    { href: '/secretaria', etiqueta: 'Panel Principal', Icono: LayoutDashboard },
    { href: '/secretaria/ambientes', etiqueta: 'Infraestructura Física', Icono: School },
    { href: '/secretaria/docentes', etiqueta: 'Plana Docente', Icono: Users },
    { href: '/secretaria/cursos-asignados', etiqueta: 'Unidades Didácticas', Icono: BookOpen },
    { href: '/secretaria/grupos', etiqueta: 'Grupos Académicos', Icono: Eye },
    { href: '/secretaria/ventanas', etiqueta: 'Ventanas de Atención', Icono: Clock },
    { href: '/secretaria/registro-horarios', etiqueta: 'Centro de Planificación', Icono: CheckSquare },
    { href: '/secretaria/reportes', etiqueta: 'Analíticas y Métricas', Icono: FileDown },
    { href: '/horarios/vista-aula', etiqueta: 'Horarios por Aula', Icono: MapPin },
    { href: '/horarios/vista-ciclo', etiqueta: 'Horarios por Ciclo', Icono: Calendar },
  ];

  const enlacesDocente = [
    { href: '/docente', etiqueta: 'Portal Docente', Icono: LayoutDashboard },
    { href: '/docente/carga-no-lectiva', etiqueta: 'Actividades No Lectivas', Icono: FileText },
    { href: '/horarios/seleccion', etiqueta: 'Selección de Ventanas', Icono: CheckSquare },
    { href: '/horarios/vista-docente', etiqueta: 'Mi Horario Oficial', Icono: Eye },
  ];

  let enlaces = enlacesDocente;
  if (esAdmin) enlaces = enlacesAdmin;
  else if (esDirector) enlaces = enlacesDirector;
  else if (esSecretaria) enlaces = enlacesSecretaria;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={close} 
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 md:left-6 md:top-6 z-50 flex h-full md:h-[calc(100vh-48px)] w-[260px] flex-col bg-white dark:bg-[#0A192F] text-gray-900 dark:text-white shadow-xl transition-transform duration-300 md:rounded-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Brand Header */}
      <div className="flex flex-col items-center justify-center py-8 border-b border-gray-100 dark:border-[#112240] bg-gray-50/50 dark:bg-transparent">
        <img 
          src="/logo-unt1.png" 
          alt="Sello UNT" 
          className="h-14 w-auto opacity-100 mb-5 bg-white p-2 rounded-xl shadow-sm border border-gray-100 dark:border-transparent" 
        />
        <div className="text-center">
          <h2 className="text-base font-bold tracking-widest text-gray-800 dark:text-white uppercase font-sans">Sistemas UNT</h2>
          <div className="w-8 h-[2px] bg-blue-600 dark:bg-[#D4AF37] mx-auto mt-3 rounded-full"></div>
        </div>
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
                    'group flex items-center gap-4 px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 mx-3 rounded-xl',
                    activo
                      ? 'bg-blue-50 text-blue-700 dark:bg-white/10 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors duration-300',
                      activo ? 'text-blue-600 dark:text-[#D4AF37]' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'
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

      {/* Footer */}
      <div className="border-t border-gray-100 dark:border-[#112240] p-6 flex flex-col items-center justify-center bg-gray-50/30 dark:bg-transparent">
        <div className="text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-500">Gestión Académica</p>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600 mt-1">Plataforma Institucional</p>
        </div>
      </div>
      </aside>
    </>
  );
}
