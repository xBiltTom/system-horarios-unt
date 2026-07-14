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
      {/* Dossier Header */}
      <div className="flex flex-col gap-5 pb-5 border-b border-[#0A192F]/12 dark:border-white/10">
        {/* Row 1: title + back + period selector */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <button onClick={() => router.push('/docente')} className="rounded-xl p-2.5 border border-[#0A192F]/15 dark:border-white/15 text-[#0A192F]/50 dark:text-white/50 hover:text-[#0A192F] dark:hover:text-white hover:border-[#0A192F]/30 transition-all shrink-0 mt-0.5">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A192F]/40 dark:text-white/40 mb-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Panel Docente</span>
              </div>
              <h1 className="font-serif text-[2rem] text-[#0A192F] dark:text-white tracking-tight leading-tight">Dossier Académico</h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end shrink-0">
            {/* Periodo Selector */}
            <div className="w-full sm:w-64 relative z-50">
              <p className="text-[10px] font-bold text-[#0A192F]/40 dark:text-white/40 uppercase tracking-widest mb-2">Periodo Vigente</p>
              <SelectorInstitucional
                opciones={periodos.map((p: any) => ({ value: p.id, label: p.nombre }))}
                value={idPeriodoSeleccionado}
                onChange={(val) => setIdPeriodoSeleccionado(Number(val))}
              />
            </div>
            {/* Export buttons */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleExportarExcel}
                disabled={exportandoExcel || !docenteSeleccionado}
                className="flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-4 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                <Clock className="h-4 w-4" />
                {exportandoExcel ? 'Procesando...' : 'Excel'}
              </button>
              <button
                onClick={handleExportarPdf}
                disabled={exportandoPdf || !docenteSeleccionado}
                className="flex items-center justify-center gap-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#b08d28] dark:text-[#D4AF37] border border-[#D4AF37]/30 px-4 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                {exportandoPdf ? 'Procesando...' : 'PDF Oficial'}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: View Mode Selector */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'completo', label: 'Visión Integral' },
            { id: 'carga-lectiva', label: 'Carga Lectiva' },
            { id: 'carga-no-lectiva', label: 'Carga No Lectiva' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setExportOption(opt.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                exportOption === opt.id
                  ? 'bg-[#0A192F] dark:bg-white text-white dark:text-[#0A192F] border-[#0A192F] dark:border-white shadow-sm'
                  : 'bg-transparent text-[#0A192F]/50 dark:text-white/40 border-[#0A192F]/15 dark:border-white/10 hover:border-[#0A192F]/30 dark:hover:border-white/30 hover:text-[#0A192F] dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

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
