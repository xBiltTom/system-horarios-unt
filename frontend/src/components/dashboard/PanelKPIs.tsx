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
    if (etiqueta.includes('Docentes')) return <Users className="w-5 h-5 text-[#003366] dark:text-[#D4AF37]" />;
    if (etiqueta.includes('Cursos')) return <BookOpen className="w-5 h-5 text-[#003366] dark:text-[#D4AF37]" />;
    if (etiqueta.includes('Ambientes')) return <School className="w-5 h-5 text-[#003366] dark:text-[#D4AF37]" />;
    if (etiqueta.includes('Horarios')) return <CalendarCheck className="w-5 h-5 text-[#003366] dark:text-[#D4AF37]" />;
    return <Users className="w-5 h-5 text-[#003366] dark:text-[#D4AF37]" />;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {kpis.map((kpi, idx) => (
        <Card key={idx} className="border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm rounded-2xl hover:shadow-md transition-all hover:-translate-y-1">
          <CardContent className="flex items-center p-5 gap-5">
            <div className="p-4 bg-[#F0F4F8] dark:bg-[#050f20] rounded-xl flex-shrink-0 border border-gray-100 dark:border-[#112240]">
              {kpi.icon || getIcon(kpi.etiqueta)}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">
                {kpi.etiqueta}
              </p>
              <h4 className={`text-2xl font-serif tracking-wide ${kpi.color || 'text-[#003366] dark:text-white'}`}>
                {kpi.valor}
              </h4>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}