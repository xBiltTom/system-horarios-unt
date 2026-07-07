import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  modoOscuro: boolean;
  toggleTema: () => void;
  setModoOscuro: (valor: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      modoOscuro: false, // Por defecto claro, como pidió el usuario
      toggleTema: () => set((state) => {
        const nuevoModo = !state.modoOscuro;
        if (typeof window !== 'undefined') {
          if (nuevoModo) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        return { modoOscuro: nuevoModo };
      }),
      setModoOscuro: (valor) => set(() => {
        if (typeof window !== 'undefined') {
          if (valor) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        return { modoOscuro: valor };
      }),
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Al recargar la página, aplicar la clase guardada
        if (state && typeof window !== 'undefined') {
          if (state.modoOscuro) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
    }
  )
);
