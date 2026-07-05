'use client';

import { Boton } from '@/components/ui/Boton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function HorariosFinalesSecretariaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Horarios finales</h1>
        <p className="text-sm text-gray-500">Generacion y publicacion de horarios finales para docentes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Boton type="button">Generar horario</Boton>
            <Boton type="button" variante="secundario">Enviar por correo a docentes</Boton>
            <Boton type="button" variante="secundario">Descargar todos en Excel</Boton>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Estas acciones son solo de referencia y no ejecutan procesos automaticos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
