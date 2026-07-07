'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useThemeStore } from '@/stores/theme.store';

interface DatosAvance {
  modalidad: string;
  categoria: string;
  totalDocentes: number;
  horariosAsignados: number;
  horariosPendientes: number;
}

export function GraficoAvanceCategoria({ datos }: { datos: DatosAvance[] }) {
  const { modoOscuro } = useThemeStore();
  const data = datos.map((d) => ({
    nombre: `${d.categoria.slice(0,3)} (${d.modalidad.slice(0,1)})`,
    Asignados: d.horariosAsignados,
    Pendientes: d.horariosPendientes,
  }));

  const axisColor = modoOscuro ? '#9CA3AF' : '#6B7280';
  const gridColor = modoOscuro ? '#1F2937' : '#E5E7EB';

  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
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
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
          <Bar dataKey="Asignados" stackId="a" fill="#003366" radius={[0, 0, 4, 4]} />
          <Bar dataKey="Pendientes" stackId="a" fill="#D4AF37" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}