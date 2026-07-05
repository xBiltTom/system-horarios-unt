'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface MapaCalorProps {
  dias: string[];
  horas: string[];
  conteo: Record<string, number>;
}

const getColor = (valor: number) => {
  if (valor === 0) return 'bg-[#F3F4F6] text-gray-400'; // Grises claro para 0
  if (valor <= 2) return 'bg-[#FEF08A] text-gray-800'; // Amarillo
  if (valor <= 4) return 'bg-[#FDBA74] text-gray-900'; // Naranja
  return 'bg-[#FCA5A5] text-red-900 font-medium'; // Rojo
};

export function MapaCalorOcupacion({ dias, horas, conteo }: MapaCalorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Calor de Ocupación</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="p-2 border-b border-gray-100 text-left text-gray-500 font-medium">Hora</th>
              {dias.map((dia) => (
                <th key={dia} className="p-2 border-b border-gray-100 text-center text-gray-500 font-medium uppercase text-xs tracking-wider">
                  {dia.slice(0,3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horas.map((hora) => (
              <tr key={hora} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-2 border-b border-gray-50 text-gray-600 font-medium text-xs whitespace-nowrap">
                  {hora}
                </td>
                {dias.map((dia) => {
                  const key = `${dia}-${hora}`;
                  const valor = conteo[key] || 0;
                  return (
                    <td key={key} className="p-1 border-b border-gray-50 text-center">
                      <div className={`mx-auto w-full max-w-[40px] rounded text-xs py-1 transition-colors ${getColor(valor)}`}>
                        {valor}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}