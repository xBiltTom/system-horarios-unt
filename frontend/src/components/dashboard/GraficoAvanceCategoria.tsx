'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface DatosAvance {
  modalidad: string;
  categoria: string;
  totalDocentes: number;
  horariosAsignados: number;
  horariosPendientes: number;
}

export function GraficoAvanceCategoria({ datos }: { datos: DatosAvance[] }) {
  const data = datos.map((d) => ({
    nombre: `${d.categoria} (${d.modalidad})`,
    Asignados: d.horariosAsignados,
    Pendientes: d.horariosPendientes,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avance por Categoría</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="Asignados" stackId="a" fill="#003366" radius={[0, 0, 4, 4]} />
            <Bar dataKey="Pendientes" stackId="a" fill="#FFD700" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}