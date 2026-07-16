'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { Boton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function CambiarPasswordPage() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { cambiarPassword, token, usuario } = useAuthStore();

  const rutaVolver = usuario?.rol === 'DOCENTE' ? '/docente' 
                   : usuario?.rol === 'SECRETARIA' ? '/secretaria' 
                   : usuario?.rol === 'ADMINISTRADOR' ? '/periodos' // o donde el admin aterrice por defecto
                   : '/';

  if (typeof window !== 'undefined' && !token) {
    router.push('/auth/login');
    return null;
  }

  const manejarCambio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    if (nueva !== confirmacion) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      await cambiarPassword(actual, nueva);
      setMensaje('Contraseña actualizada exitosamente');
      router.replace('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A192F] flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Link href={rutaVolver} className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-[#003366] dark:hover:text-[#D4AF37] transition-colors mb-6 ml-4 sm:ml-0 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Volver al Sistema
        </Link>
        
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white dark:bg-[#020C1B] rounded-full shadow-lg border border-gray-100 dark:border-white/5">
            <KeyRound className="w-10 h-10 text-[#003366] dark:text-[#D4AF37]" />
          </div>
        </div>
        
        <h2 className="text-center text-3xl font-serif font-bold tracking-tight text-[#003366] dark:text-white">
          Cambiar Contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Actualiza tus credenciales para mantener tu cuenta segura.
        </p>

        <form onSubmit={manejarCambio} className="mt-8 bg-white dark:bg-[#050f20] py-8 px-6 sm:px-10 shadow-2xl border border-gray-100 dark:border-white/5 sm:rounded-2xl space-y-6">
          <CampoTexto 
            label="Contraseña actual" 
            type="password" 
            required 
            value={actual} 
            onChange={(e) => setActual(e.target.value)} 
            placeholder="Ingresa tu contraseña actual"
          />
          <CampoTexto 
            label="Nueva contraseña" 
            type="password" 
            required 
            value={nueva} 
            onChange={(e) => setNueva(e.target.value)} 
            placeholder="Mínimo 6 caracteres"
          />
          <CampoTexto 
            label="Confirmar nueva contraseña" 
            type="password" 
            required 
            value={confirmacion} 
            onChange={(e) => setConfirmacion(e.target.value)} 
            placeholder="Repite la nueva contraseña"
          />
          
          {mensaje && <NotificacionToast mensaje={mensaje} tipo="exito" onClose={() => setMensaje('')} />}
          {error && <NotificacionToast mensaje={error} tipo="error" onClose={() => setError('')} />}
          
          <Boton type="submit" className="w-full rounded-2xl py-3.5 bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] shadow-lg shadow-[#003366]/20 dark:shadow-[#D4AF37]/20 transition-all font-bold text-base flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Actualizar Contraseña
          </Boton>
        </form>
      </div>
    </div>
  );
}