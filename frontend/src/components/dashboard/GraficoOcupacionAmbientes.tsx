'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useThemeStore } from '@/stores/theme.store';

interface Ocupacion {
  codigo: string;
  tipo: string;
  ocupados: number;
  capacidad: number;
}

export function GraficoOcupacionAmbientes({ datos }: { datos: Ocupacion[] }) {
  const { modoOscuro } = useThemeStore();
  const data = datos.map((d) => ({
    nombre: d.codigo,
    Ocupados: d.ocupados,
    Capacidad: d.capacidad,
  }));

  const axisColor = modoOscuro ? '#9CA3AF' : '#6B7280';
  const gridColor = modoOscuro ? '#1F2937' : '#E5E7EB';

  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor} />
          <XAxis type="number" hide />
          <YAxis dataKey="nombre" type="category" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
          <Tooltip 
            cursor={{ fill: modoOscuro ? '#112240' : '#F3F4F6' }}
            contentStyle={{ 
              backgroundColor: modoOscuro ? '#020C1B' : '#ffffff',
              borderRadius: '8px', 
              border: modoOscuro ? '1px solid #112240' : '1px solid #E5E7EB', 
              color: modoOscuro ? '#fff' : '#000',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
            }} 
          />
          <Bar dataKey="Ocupados" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}