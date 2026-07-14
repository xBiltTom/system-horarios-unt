'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { useResumen, useAvanceCategoria, useOcupacionAmbientes, useMapaCalor, useCargaDocente } from '@/hooks/useEstadisticas';

import { PanelKPIs } from '@/components/dashboard/PanelKPIs';
import { GraficoAvanceCategoria } from '@/components/dashboard/GraficoAvanceCategoria';
import { GraficoOcupacionAmbientes } from '@/components/dashboard/GraficoOcupacionAmbientes';
import { MapaCalorOcupacion } from '@/components/dashboard/MapaCalorOcupacion';

import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { Boton } from '@/components/ui/Boton';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';

export default function DashboardPage() {
  const { usuario } = useAuthStore();

  const { data: solicitudesPendientes } = useQuery({
    queryKey: ['solicitudes-pendientes-count'],
    queryFn: () => apiClient.get('/horarios/pendientes-ambiente').then(res => res.data),
    enabled: usuario?.rol === 'DIRECTOR'
  });

  const alertaAmbientes = null;

  const { data: periodoActivo, isLoading: periodoLoading } = useQuery({
    queryKey: ['periodo-activo-admin'],
    queryFn: () => periodosService.activo().then((res) => res.data),
  });

  const { data: periodos } = useQuery({
    queryKey: ['periodos-lista-admin'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const [idPeriodoSeleccionado, setIdPeriodoSeleccionado] = useState<number>(0);
  const idPeriodo = idPeriodoSeleccionado || periodoActivo?.id || 0;

  const { data: resumen, isLoading: resumenLoading } = useResumen(idPeriodo);
  const { data: avanceCategoria } = useAvanceCategoria(idPeriodo);
  const { data: ocupacion } = useOcupacionAmbientes(idPeriodo);
  const { data: mapaCalor } = useMapaCalor(idPeriodo);
  const { data: cargaDocente } = useCargaDocente(idPeriodo);


  const ocupacionTop = useMemo(() => (ocupacion || []).slice(0, 5), [ocupacion]);
  const docentesOrdenados = useMemo(() => {
    return (cargaDocente || [])
      .sort((a: any, b: any) => a.porcentajeCumplimiento - b.porcentajeCumplimiento)
      .slice(0, 8);
  }, [cargaDocente]);

  const kpis = resumen
    ? [
        { etiqueta: 'Docentes', valor: resumen.totalDocentes },
        { etiqueta: 'Cursos', valor: resumen.totalCursos },
        { etiqueta: 'Ambientes', valor: resumen.totalAmbientes },
        { etiqueta: 'Horarios asignados', valor: `${resumen.horariosAsignados} (${resumen.porcentajeAsignado}%)` },
      ]
    : [];

  const tituloPanel = usuario?.rol === 'DIRECTOR' 
    ? 'Panel de Dirección de Escuela' 
    : usuario?.rol === 'SECRETARIA' 
    ? 'Panel de Secretaría Académica' 
    : 'Centro de Mando Administrativo';

  const descripcionPanel = usuario?.rol === 'DIRECTOR'
    ? 'Supervisión de carga horaria, oferta académica y validación de límites legales por docente.'
    : 'Gestión de infraestructura, asignación de aulas y monitoreo de la programación académica.';

  if (periodoLoading || resumenLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Dossier Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#0A192F]/12 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A192F]/40 dark:text-white/40 mb-1.5">
            <span className="px-2 py-0.5 rounded-md bg-[#0A192F]/8 dark:bg-white/10 font-black tracking-widest">
              {usuario?.rol || 'SISTEMA'}
            </span>
          </div>
          <h1 className="font-serif text-[2rem] text-[#0A192F] dark:text-white tracking-tight leading-tight">{tituloPanel}</h1>
          <div className="flex flex-wrap gap-3 mt-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#0A192F]/10 dark:border-white/10">
              <p className="text-[10px] font-bold text-[#0A192F]/40 dark:text-white/40 uppercase tracking-widest">Usuario</p>
              <p className="text-xs font-semibold text-[#0A192F] dark:text-white">{usuario?.nombre || usuario?.email || 'Administrador'}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#0A192F]/10 dark:border-white/10">
              <p className="text-[10px] font-bold text-[#0A192F]/40 dark:text-white/40 uppercase tracking-widest">Período</p>
              <p className="text-xs font-semibold text-[#D4AF37]">{periodoActivo?.nombre || 'No definido'}</p>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-72 shrink-0">
          <p className="text-[10px] font-bold text-[#0A192F]/40 dark:text-white/40 uppercase tracking-widest mb-2">Filtrar por Período</p>
          <SelectorInstitucional
            value={idPeriodo}
            onChange={(val: any) => setIdPeriodoSeleccionado(Number(val))}
            opciones={(periodos || []).map((p: any) => ({ value: p.id, label: p.nombre }))}
            placeholder="-- Seleccionar período --"
          />
        </div>
      </div>

      <PanelKPIs kpis={kpis} />

      {/* Fila 1: Mapa de Uso + Alertas */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Mapa de Uso (Solo Admin/Secretaria) */}
        {usuario?.rol !== 'DIRECTOR' && (
          <Card className="lg:col-span-2 border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm rounded-2xl flex flex-col">
            <CardHeader className="border-b border-gray-100 dark:border-[#112240] pb-5 shrink-0">
              <CardTitle className="text-lg font-serif tracking-wide text-[#003366] dark:text-white">Mapa de Uso (Ocupación Global)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {mapaCalor && <MapaCalorOcupacion dias={mapaCalor.dias} horas={mapaCalor.horas} conteo={mapaCalor.conteo} />}
            </CardContent>
          </Card>
        )}

        <Card className={`${usuario?.rol === 'DIRECTOR' ? 'lg:col-span-3 h-[420px]' : 'lg:col-span-1 h-[420px]'} border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm rounded-2xl flex flex-col`}>
          <CardHeader className="border-b border-gray-100 dark:border-[#112240] pb-5 shrink-0">
            <CardTitle className="text-lg font-serif tracking-wide text-[#003366] dark:text-white">Alertas de Carga Docente</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 min-h-0">
            <div className={`h-full overflow-y-auto pr-2 custom-scrollbar ${usuario?.rol === 'DIRECTOR' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-3'}`}>
              {docentesOrdenados.map((item: any) => {
                const esCritico = item.porcentajeCumplimiento < 50;
                const colorBadge = esCritico ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-[#D4AF37]/10 text-[#D4AF37]';
                return (
                  <div key={item.id} className="rounded-xl border border-gray-100 dark:border-[#112240] bg-white dark:bg-[#050f20] px-4 py-3 shadow-sm hover:border-[#D4AF37]/50 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-sm text-[#003366] dark:text-white truncate">{item.nombres} {item.apellidos}</p>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${colorBadge}`}>
                        {item.porcentajeCumplimiento}%
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{item.modalidad} • {item.categoria}</p>
                    <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">{item.horasAsignadas}h asignadas / {item.horasRequeridas}h requeridas</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fila 2: Progreso por Categoría + Aulas Más Saturadas (side by side) */}
      <div className={`grid grid-cols-1 gap-8 ${usuario?.rol !== 'DIRECTOR' ? 'lg:grid-cols-2' : ''}`}>
        <Card className="border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm rounded-2xl flex flex-col">
          <CardHeader className="border-b border-gray-100 dark:border-[#112240] pb-5 shrink-0">
            <CardTitle className="text-lg font-serif tracking-wide text-[#003366] dark:text-white">Progreso por Categoría</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <div className="h-[300px]">
              {avanceCategoria && <GraficoAvanceCategoria datos={avanceCategoria} />}
            </div>
          </CardContent>
        </Card>

        {usuario?.rol !== 'DIRECTOR' && (
          <Card className="border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm rounded-2xl flex flex-col">
            <CardHeader className="border-b border-gray-100 dark:border-[#112240] pb-5 shrink-0">
              <CardTitle className="text-lg font-serif tracking-wide text-[#003366] dark:text-white">Aulas Más Saturadas</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex-1">
              <div className="h-[300px]">
                {ocupacionTop.length > 0 && <GraficoOcupacionAmbientes datos={ocupacionTop} />}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
