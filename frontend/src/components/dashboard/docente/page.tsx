'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { periodosService } from '@/services/periodos.service';
import { useResumenDocente } from '@/hooks/useEstadisticas';
import { reportesService, descargarBlob } from '@/services/reportes.service';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { Boton } from '@/components/ui/Boton';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/auth.store';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { cn } from '@/lib/utilidades';
import {
  BookOpen,
  Clock,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileText,
  Compass,
  FileSpreadsheet,
} from 'lucide-react';

export default function DashboardDocentePage() {
  const router = useRouter();
  const { usuario } = useAuthStore();
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);

  useEffect(() => {
    router.prefetch('/horarios/seleccion');
    router.prefetch('/horarios/vista-docente');
    router.prefetch('/notificaciones/preferencias');
    router.prefetch('/docente/carga-no-lectiva');
  }, [router]);

  // Si el usuario no es docente, redirigir al dashboard administrativo
  useEffect(() => {
    if (usuario && usuario.rol !== 'DOCENTE') {
      router.replace('/admin');
    }
  }, [usuario, router]);

  const nombreDocente = usuario?.docente?.nombres || usuario?.nombre || 'Docente';
  const apellidoDocente = usuario?.docente?.apellidos || '';
  const docenteId = usuario?.idDocente || 0;

  const { data: periodoActivo, isLoading: periodoLoading } = useQuery({
    queryKey: ['periodo-activo-docente-dashboard'],
    queryFn: () => periodosService.activo().then((res) => res.data),
  });

  const { data: periodos } = useQuery({
    queryKey: ['periodos-lista-docente-dashboard'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const [idPeriodoSeleccionado, setIdPeriodoSeleccionado] = useState<number>(0);
  const idPeriodo = idPeriodoSeleccionado || periodoActivo?.id || 0;

  const { data: resumen, isLoading: resumenLoading } = useResumenDocente(docenteId, idPeriodo);

  const [descargando, setDescargando] = useState<'pdf' | 'excel' | null>(null);
  const [exportOption, setExportOption] = useState<'completo' | 'carga-lectiva' | 'carga-no-lectiva'>('completo');

  const handleDescargarReporte = async (tipo: 'pdf' | 'excel') => {
    if (!idPeriodo || !docenteId) return;
    setDescargando(tipo);
    try {
      const response = tipo === 'pdf'
        ? await reportesService.pdfDocente(docenteId, idPeriodo, exportOption)
        : await reportesService.excelDocente(docenteId, idPeriodo, exportOption);
      const nombre = `${apellidoDocente.replace(/\s+/g, '_')}_${nombreDocente.replace(/\s+/g, '_')}`;
      descargarBlob(response.data, `horario_${nombre}.${tipo === 'pdf' ? 'pdf' : 'xlsx'}`);
      setToast({ mensaje: 'Reporte descargado correctamente', tipo: 'exito' });
    } catch (err: any) {
      setToast({ mensaje: 'Error al generar reporte. Inténtelo de nuevo.', tipo: 'error' });
    } finally {
      setDescargando(null);
    }
  };

  if (periodoLoading || resumenLoading) return <SpinnerCarga />;

  const proximaVentana = resumen?.proximaVentana;
  let bannerElement = null;

  if (proximaVentana) {
    // Obtenemos la fecha y hora actual en Lima usando Intl.DateTimeFormat para máxima robustez
    const getLimaParts = (date: Date) => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Lima',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
      }).formatToParts(date);
      const find = (type: string) => Number(parts.find(p => p.type === type)?.value);
      return { y: find('year'), m: find('month') - 1, d: find('day'), h: find('hour'), min: find('minute') };
    };

    const lp = getLimaParts(new Date());
    const ahoraLima = new Date(lp.y, lp.m, lp.d, lp.h, lp.min, 0);
    
    const pFecha = new Date(proximaVentana.fecha);
    const y = pFecha.getUTCFullYear();
    const m = pFecha.getUTCMonth();
    const d = pFecha.getUTCDate();
    const [hIni, mIni] = proximaVentana.horaInicio.split(':').map(Number);
    const [hFin, mFin] = proximaVentana.horaFin.split(':').map(Number);
    
    // Comparamos en el mismo espacio "local" del navegador
    const fechaInicio = new Date(y, m, d, hIni, mIni, 0);
    const fechaFin = new Date(y, m, d, hFin, mFin, 0);

    const activa = ahoraLima >= fechaInicio && ahoraLima <= fechaFin;
    const futura = ahoraLima < fechaInicio;

    if (activa) {
      bannerElement = (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md animate-pulse">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-100 flex-shrink-0" />
            <div>
              <p className="font-bold text-base">¡Tu ventana de atención está activa!</p>
              <p className="text-sm text-emerald-50">
                Puedes registrar y modificar tu horario. Finaliza hoy a las {proximaVentana.horaFin}.
              </p>
            </div>
          </div>
          <Boton
            onClick={() => router.push('/horarios/seleccion')}
            className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-6 py-2 border-none shadow-sm flex-shrink-0 w-full md:w-auto"
          >
            Elegir mi Horario
          </Boton>
        </div>
      );
    } else if (futura) {
      const formattedDate = pFecha.toLocaleDateString('es-PE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      bannerElement = (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-indigo-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-slate-800 text-base">Próxima Ventana de Atención Programada</p>
              <p className="text-sm text-slate-600">
                Tu turno es el <span className="font-semibold text-indigo-700">{formattedDate}</span> desde las{' '}
                <span className="font-semibold text-indigo-700">{proximaVentana.horaInicio}</span> hasta las{' '}
                <span className="font-semibold text-indigo-700">{proximaVentana.horaFin}</span>.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full flex-shrink-0">
            Pendiente
          </span>
        </div>
      );
    } else {
      bannerElement = (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm text-slate-600">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-slate-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-700">Tu ventana de atención finalizó</p>
              <p className="text-sm">
                El plazo para registrar tu horario de forma directa ha terminado el {pFecha.toLocaleDateString('es-PE')} a las {proximaVentana.horaFin}.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-200 px-3 py-1 rounded-full flex-shrink-0">
            Cerrado
          </span>
        </div>
      );
    }
  } else {
    bannerElement = (
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm text-amber-800">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-semibold">Sin ventana de atención configurada</p>
            <p className="text-sm">
              No tienes un turno asignado para el periodo actual. Comunícate con secretaría si necesitas registrar tu horario.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-100 px-3 py-1 rounded-full flex-shrink-0">
          No Asignado
        </span>
      </div>
    );
  }

  const horasRequeridas = resumen?.horasRequeridas ?? 0;
  const horasAsignadas = resumen?.horasAsignadas ?? 0;
  const porcentaje = resumen?.porcentaje ?? 0;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Dossier Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#0A192F]/12 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A192F]/40 dark:text-white/40 mb-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Portal Docente</span>
          </div>
          <h1 className="font-serif text-[2rem] text-[#0A192F] dark:text-white tracking-tight leading-tight">{nombreDocente}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="px-3 py-1 rounded-lg border border-[#0A192F]/10 dark:border-white/10 text-[11px] font-bold text-[#0A192F]/60 dark:text-white/50">
              Categoría: <span className="text-[#0A192F] dark:text-white">{resumen?.docente?.categoria || 'N/A'}</span>
            </span>
            <span className="px-3 py-1 rounded-lg border border-[#0A192F]/10 dark:border-white/10 text-[11px] font-bold text-[#0A192F]/60 dark:text-white/50">
              Modalidad: <span className="text-[#0A192F] dark:text-white">{resumen?.docente?.modalidad || 'N/A'}</span>
            </span>
          </div>
        </div>
        <div className="w-full lg:w-72 shrink-0">
          <p className="text-[10px] font-bold text-[#0A192F]/40 dark:text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Período en Consulta
          </p>
          <SelectorInstitucional
            value={idPeriodo}
            onChange={(val: any) => setIdPeriodoSeleccionado(Number(val))}
            opciones={periodos?.map((p: any) => ({
              value: p.id,
              label: p.nombre,
            })) || []}
            placeholder="-- Seleccionar período --"
          />
        </div>
      </div>

      {/* ESTADO DE LA VENTANA DE ATENCIÓN (ALERTAS) */}
      {proximaVentana ? (
        (() => {
          const getLimaParts = (date: Date) => {
            const parts = new Intl.DateTimeFormat('en-US', {
              timeZone: 'America/Lima',
              year: 'numeric', month: 'numeric', day: 'numeric',
              hour: 'numeric', minute: 'numeric', second: 'numeric',
              hour12: false
            }).formatToParts(date);
            const find = (type: string) => Number(parts.find(p => p.type === type)?.value);
            return { y: find('year'), m: find('month') - 1, d: find('day'), h: find('hour'), min: find('minute') };
          };
      
          const lp = getLimaParts(new Date());
          const ahoraLima = new Date(lp.y, lp.m, lp.d, lp.h, lp.min, 0);
          
          const pFecha = new Date(proximaVentana.fecha);
          const y = pFecha.getUTCFullYear();
          const m = pFecha.getUTCMonth();
          const d = pFecha.getUTCDate();
          const [hIni, mIni] = proximaVentana.horaInicio.split(':').map(Number);
          const [hFin, mFin] = proximaVentana.horaFin.split(':').map(Number);
          
          const fechaInicio = new Date(y, m, d, hIni, mIni, 0);
          const fechaFin = new Date(y, m, d, hFin, mFin, 0);
      
          const activa = ahoraLima >= fechaInicio && ahoraLima <= fechaFin;
          const futura = ahoraLima < fechaInicio;

          if (activa) {
            return (
              <div className="relative overflow-hidden rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="flex items-center gap-6 relative z-10">
                  <div className="p-5 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)] dark:shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-pulse">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-emerald-900 dark:text-white tracking-tight">¡Tu ventanilla está abierta!</h3>
                    <p className="text-emerald-700 dark:text-emerald-200 text-base font-medium mt-1">
                      Puedes armar tu horario ahora mismo. Finaliza hoy a las <span className="font-bold text-emerald-900 dark:text-white">{proximaVentana.horaFin}</span>.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => router.push('/horarios/seleccion')} 
                  className="relative z-10 w-full md:w-auto px-10 py-5 bg-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-400 text-white dark:text-emerald-950 font-black rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_10px_40px_rgba(16,185,129,0.2)] dark:shadow-[0_10px_40px_rgba(16,185,129,0.3)] text-lg text-center"
                >
                  Entrar a la Matriz
                </button>
              </div>
            );
          } else if (futura) {
            const formattedDate = pFecha.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            return (
              <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-900/50 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-indigo-900 dark:text-white tracking-tight">Turno Programado</h3>
                    <p className="text-indigo-700 dark:text-indigo-200 text-sm font-medium mt-1">
                      El sistema se habilitará el <span className="font-bold text-indigo-900 dark:text-white">{formattedDate}</span> desde las <span className="font-bold text-indigo-900 dark:text-white">{proximaVentana.horaInicio}</span>.
                    </p>
                  </div>
                </div>
                <span className="px-5 py-2.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-widest rounded-full border border-indigo-200 dark:border-indigo-500/30 text-center">
                  En Espera
                </span>
              </div>
            );
          } else {
            return (
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Ventanilla Cerrada</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mt-1">
                      Tu plazo para armar el horario de forma directa finalizó el <span className="text-slate-800 dark:text-slate-300 font-bold">{pFecha.toLocaleDateString('es-PE')}</span> a las <span className="text-slate-800 dark:text-slate-300 font-bold">{proximaVentana.horaFin}</span>.
                    </p>
                  </div>
                </div>
                <span className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest rounded-full border border-slate-200 dark:border-slate-700 text-center">
                  Finalizado
                </span>
              </div>
            );
          }
        })()
      ) : (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/30 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-amber-100 dark:bg-amber-500/20 rounded-2xl border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-amber-900 dark:text-amber-500 tracking-tight">Sin Ventana Asignada</h3>
              <p className="text-amber-700 dark:text-amber-200/60 text-sm font-medium mt-1">
                No tienes un turno configurado para este periodo. Comunícate con secretaría si necesitas registrar carga académica.
              </p>
            </div>
          </div>
          <span className="px-5 py-2.5 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 text-xs font-black uppercase tracking-widest rounded-full border border-amber-200 dark:border-amber-500/20 text-center">
            No Asignado
          </span>
        </div>
      )}

      {/* MÉTRICAS (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#0A192F] rounded-2xl p-8 border border-gray-100 dark:border-[#112240] shadow-xl flex flex-col gap-6 relative overflow-hidden group hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between relative z-10">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Horas Semanales</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-baseline gap-2">
              {horasAsignadas}h
              <span className="text-lg font-bold text-gray-400 dark:text-gray-500">/ {horasRequeridas}h</span>
            </h3>
          </div>
          <div className="w-full bg-gray-100 dark:bg-[#020C1B] h-2 rounded-full overflow-hidden relative z-10 mt-auto">
             <div className={cn("h-full rounded-full transition-all duration-1000", porcentaje >= 100 ? "bg-emerald-500" : "bg-indigo-500")} style={{ width: `${Math.min(porcentaje, 100)}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A192F] rounded-2xl p-8 border border-gray-100 dark:border-[#112240] shadow-xl flex flex-col gap-6 relative overflow-hidden group hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between relative z-10">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Cursos Asignados</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              {(resumen?.componentes || []).length}
            </h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Cursos ofertados en tu carga.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A192F] rounded-2xl p-8 border border-gray-100 dark:border-[#112240] shadow-xl flex flex-col gap-6 relative overflow-hidden group hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between relative z-10">
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Bloques Creados</span>
          </div>
          <div className="space-y-4 relative z-10 flex-1 flex flex-col justify-end">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-[#020C1B] p-3 rounded-xl border border-gray-100 dark:border-white/5">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                Confirmados
              </span>
              <span className="font-black text-gray-900 dark:text-white">{resumen?.bloquesConfirmados ?? 0}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 dark:bg-[#020C1B] p-3 rounded-xl border border-gray-100 dark:border-white/5">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                Borradores
              </span>
              <span className="font-black text-gray-900 dark:text-white">{resumen?.bloquesBorrador ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LISTA DE CURSOS Y PROGRESO (7/12) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0A192F] rounded-2xl p-8 border border-gray-100 dark:border-[#112240] shadow-xl">
          <div className="flex items-center gap-4 border-b border-gray-100 dark:border-[#112240] pb-6 mb-6">
            <div className="p-3 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/20 text-[#D4AF37]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Desglose de Cursos</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Avance de Programación</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {(resumen?.componentes || []).length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-[#112240] rounded-3xl">
                <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-bold">No tienes cursos asignados.</p>
              </div>
            ) : (
              (resumen?.componentes || []).map((c: any) => (
                <div key={c.idComponente} className="p-5 rounded-2xl border border-gray-100 dark:border-[#112240] bg-gray-50 dark:bg-[#020C1B] hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{c.nombreCurso}</h4>
                      <span className="inline-block text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-100 dark:border-indigo-500/20 mt-2">
                        {c.tipoComponente}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-gray-900 dark:text-white">
                        {c.horasAsignadas}h
                      </span>
                      <span className="text-sm font-bold text-gray-400 block mt-0.5">/ {c.horasRequeridas}h</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 dark:bg-[#0A192F] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-1000', c.porcentaje >= 100 ? 'bg-emerald-500' : 'bg-[#D4AF37]')}
                        style={{ width: `${Math.min(c.porcentaje, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-end text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      {c.porcentaje}% Completado
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ACCIONES Y EXPORTACIÓN (5/12) */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white dark:bg-[#020C1B] rounded-2xl p-8 border border-gray-100 dark:border-[#112240] shadow-xl dark:shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 dark:bg-white/5 blur-2xl rounded-full pointer-events-none" />
            <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/10 pb-5 mb-6 relative z-10">
              <div className="p-3 bg-gray-50 dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white shadow-inner">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Accesos Rápidos</h3>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Panel de Control</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 relative z-10">
              <button
                onClick={() => router.push('/docente/carga-no-lectiva')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-500 transition-all font-bold group"
              >
                <FileText className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Registrar Carga No Lectiva
              </button>
              <button
                onClick={() => router.push('/horarios/seleccion')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-all font-bold group"
              >
                <BookOpen className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Elegir mi Horario (Matriz)
              </button>
              <button
                onClick={() => router.push('/horarios/vista-docente')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white transition-all font-bold group"
              >
                <Calendar className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Ver mi Horario Completo
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0A192F] rounded-2xl p-8 border border-gray-100 dark:border-[#112240] shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-4 border-b border-gray-100 dark:border-[#112240] pb-5 mb-6">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Exportación</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Descargar Reportes</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-black text-gray-800 dark:text-gray-300">Modo de Exportación</p>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-[#112240] bg-gray-50 dark:bg-[#020C1B] cursor-pointer hover:border-indigo-500/50 transition-colors">
                    <input
                      type="radio"
                      name="exportOption"
                      value="completo"
                      checked={exportOption === 'completo'}
                      onChange={(e) => setExportOption(e.target.value as any)}
                      className="w-4 h-4 text-indigo-600 bg-white dark:bg-[#0A192F] border-gray-300 dark:border-gray-600 focus:ring-indigo-600 dark:focus:ring-indigo-500 dark:ring-offset-gray-800"
                    />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Horario Completo (Lectiva + No Lectiva)</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-[#112240] bg-gray-50 dark:bg-[#020C1B] cursor-pointer hover:border-indigo-500/50 transition-colors">
                    <input
                      type="radio"
                      name="exportOption"
                      value="carga-lectiva"
                      checked={exportOption === 'carga-lectiva'}
                      onChange={(e) => setExportOption(e.target.value as any)}
                      className="w-4 h-4 text-indigo-600 bg-white dark:bg-[#0A192F] border-gray-300 dark:border-gray-600 focus:ring-indigo-600 dark:focus:ring-indigo-500 dark:ring-offset-gray-800"
                    />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Solo Carga Lectiva</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-[#112240] bg-gray-50 dark:bg-[#020C1B] cursor-pointer hover:border-indigo-500/50 transition-colors">
                    <input
                      type="radio"
                      name="exportOption"
                      value="carga-no-lectiva"
                      checked={exportOption === 'carga-no-lectiva'}
                      onChange={(e) => setExportOption(e.target.value as any)}
                      className="w-4 h-4 text-indigo-600 bg-white dark:bg-[#0A192F] border-gray-300 dark:border-gray-600 focus:ring-indigo-600 dark:focus:ring-indigo-500 dark:ring-offset-gray-800"
                    />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Solo Carga No Lectiva</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleDescargarReporte('excel')}
                  disabled={descargando !== null}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-xl transition-all font-bold disabled:opacity-50"
                >
                  {descargando === 'excel' ? <SpinnerCarga /> : <FileSpreadsheet className="h-5 w-5" />}
                  {descargando === 'excel' ? 'Procesando...' : 'Descargar en Excel'}
                </button>
                <button
                  onClick={() => handleDescargarReporte('pdf')}
                  disabled={descargando !== null}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl transition-all font-bold disabled:opacity-50"
                >
                  {descargando === 'pdf' ? <SpinnerCarga /> : <FileText className="h-5 w-5" />}
                  {descargando === 'pdf' ? 'Procesando...' : 'Descargar en PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && <NotificacionToast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
}
