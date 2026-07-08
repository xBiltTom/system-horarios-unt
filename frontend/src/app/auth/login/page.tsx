'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { ShieldCheck, Lock, Mail, ChevronRight, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  
  // Estado global para el modo oscuro
  const { modoOscuro, toggleTema } = useThemeStore();
  
  const router = useRouter();
  const { iniciarSesion, estaAutenticado, token, cargarSesion } = useAuthStore();

  const redirigirSegunRol = () => {
    const rol = useAuthStore.getState().usuario?.rol;
    if (rol === 'DOCENTE') {
      router.push('/docente');
    } else if (rol === 'SECRETARIA') {
      router.push('/secretaria');
    } else if (rol === 'DIRECTOR') {
      router.push('/director');
    } else if (rol === 'ADMINISTRADOR') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  useEffect(() => {
    if (token) {
      if (!estaAutenticado) {
        cargarSesion().then(() => {
          if (useAuthStore.getState().estaAutenticado) {
            redirigirSegunRol();
          }
        });
      } else {
        redirigirSegunRol();
      }
    }
  }, [token, estaAutenticado, router, cargarSesion]);

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await iniciarSesion(email, password);
      redirigirSegunRol();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-500 selection:bg-[#D4AF37] selection:text-[#0A192F] ${modoOscuro ? 'bg-[#020C1B]' : 'bg-white'}`}>
      
      {/* Left Side: Heritage Institutional (Siempre oscuro para mantener el contraste de la marca) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0A192F] flex-col justify-between p-14 border-r border-[#112240] shadow-[20px_0_50px_rgba(0,0,0,0.1)] z-10">
        
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>

        <div className="relative z-10">
          <img 
            src="/logo-unt1.png" 
            alt="Sello UNT" 
            className="h-28 w-auto opacity-90 mb-16"
          />
          <div className="space-y-6">
            <h1 className="font-serif text-5xl lg:text-6xl text-white tracking-tight leading-[1.1]">
              Plataforma <br/> <span className="text-[#D4AF37] italic font-light">Académica</span>
            </h1>
            <p className="text-gray-400 font-serif text-lg max-w-md leading-relaxed">
              Gestión centralizada de recursos, aulas y asignaciones horarias. El acceso a esta plataforma está estrictamente restringido al personal docente y directivo.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-2">
          <div className="w-12 h-px bg-[#D4AF37] mb-2"></div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
            Universidad Nacional de Trujillo
          </p>
          <p className="text-[10px] uppercase tracking-widest text-gray-600">
            Escuela Profesional de Ingeniería de Sistemas
          </p>
        </div>
      </div>

      {/* Right Side: Login Portal */}
      <div className={`w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-20 relative transition-colors duration-500`}>
        
        {/* Botón de Modo Oscuro/Claro */}
        <button 
          onClick={toggleTema}
          className={`absolute top-6 right-6 md:top-10 md:right-10 p-3 rounded-full transition-all duration-300 ${
            modoOscuro 
              ? 'bg-[#112240] text-[#D4AF37] hover:bg-[#1a365d] hover:scale-110' 
              : 'bg-gray-100 text-[#0A192F] hover:bg-gray-200 hover:scale-110'
          }`}
          title={modoOscuro ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
        >
          {modoOscuro ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="w-full max-w-sm">
          
          <div className="mb-14 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-8">
              <img 
                src="/logo-unt1.png" 
                alt="Sello UNT" 
                className="h-20 w-auto"
              />
            </div>
            <div className="flex items-center gap-3 justify-center lg:justify-start mb-4">
               <ShieldCheck className={`w-5 h-5 ${modoOscuro ? 'text-[#D4AF37]' : 'text-[#0A192F]'}`} />
               <span className={`text-sm font-bold uppercase tracking-[0.25em] ${modoOscuro ? 'text-[#D4AF37]' : 'text-[#0A192F]'}`}>
                 Autenticación
               </span>
            </div>
            <h2 className={`font-serif text-3xl mb-2 transition-colors ${modoOscuro ? 'text-white' : 'text-[#0A192F]'}`}>
              Portal de Acceso
            </h2>
            <p className={`text-base font-serif transition-colors ${modoOscuro ? 'text-gray-500' : 'text-gray-600'}`}>
              Ingrese sus credenciales institucionales.
            </p>
          </div>

          <form onSubmit={manejarSubmit} className="space-y-8">
            
            <div className="space-y-6">
              <div className="relative group">
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 transition-colors ${modoOscuro ? 'text-gray-600 group-focus-within:text-[#D4AF37]' : 'text-gray-400 group-focus-within:text-[#0A192F]'}`}>
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="Correo Electrónico"
                  className={`w-full pl-10 pr-4 py-3 bg-transparent border-b outline-none rounded-none text-base transition-colors
                    ${modoOscuro 
                      ? 'border-[#112240] focus:border-[#D4AF37] text-white placeholder:text-gray-700' 
                      : 'border-gray-300 focus:border-[#0A192F] text-[#0A192F] placeholder:text-gray-400'
                    }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative group">
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 transition-colors z-10 ${modoOscuro ? 'text-gray-600 group-focus-within:text-[#D4AF37]' : 'text-gray-400 group-focus-within:text-[#0A192F]'}`}>
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  required
                  placeholder="Contraseña"
                  className={`w-full pl-10 pr-12 py-3 bg-transparent border-b outline-none rounded-none text-base transition-colors [&::-ms-reveal]:hidden [&::-ms-clear]:hidden
                    ${modoOscuro 
                      ? 'border-[#112240] focus:border-[#D4AF37] text-white placeholder:text-gray-700' 
                      : 'border-gray-300 focus:border-[#0A192F] text-[#0A192F] placeholder:text-gray-400'
                    }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className={`absolute right-0 top-1/2 -translate-y-1/2 transition-colors z-10 ${modoOscuro ? 'text-gray-600 hover:text-[#D4AF37]' : 'text-gray-400 hover:text-[#0A192F]'}`}
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className={`p-4 border-l-2 text-xs font-medium flex items-center gap-3 ${modoOscuro ? 'bg-red-950/20 border-red-900/50 text-red-400' : 'bg-red-50 border-red-500 text-red-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${modoOscuro ? 'bg-red-500' : 'bg-red-600'}`}></span>
                {error}
              </div>
            )}

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={cargando} 
                className={`w-full py-4 text-sm font-bold uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:bg-opacity-100
                  ${modoOscuro 
                    ? 'bg-white text-[#0A192F] hover:bg-[#D4AF37] hover:text-[#0A192F]' 
                    : 'bg-[#0A192F] text-white hover:bg-[#D4AF37] hover:text-[#0A192F] border border-[#0A192F] hover:border-[#D4AF37]'
                  }`}
              >
                {cargando ? (
                  <span className="flex items-center gap-3">
                    <div className={`w-4 h-4 border-2 rounded-full animate-spin ${modoOscuro ? 'border-[#0A192F]/20 border-t-[#0A192F]' : 'border-white/20 border-t-white'}`}></div>
                    Verificando
                  </span>
                ) : (
                  <>
                    Iniciar Sesión
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-col items-center gap-6 mt-12">
              <Link href="/auth/recuperar-password" className={`text-sm font-serif italic transition-colors ${modoOscuro ? 'text-gray-500 hover:text-[#D4AF37]' : 'text-gray-500 hover:text-[#0A192F]'}`}>
                ¿Olvidó su contraseña institucional?
              </Link>
              <div className={`w-full h-px bg-gradient-to-r from-transparent to-transparent ${modoOscuro ? 'via-[#112240]' : 'via-gray-200'}`}></div>
              <Link href="/" className={`text-xs font-bold uppercase tracking-[0.2em] transition-colors ${modoOscuro ? 'text-gray-600 hover:text-white' : 'text-gray-400 hover:text-[#0A192F]'}`}>
                Retornar al Catálogo
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}