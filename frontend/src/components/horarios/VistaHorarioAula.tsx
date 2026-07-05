'use client';
import { cn } from '@/lib/utilidades';

interface HorarioAula {
  id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  componente: { tipo: string; oferta: { curso: { nombre: string; codigo: string } } } | null;
  docente: { nombres: string; apellidos: string } | null;
  grupo: { codigo: string } | null;
  estado: string;
}

interface VistaHorarioAulaProps {
  horarios: HorarioAula[];
}

const diasOrden = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const horas = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
];

export function VistaHorarioAula({ horarios }: VistaHorarioAulaProps) {
  const obtenerHorarios = (dia: string, hora: string) =>
    horarios.filter((h) => h.dia_semana === dia && h.hora_inicio === hora);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-xs">
        <thead>
          <tr>
            <th className="border px-2 py-1 bg-gray-100">Hora</th>
            {diasOrden.map((dia) => (
              <th key={dia} className="border px-2 py-1 bg-gray-100">
                {dia.slice(0, 3)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {horas.map((hora) => {
            const horaFin = `${(parseInt(hora.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;
            return (
              <tr key={hora}>
                <td className="border px-2 py-1 text-center font-medium w-32">{hora} - {horaFin}</td>
                {diasOrden.map((dia) => {
                const items = obtenerHorarios(dia, hora);
                const hasItems = items.length > 0;
                return (
                  <td
                    key={dia + hora}
                    className={cn(
                      'border px-2 py-1 text-center',
                      hasItems ? 'bg-blue-50' : ''
                    )}
                  >
                    {hasItems && (
                      <div className="flex flex-col gap-1">
                        {items.map((h, idx) => (
                          <div key={idx} className="p-1 rounded bg-blue-100/50 border border-blue-200">
                            <p className="font-semibold">{h.componente?.oferta?.curso?.nombre || 'Sin curso'}</p>
                            <p className="text-[10px] text-gray-600">
                              {h.docente?.nombres} {h.docente?.apellidos}
                            </p>
                            <p className="italic text-[9px] text-gray-500">
                              {h.componente?.tipo || ''}{h.grupo?.codigo ? ` - G${h.grupo.codigo}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
