'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layouts/Sidebar';
import { BarraSuperior } from '@/components/layouts/BarraSuperior';
import { NanoChatbot } from '@/components/layouts/NanoChatbot';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { useRefreshTokenSilent } from '@/hooks/useRefreshTokenSilent';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { estaAutenticado, estaCargando, token, usuario } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Refresh token silently
  useRefreshTokenSilent();

  // Wait until the component is mounted on the client to avoid server/client markup drift
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Redirect if no token (client‑only)
  useEffect(() => {
    if (mounted && !token) {
      router.push('/auth/login');
    }
  }, [mounted, token, router]);

  // Role‑based route protection (client‑only)
  useEffect(() => {
    if (!mounted) return;
    if (!estaAutenticado || !usuario) return;

    const rutasAdmin = ['/admin', '/ambientes', '/configuracion', '/cursos', '/docentes', '/periodos', '/reportes', '/director'];
    const esRutaAdmin = rutasAdmin.some((ruta) => pathname.startsWith(`/dashboard${ruta}`));
    const esRutaSecretaria = pathname.startsWith('/secretaria');

    if (pathname === '/') {
      if (usuario.rol === 'DOCENTE') router.replace('/docente');
      else if (usuario.rol === 'SECRETARIA') router.replace('/secretaria');
      else router.replace('/admin');
      return;
    }

    if (usuario.rol === 'DOCENTE' && (esRutaAdmin || esRutaSecretaria || pathname === '/admin')) {
      router.replace('/docente');
      return;
    }

    if (usuario.rol === 'SECRETARIA' && (pathname.startsWith('/admin') || pathname.startsWith('/director'))) {
      router.replace('/secretaria');
      return;
    }
  }, [mounted, estaAutenticado, usuario, pathname, router]);

  // While auth state is loading or before mounting, show a spinner that matches on server and client
  if (!mounted || estaCargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#020813]">
        <SpinnerCarga />
      </div>
    );
  }

  // If still no token after mounting, render nothing (redirect will occur)
  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-[#020813] transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 w-full md:pl-[280px] transition-all duration-300">
        <div className="px-4 pt-4 md:px-6 md:pt-6">
          <BarraSuperior />
        </div>
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-[1600px] mx-auto w-full">{children}</div>
        </main>
      </div>
      <NanoChatbot />
    </div>
  );
}
