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
    { href: '/admin', etiqueta: 'Centro de Control', Icono: LayoutDashboard },
    { href: '/periodos', etiqueta: 'Períodos Académicos', Icono: Calendar },
    { href: '/usuarios', etiqueta: 'Usuarios y Roles', Icono: Users },
    { href: '/ambientes', etiqueta: 'Infraestructura', Icono: School },
    { href: '/cursos', etiqueta: 'Catálogo de Asignaturas', Icono: BookOpen },
    { href: '/curricula', etiqueta: 'Planes de Estudio', Icono: FileText },
    { href: '/configuracion/restricciones', etiqueta: 'Configuración Global', Icono: Settings },
  ];

  const enlacesDirector = [
    { href: '/admin', etiqueta: 'Panel de Dirección', Icono: LayoutDashboard },
    { href: '/director/docentes', etiqueta: 'Escalafón Docente', Icono: Users },
    { href: '/director/oferta-academica', etiqueta: 'Oferta Académica', Icono: GraduationCap },
    { href: '/director/oferta-ciclos', etiqueta: 'Malla por Ciclos', Icono: LayoutGrid },
    { href: '/director/carga-horaria', etiqueta: 'Carga Académica', Icono: Clock },
  ];

  const enlacesSecretaria = [
    { href: '/secretaria', etiqueta: 'Panel Principal', Icono: LayoutDashboard },
    { href: '/secretaria/ambientes', etiqueta: 'Aulas y Laboratorios', Icono: School },
    { href: '/secretaria/docentes', etiqueta: 'Plana Docente', Icono: Users },
    { href: '/secretaria/cursos-asignados', etiqueta: 'Asignaturas', Icono: BookOpen },
    { href: '/secretaria/grupos', etiqueta: 'Grupos Académicos', Icono: Eye },
    { href: '/secretaria/ventanas', etiqueta: 'Disponibilidad Docente', Icono: Clock },
    { href: '/secretaria/registro-horarios', etiqueta: 'Programación Manual', Icono: CheckSquare },
    { href: '/secretaria/reportes', etiqueta: 'Emisión de Reportes', Icono: FileDown },
    { href: '/horarios/vista-aula', etiqueta: 'Horarios por Aula', Icono: MapPin },
    { href: '/horarios/vista-ciclo', etiqueta: 'Horarios por Ciclo', Icono: Calendar },
  ];

  const enlacesDocente = [
    { href: '/docente', etiqueta: 'Mi Expediente', Icono: LayoutDashboard },
    { href: '/docente/carga-no-lectiva', etiqueta: 'Actividades No Lectivas', Icono: FileText },
    { href: '/horarios/seleccion', etiqueta: 'Elección de Horarios', Icono: CheckSquare },
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
        "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-[#F0F4F8] dark:bg-[#0A192F] text-[#003366] dark:text-white shadow-2xl transition-transform duration-300 border-r border-gray-200 dark:border-[#112240]",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Brand Header */}
      <div className="flex flex-col items-center justify-center py-10 border-b border-gray-200 dark:border-[#112240]">
        <img 
          src="/logo-unt1.png" 
          alt="Sello UNT" 
          className="h-16 w-auto opacity-100 mb-6 bg-white p-1.5 rounded-lg shadow-sm" 
        />
        <div className="text-center">
          <h2 className="text-lg font-serif tracking-widest text-[#003366] dark:text-white uppercase">UNT | Sistemas</h2>
          <div className="w-10 h-px bg-[#D4AF37] mx-auto mt-3"></div>
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
                    'group flex items-center gap-4 px-6 py-3.5 text-xs font-semibold uppercase tracking-widest transition-all duration-300 border-l-2',
                    activo
                      ? 'border-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/15 to-transparent text-[#003366] dark:border-[#D4AF37] dark:from-[#D4AF37]/10 dark:text-white'
                      : 'border-transparent text-gray-500 hover:text-[#003366] hover:bg-white dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-transparent dark:hover:border-gray-700'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors duration-300',
                      activo ? 'text-[#003366] dark:text-[#D4AF37]' : 'text-gray-400 group-hover:text-[#003366] dark:text-gray-600 dark:group-hover:text-gray-400'
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
      <div className="border-t border-gray-200 dark:border-[#112240] p-6 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">Oficina de Registro</p>
          <p className="text-[9px] uppercase tracking-widest text-gray-500 dark:text-gray-700 mt-1">Plataforma Académica</p>
        </div>
      </div>
      </aside>
    </>
  );
}
