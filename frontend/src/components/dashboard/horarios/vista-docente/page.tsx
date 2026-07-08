"use client";
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { reportesService, descargarBlob } from '@/services/reportes.service';
import { cargaNoLectivaService } from '@/services/carga-no-lectiva.service';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { FileText, Clock, ArrowLeft } from 'lucide-react';
import { CalendarioGeneralConNoLectivos } from '@/components/horarios/CalendarioGeneralConNoLectivos';

export default function VistaHorarioDocentePage() {
  const router = useRouter();
  const { usuario } = useAuthStore();
  const docenteIdFromSession = usuario?.idDocente || null;
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<number | null>(docenteIdFromSession);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);
  const [exportOption, setExportOption] = useState<'completo' | 'carga-lectiva' | 'carga-no-lectiva'>('completo');
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [exportandoExcel, setExportandoExcel] = useState(false);

  const { data: periodosData, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-vista-docente'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });
  const periodos = Array.isArray(periodosData) ? periodosData : periodosData?.data || [];

  const { data: periodoActivo, isLoading: periodoActivoLoading } = useQuery({
    queryKey: ['periodo-activo-vista-docente'],
    queryFn: () => periodosService.activo().then((res) => res.data),
  });

  const [idPeriodoSeleccionado, setIdPeriodoSeleccionado] = useState<number>(0);
  useEffect(() => {
    if (periodoActivo && idPeriodoSeleccionado === 0) {
      setIdPeriodoSeleccionado(periodoActivo.id);
    }
  }, [periodoActivo]);
  const idPeriodo = idPeriodoSeleccionado || periodoActivo?.id || 0;

  const handleExportarPdf = async () => {
    if (!idPeriodo || !docenteSeleccionado || exportandoPdf) return;

    setExportandoPdf(true);
    try {
      const response = await reportesService.pdfDocente(docenteSeleccionado, idPeriodo, exportOption);
      const nombreDocente = usuario?.docente
        ? `${usuario.docente.apellidos || ''}_${usuario.docente.nombres || ''}`.replace(/\s+/g, '_')
        : 'horario';
      descargarBlob(response.data, `horario_${nombreDocente}.pdf`);
      setToast({ mensaje: 'PDF generado correctamente', tipo: 'exito' });
    } catch (err) {
      setToast({ mensaje: 'Error al generar el PDF', tipo: 'error' });
    } finally {
      setExportandoPdf(false);
    }
  };

  const handleExportarExcel = async () => {
    if (!idPeriodo || !docenteSeleccionado || exportandoExcel) return;

    setExportandoExcel(true);
    try {
      const response = await reportesService.excelDocente(docenteSeleccionado, idPeriodo, exportOption);
      const nombreDocente = usuario?.docente
        ? `${usuario.docente.apellidos || ''}_${usuario.docente.nombres || ''}`.replace(/\s+/g, '_')
        : 'horario';
      descargarBlob(response.data, `horario_${nombreDocente}.xlsx`);
      setToast({ mensaje: 'Excel generado correctamente', tipo: 'exito' });
    } catch (err) {
      setToast({ mensaje: 'Error al generar el Excel', tipo: 'error' });
    } finally {
      setExportandoExcel(false);
    }
  };

  if (periodoActivoLoading || periodosLoading) return <SpinnerCarga />;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Control Console (Always Dark Navy) */}
      <header className="dark bg-[#020C1B] rounded-[2.5rem] border border-white/10 shadow-2xl p-8 relative overflow-hidden flex flex-col gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 w-96 h-96 bg-[#003366]/40 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/docente')} className="rounded-full p-3 bg-white/5 text-white hover:bg-white/10 hover:scale-105 transition-all shadow-sm">
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex flex-col gap-1.5">
                <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
                  Panel Docente
                </span>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-4">
                  Dossier Académico
                </h1>
                <p className="text-sm font-medium text-gray-400 mt-1 max-w-xl leading-relaxed">
                  Consolidado oficial de carga lectiva y no lectiva. Utilice los controles para generar su anexo u hoja de trabajo para el período.
                </p>
              </div>
            </div>

            {/* View Mode Selectors */}
            <div className="flex flex-wrap gap-3 mt-2">
              {[
                { id: 'completo', label: 'Visión Integral', icon: FileText },
                { id: 'carga-lectiva', label: 'Carga Lectiva', icon: FileText },
                { id: 'carga-no-lectiva', label: 'Carga No Lectiva', icon: FileText }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setExportOption(opt.id as any)}
                  className={`relative px-5 py-3 rounded-2xl flex items-center gap-3 transition-all duration-300 border overflow-hidden ${
                    exportOption === opt.id 
                      ? 'bg-white/10 border-white/20 text-white shadow-lg' 
                      : 'bg-[#0A192F]/50 border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#0A192F]'
                  }`}
                >
                  {exportOption === opt.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4AF37]" />}
                  <opt.icon className={`w-4 h-4 ${exportOption === opt.id ? 'text-[#D4AF37]' : ''}`} />
                  <span className="text-xs font-bold tracking-wide">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 w-full xl:w-[350px]">
            {/* Periodo Selector */}
            <div className="space-y-3 relative z-50">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Periodo Vigente</label>
              <SelectorInstitucional
                opciones={periodos.map((p: any) => ({ value: p.id, label: p.nombre }))}
                value={idPeriodoSeleccionado}
                onChange={(val) => setIdPeriodoSeleccionado(Number(val))}
              />
            </div>
            
            {/* Export Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleExportarExcel}
                disabled={exportandoExcel || !docenteSeleccionado}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-3.5 rounded-2xl text-xs font-bold transition-all disabled:opacity-50"
              >
                <Clock className="h-4 w-4" />
                {exportandoExcel ? 'Procesando...' : 'Excel (.xlsx)'}
              </button>
              <button
                onClick={handleExportarPdf}
                disabled={exportandoPdf || !docenteSeleccionado}
                className="flex-1 flex items-center justify-center gap-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/20 py-3.5 rounded-2xl text-xs font-bold transition-all disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                {exportandoPdf ? 'Procesando...' : 'PDF Oficial'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {toast && <NotificacionToast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}

      {!usuario?.idDocente ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#020C1B] rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/10">
          <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6">
            <FileText className="h-8 w-8 text-slate-300 dark:text-gray-600" />
          </div>
          <p className="text-lg font-bold text-slate-700 dark:text-white">Acceso Restringido</p>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">Este módulo solo está disponible para docentes autenticados.</p>
        </div>
      ) : docenteSeleccionado && idPeriodo ? (
        <div className="bg-white dark:bg-[#020C1B] rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-white/10 p-4 sm:p-8 relative">
          <div className="hidden sm:flex absolute top-8 right-8 items-center gap-2 opacity-50 z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">En Vivo</span>
          </div>
          <CalendarioGeneralConNoLectivos idPeriodo={idPeriodo} idDocente={docenteSeleccionado} exportOption={exportOption} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#020C1B] rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/10">
          <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6">
            <Clock className="h-8 w-8 text-slate-300 dark:text-gray-600" />
          </div>
          <p className="text-lg font-bold text-slate-700 dark:text-white">Identificando Datos...</p>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">No se pudo identificar el docente o el período académico activo.</p>
        </div>
      )}
    </div>
  );
}
