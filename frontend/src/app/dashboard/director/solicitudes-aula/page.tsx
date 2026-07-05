'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { AlertTriangle, Clock, MapPin } from 'lucide-react';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';

export default function SolicitudesAulaPage() {
  const { data: solicitudes, isLoading } = useQuery({
    queryKey: ['solicitudes-aula'],
    queryFn: () => apiClient.get('/horarios/pendientes-ambiente').then(res => res.data)
  });

  if (isLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Solicitudes de Aula</h1>
        <p className="text-gray-500 text-sm">Horarios confirmados por docentes que requieren la asignación de un ambiente físico.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {solicitudes?.map((sol: any) => (
          <Card key={sol.id} className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-bold text-sm">Pendiente</span>
                </div>
                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase">
                  {sol.dia_semana}
                </span>
              </div>
              
              <h3 className="font-bold text-slate-800">{sol.componente.oferta.curso.nombre}</h3>
              <p className="text-xs text-slate-500 mb-4">{sol.componente.tipo} - Grupo {sol.grupo.codigo}</p>
              
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{sol.hora_inicio} - {sol.hora_fin}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Ambiente por asignar</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t">
                <p className="text-[10px] text-gray-400">Docente: {sol.docente.apellidos}, {sol.docente.nombres}</p>
              </div>
            </CardContent>
          </Card>
        ))}

        {solicitudes?.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed">
            <p className="text-gray-500">No hay solicitudes de aula pendientes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
