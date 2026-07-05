import { Card, CardContent } from '@/components/ui/Card';
import { Users, BookOpen, School, CalendarCheck } from 'lucide-react';

interface KPI {
  etiqueta: string;
  valor: number | string;
  color?: string;
  icon?: any;
}

export function PanelKPIs({ kpis }: { kpis: KPI[] }) {
  // Mapping icons if not provided
  const getIcon = (etiqueta: string) => {
    if (etiqueta.includes('Docentes')) return <Users className="w-6 h-6 text-blue-500" />;
    if (etiqueta.includes('Cursos')) return <BookOpen className="w-6 h-6 text-green-500" />;
    if (etiqueta.includes('Ambientes')) return <School className="w-6 h-6 text-purple-500" />;
    if (etiqueta.includes('Horarios')) return <CalendarCheck className="w-6 h-6 text-unt-accent" />;
    return <Users className="w-6 h-6 text-gray-500" />;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {kpis.map((kpi, idx) => (
        <Card key={idx} className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="flex items-center p-6 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg flex-shrink-0">
              {kpi.icon || getIcon(kpi.etiqueta)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{kpi.etiqueta}</p>
              <h4 className={`text-2xl font-bold ${kpi.color || 'text-gray-900 tracking-tight'}`}>
                {kpi.valor}
              </h4>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}