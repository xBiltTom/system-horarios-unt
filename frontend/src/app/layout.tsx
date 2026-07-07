import { Providers } from './providers';
import { Inter, Lora } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  display: 'swap',
});

const lora = Lora({ 
  subsets: ['latin'], 
  variable: '--font-serif',
  display: 'swap',
});

export const metadata = {
  title: 'Horarios UNT',
  description: 'Sistema de Gestión de Horarios - Escuela de Ingeniería de Sistemas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${lora.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-gray-50 dark:bg-[#0A192F] text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}