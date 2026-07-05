'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface Ocupacion {
  codigo: string;
  tipo: string;
  ocupados: number;
  capacidad: number;
}

export function GraficoOcupacionAmbientes({ datos }: { datos: Ocupacion[] }) {
  const data = datos.map((d) => ({
    nombre: d.codigo,
    Ocupados: d.ocupados,
    Capacidad: d.capacidad,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ocupación de Ambientes</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
            />
            <Bar dataKey="Ocupados" fill="#003366" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}