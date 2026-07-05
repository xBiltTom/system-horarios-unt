import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#0A192F] selection:bg-[#D4AF37] selection:text-[#0A192F] flex flex-col font-sans">
      {/* Top Banner - Utility */}
      <div className="w-full bg-[#0A192F] text-white py-2 px-6 text-[10px] uppercase tracking-[0.2em] font-semibold flex justify-between items-center">
        <span>Universidad Nacional de Trujillo</span>
        <span>Oficina de Registro y Asuntos Académicos</span>
      </div>

      {/* Main Navigation - Institutional */}
      <header className="w-full border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <img 
              src="/logo-unt1.png" 
              alt="Sello de la Universidad Nacional de Trujillo" 
              className="h-24 w-auto object-contain"
            />
            <div className="flex flex-col border-l border-gray-300 pl-6 py-2">
              <span className="font-serif text-2xl md:text-3xl text-[#0A192F] tracking-tight">Escuela de Ingeniería de Sistemas</span>
              <span className="text-xs uppercase tracking-[0.25em] text-gray-500 font-bold mt-1">Facultad de Ingeniería</span>
            </div>
          </div>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-gray-500 items-center">
            <a href="#modulos" className="hover:text-[#0A192F] transition-colors hidden sm:block">Catálogo</a>
            <a href="#auditoria" className="hover:text-[#0A192F] transition-colors hidden sm:block">Auditoría</a>
            <Link href="/auth/login" className="text-[#0A192F] border-b-2 border-transparent hover:border-[#D4AF37] transition-all pb-1">
              Acceso Docente
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 flex flex-col">
        {/* Hero - Classic Academic */}
        <section className="py-24 md:py-36 flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-center gap-4">
             <div className="h-px w-12 bg-gray-300"></div>
             <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#D4AF37]">Sistema Institucional</span>
             <div className="h-px w-12 bg-gray-300"></div>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl text-[#0A192F] leading-[1.05] mb-8">
            Programación Académica <br/>
            <span className="italic text-gray-500 font-light">&amp; Carga Horaria</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 font-serif leading-relaxed max-w-2xl mb-12">
            Plataforma oficial para la gestión de recursos de infraestructura, asignación de carga lectiva y estructuración de horarios del periodo 2026.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link href="/auth/login">
              <button className="bg-[#0A192F] text-white px-10 py-5 text-xs font-bold uppercase tracking-[0.2em] border border-[#0A192F] hover:bg-white hover:text-[#0A192F] transition-all duration-300 flex items-center gap-3">
                Ingresar al Portal <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </section>

        {/* Catalog Layout - Syllabus style */}
        <section id="modulos" className="pb-32 grid md:grid-cols-12 gap-12 md:gap-20">
          <div className="md:col-span-4">
            <h2 className="font-serif text-3xl text-[#0A192F] mb-6 border-b-2 border-[#D4AF37] pb-4 inline-block">El Catálogo</h2>
            <p className="text-sm text-gray-600 leading-relaxed font-serif">
              El sistema establece reglas de concurrencia estrictas sobre los horarios, aforos de laboratorio y carga reglamentaria. Las operaciones en los siguientes módulos son registradas de manera permanente.
            </p>
          </div>

          <div className="md:col-span-8">
            <div className="border-t border-[#0A192F]">
              {/* Row 1 */}
              <div className="py-10 border-b border-gray-200 grid sm:grid-cols-3 gap-6 group">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                  Módulo 01 <br/> // Docencia
                </div>
                <div className="sm:col-span-2">
                  <h3 className="font-serif text-2xl text-[#0A192F] mb-3 group-hover:text-[#D4AF37] transition-colors">Declaración de Carga Docente</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Acceso exclusivo para personal docente nombrado y contratado. Permite la selección concurrente de asignaturas y declaración de horas no lectivas (investigación, tutoría y extensión) según escalafón.
                  </p>
                </div>
              </div>

              {/* Row 2 */}
              <div className="py-10 border-b border-gray-200 grid sm:grid-cols-3 gap-6 group">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                  Módulo 02 <br/> // Infraestructura
                </div>
                <div className="sm:col-span-2">
                  <h3 className="font-serif text-2xl text-[#0A192F] mb-3 group-hover:text-[#D4AF37] transition-colors">Gestión de Ambientes</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Administración del inventario físico de la Facultad. Control de aulas teóricas y laboratorios de cómputo con validación algorítmica de aforo máximo y prevención absoluta de cruces.
                  </p>
                </div>
              </div>

              {/* Row 3 */}
              <div className="py-10 border-b border-gray-200 grid sm:grid-cols-3 gap-6 group">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                  Módulo 03 <br/> // Registro
                </div>
                <div className="sm:col-span-2">
                  <h3 className="font-serif text-2xl text-[#0A192F] mb-3 group-hover:text-[#D4AF37] transition-colors">Programación y Auditoría</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Panel de dirección para la habilitación de ventanas de atención por antigüedad docente. Emisión de reportes matriciales en formatos estándar (PDF/XLSX) y resolución manual de conflictos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Deep Footer */}
      <footer id="auditoria" className="w-full bg-[#0A192F] text-white py-16">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="flex items-center gap-6">
            <img src="/logo-unt1.png" alt="Sello UNT" className="h-16 w-auto brightness-0 invert opacity-70" />
            <div className="text-[11px] text-gray-400 leading-relaxed">
              <p className="font-bold text-white uppercase tracking-[0.15em] mb-1">Universidad Nacional de Trujillo</p>
              <p>Escuela Profesional de Ingeniería de Sistemas</p>
              <p className="mt-2">Ciudad Universitaria - Av. Juan Pablo II s/n.</p>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-gray-500 text-left md:text-right">
            <p>&copy; {new Date().getFullYear()} Todos los derechos reservados.</p>
            <p className="mt-2 text-[#D4AF37]">Sistema de uso interno. Acceso restringido.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}