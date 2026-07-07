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
import { Selector } from '@/components/ui/Selector';
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

  const ocupacionTop = useMemo(() => (ocupacion || []).slice(0, 8), [ocupacion]);

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
      <div className="overflow-hidden rounded-3xl border border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#003366] to-[#0A192F] dark:from-[#050f20] dark:to-[#020C1B] px-6 py-10 text-white sm:px-10">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute left-1/4 bottom-0 h-48 w-48 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
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

            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#020C1B]/50 p-6 shadow-xl backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Filtrar por Período</p>
              <Selector
                value={idPeriodo}
                onChange={(e: any) => setIdPeriodoSeleccionado(Number(e.target.value))}
                className="w-full border-white/20 bg-white/10 text-white placeholder-gray-400 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30"
              >
                <option value={0} className="text-gray-900">-- Seleccionar período --</option>
                {periodos?.map((p: any) => (
                  <option key={p.id} value={p.id} className="text-gray-900">{p.nombre}</option>
                ))}
              </Selector>
            </div>
          </div>
        </div>
      </div>

      <PanelKPIs kpis={kpis} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-100 dark:border-[#112240] pb-5">
              <CardTitle className="text-lg font-serif tracking-wide text-[#003366] dark:text-white">Resumen Institucional</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-100 dark:border-[#112240] bg-[#F0F4F8] dark:bg-[#050f20] p-5 transition-colors">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Total Horarios</div>
                  <div className="mt-2 text-3xl font-serif text-[#003366] dark:text-[#D4AF37]">{resumen?.totalHorarios ?? 0}</div>
                  <p className="mt-1 text-xs text-gray-500 font-medium">Asignados y en borrador</p>
                </div>
                <div className="rounded-xl border border-gray-100 dark:border-[#112240] bg-[#F0F4F8] dark:bg-[#050f20] p-5 transition-colors">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Avance General</div>
                  <div className="mt-2 text-2xl font-serif text-[#003366] dark:text-[#D4AF37]">{resumen?.horariosAsignados ?? 0} / {resumen?.totalHorarios ?? 0}</div>
                  <p className="mt-1 text-xs text-gray-500 font-medium">Horarios confirmados</p>
                </div>
              </div>
              <div className="mt-6">{avanceCategoria && <GraficoAvanceCategoria datos={avanceCategoria} />}</div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            <Card className="border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm rounded-2xl">
              <CardHeader className="border-b border-gray-100 dark:border-[#112240] pb-5">
                <CardTitle className="text-lg font-serif tracking-wide text-[#003366] dark:text-white">Ocupación de Aulas</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {ocupacionTop.length > 0 && <GraficoOcupacionAmbientes datos={ocupacionTop} />}
              </CardContent>
            </Card>
            <Card className="border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm rounded-2xl">
              <CardHeader className="border-b border-gray-100 dark:border-[#112240] pb-5">
                <CardTitle className="text-lg font-serif tracking-wide text-[#003366] dark:text-white">Mapa de Uso</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {mapaCalor && <MapaCalorOcupacion dias={mapaCalor.dias} horas={mapaCalor.horas} conteo={mapaCalor.conteo} />}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar (1 col) */}
        <aside className="space-y-8">
          <Card className="border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm rounded-2xl">
            <CardHeader className="border-b border-gray-100 dark:border-[#112240] pb-5">
              <CardTitle className="text-lg font-serif tracking-wide text-[#003366] dark:text-white">Escalafón Docente</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="max-h-[320px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {(cargaDocente || []).slice(0, 8).map((item: any) => (
                  <div key={item.id} className="rounded-xl border border-gray-100 dark:border-[#112240] bg-white dark:bg-[#050f20] px-4 py-3 shadow-sm hover:border-[#D4AF37]/50 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-sm text-[#003366] dark:text-white truncate">{item.nombres} {item.apellidos}</p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">{item.porcentajeCumplimiento}%</span>
                    </div>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{item.modalidad} • {item.categoria}</p>
                    <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">{item.horasAsignadas}h asignadas / {item.horasRequeridas}h requeridas</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-[#112240] bg-white dark:bg-[#0A192F] shadow-sm rounded-2xl">
            <CardHeader className="border-b border-gray-100 dark:border-[#112240] pb-5">
              <CardTitle className="text-lg font-serif tracking-wide text-[#003366] dark:text-white">Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ActividadTiempoReal eventos={eventos} />
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-[#112240] bg-[#F0F4F8] dark:bg-[#050f20] shadow-sm rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#003366] dark:text-white">Accesos Rápidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <Boton onClick={() => window.location.href = '/docentes'} className="w-full justify-center bg-white dark:bg-[#112240] text-[#003366] dark:text-white border border-gray-200 dark:border-[#1a365d] hover:bg-gray-50 dark:hover:bg-[#0A192F] transition-all">
                  Administrar Docentes
                </Boton>
                <Boton onClick={() => window.location.href = '/horarios'} className="w-full justify-center bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] transition-all">
                  Gestor de Horarios
                </Boton>
                <Boton onClick={() => window.location.href = '/reportes'} className="w-full justify-center bg-white dark:bg-[#112240] text-[#003366] dark:text-white border border-gray-200 dark:border-[#1a365d] hover:bg-gray-50 dark:hover:bg-[#0A192F] transition-all">
                  Generar Reportes
                </Boton>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
