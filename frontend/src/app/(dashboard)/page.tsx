'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { useAuthStore } from '@/stores/auth.store';

export default function Dashboard() {
	const router = useRouter();
	const { usuario, estaCargando } = useAuthStore();

	useEffect(() => {
		if (!estaCargando && usuario) {
			if (usuario.rol === 'SECRETARIA') {
				router.replace('/secretaria');
			} else if (usuario.rol === 'DOCENTE') {
				router.replace('/docente');
			} else {
				router.replace('/admin');
			}
		}
	}, [estaCargando, router, usuario]);

	return <SpinnerCarga />;
}
