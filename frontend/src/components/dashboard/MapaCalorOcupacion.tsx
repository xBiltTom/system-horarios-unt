'use client';

interface MapaCalorProps {
  dias: string[];
  horas: string[];
  conteo: Record<string, number>;
}

const getColor = (valor: number) => {
  if (valor === 0) return 'bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-600';
  if (valor <= 2) return 'bg-[#D4AF37]/30 text-[#003366] dark:text-[#D4AF37] font-medium';
  if (valor <= 4) return 'bg-[#D4AF37] text-white font-bold shadow-sm';
  return 'bg-[#003366] dark:bg-[#4A90E2] text-white font-bold shadow-md'; 
};

export function MapaCalorOcupacion({ dias, horas, conteo }: MapaCalorProps) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="p-3 border-b border-gray-100 dark:border-[#112240] text-left text-[10px] uppercase tracking-widest text-gray-400 font-bold">Hora</th>
            {dias.map((dia) => (
              <th key={dia} className="p-3 border-b border-gray-100 dark:border-[#112240] text-center text-[10px] font-bold uppercase tracking-widest text-[#003366] dark:text-gray-300">
                {dia.slice(0,3)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {horas.map((hora) => (
            <tr key={hora} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <td className="p-3 border-b border-gray-50 dark:border-[#112240]/50 text-[11px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {hora}
              </td>
              {dias.map((dia) => {
                const key = `${dia}-${hora}`;
                const valor = conteo[key] || 0;
                return (
                  <td key={key} className="p-1 border-b border-gray-50 dark:border-[#112240]/50 text-center">
                    <div className={`mx-auto w-full min-w-[36px] max-w-[48px] rounded-md text-[11px] py-1.5 transition-all ${getColor(valor)}`}>
                      {valor}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}