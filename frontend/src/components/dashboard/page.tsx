'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { useResumen, useAvanceCategoria, useOcupacionAmbientes, useMapaCalor, useCargaDocente } from '@/hooks/useEstadisticas';
import { useActividadTiempoReal } from '@/hooks/useActividadTiempoReal';
import { PanelKPIs } from '@/components/dashboard/PanelKPIs';
import { GraficoAvanceCategoria } from '@/components/dashboard/GraficoAvanceCategoria';
import { GraficoOcupacionAmbientes } from '@/components/dashboard/GraficoOcupacionAmbientes';
import { MapaCalorOcupacion } from '@/components/dashboard/MapaCalorOcupacion';
import { ActividadTiempoReal } from '@/components/dashboard/ActividadTiempoReal';
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
  const eventos = useActividadTiempoReal();

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
      {/* Hero Banner */}
      <div className="relative rounded-3xl border border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm">
        {/* Background with hidden overflow for decorative blurs */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E5A99] to-[#003366] dark:from-[#050f20] dark:to-[#020C1B] pointer-events-none">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute left-1/4 bottom-0 h-48 w-48 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        </div>

        {/* Content layer allowing dropdowns to escape */}
        <div className="relative z-10 px-6 py-10 text-white sm:px-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                {usuario?.rol || 'SISTEMA'}
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-serif tracking-wide sm:text-4xl text-white">{tituloPanel}</h1>
                <p className="text-sm leading-relaxed text-gray-300 sm:text-base font-light max-w-2xl">
                  {descripcionPanel}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Usuario Activo</p>
                  <p className="mt-1 text-sm font-semibold text-white tracking-wide">{usuario?.nombre || usuario?.email || 'Administrador'}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Período Actual</p>
                  <p className="mt-1 text-sm font-semibold text-[#D4AF37] tracking-wide">{periodoActivo?.nombre || 'No definido'}</p>
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-3">Filtrar por Período</p>
              <SelectorInstitucional
                value={idPeriodo}
                onChange={(val: any) => setIdPeriodoSeleccionado(Number(val))}
                opciones={(periodos || []).map((p: any) => ({ value: p.id, label: p.nombre }))}
                placeholder="-- Seleccionar período --"
              />
            </div>
          </div>
        </div>
      </div>

      <PanelKPIs kpis={kpis} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* FILA 1: Mapa (2/3) y Alertas (1/3) */}
        <Card className="lg:col-span-2 border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm rounded-2xl flex flex-col">
          <CardHeader className="border-b border-gray-100 dark:border-[#112240] pb-5 shrink-0">
            <CardTitle className="text-lg font-serif tracking-wide text-[#003366] dark:text-white">Mapa de Uso (Ocupación Global)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {mapaCalor && <MapaCalorOcupacion dias={mapaCalor.dias} horas={mapaCalor.horas} conteo={mapaCalor.conteo} />}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm rounded-2xl flex flex-col">
          <CardHeader className="border-b border-gray-100 dark:border-[#112240] pb-5 shrink-0">
            <CardTitle className="text-lg font-serif tracking-wide text-[#003366] dark:text-white">Alertas de Carga Docente</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 min-h-0">
            <div className="h-full space-y-3 overflow-y-auto pr-2 custom-scrollbar">
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

        {/* FILA 2: Progreso (1/3), Aulas (1/3) y Actividad (1/3) */}
        <Card className="lg:col-span-1 border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm rounded-2xl flex flex-col">
          <CardHeader className="border-b border-gray-100 dark:border-[#112240] pb-5 shrink-0">
            <CardTitle className="text-lg font-serif tracking-wide text-[#003366] dark:text-white">Progreso por Categoría</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <div className="h-[280px]">
              {avanceCategoria && <GraficoAvanceCategoria datos={avanceCategoria} />}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm rounded-2xl flex flex-col">
          <CardHeader className="border-b border-gray-100 dark:border-[#112240] pb-5 shrink-0">
            <CardTitle className="text-lg font-serif tracking-wide text-[#003366] dark:text-white">Aulas Más Saturadas</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <div className="h-[280px]">
              {ocupacionTop.length > 0 && <GraficoOcupacionAmbientes datos={ocupacionTop} />}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm rounded-2xl flex flex-col">
          <CardHeader className="border-b border-gray-100 dark:border-[#112240] pb-5 shrink-0">
            <CardTitle className="text-lg font-serif tracking-wide text-[#003366] dark:text-white">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 min-h-0">
            <ActividadTiempoReal eventos={eventos} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
