'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SelectorFiltrable } from '@/components/ui/SelectorFiltrable';
import { CalendarioGeneral } from '@/components/horarios/CalendarioGeneral';
import { periodosService } from '@/services/periodos.service';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { Calendar, Download, FileSpreadsheet, FileText, FileDown, Share2, Layers, BookOpen } from 'lucide-react';
import { reportesService, descargarBlob } from '@/services/reportes.service';

export default function VistaHorarioCicloPage() {
  const [cicloSeleccionado, setCicloSeleccionado] = useState<number | null>(null);
  const [descargando, setDescargando] = useState<'excel' | 'pdf' | 'excel-todo' | 'pdf-todo' | null>(null);

  // Obtener período activo
  const { data: periodoActivo, isLoading: periodoLoading } = useQuery({
    queryKey: ['periodo-activo-ciclo'],
    queryFn: () => periodosService.activo().then(res => res.data),
  });

  // Obtener ciclos permitidos del período activo
  const { data: ciclos } = useQuery({
    queryKey: ['ciclos-activo-vista', periodoActivo?.id],
    queryFn: () => periodosService.obtenerCiclosActivo().then(res => res.data),
    enabled: !!periodoActivo,
  });

  const exportarArchivo = async (tipo: 'excel' | 'pdf', todo: boolean = false) => {
    if (!periodoActivo) return;
    if (!todo && !cicloSeleccionado) return;

    const key = todo ? `${tipo}-todo` : tipo;
    try {
      setDescargando(key as any);
      let res;
      let nombre;

      if (todo) {
        res = tipo === 'excel' 
          ? await reportesService.excelTodosLosCiclos(periodoActivo.id)
          : await reportesService.pdfTodosLosCiclos(periodoActivo.id);
        nombre = `horarios-todos-los-ciclos-${periodoActivo.nombre}.${tipo === 'excel' ? 'xlsx' : 'pdf'}`;
      } else {
        res = tipo === 'excel'
          ? await reportesService.excelCiclo(cicloSeleccionado!, periodoActivo.id)
          : await reportesService.pdfCiclo(cicloSeleccionado!, periodoActivo.id);
        const ciclo = (ciclos || []).find((c: any) => c.id === cicloSeleccionado || c.numero === cicloSeleccionado);
        nombre = `horario-ciclo-${ciclo?.numero || cicloSeleccionado}-${periodoActivo.nombre}.${tipo === 'excel' ? 'xlsx' : 'pdf'}`;
      }

      descargarBlob(res.data, nombre);
    } catch (error) {
      console.error(`Error exportando ${tipo}:`, error);
    } finally {
      setDescargando(null);
    }
  };

  if (periodoLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-10 pb-20">
      {/* Dossier Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#0A192F]/10 dark:border-white/10 mb-8 mx-4 sm:mx-6 lg:mx-8 mt-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A192F]/50 dark:text-white/50 mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Progreso Académico</span>
          </div>
          <h1 className="text-3xl font-black text-[#0A192F] dark:text-white tracking-tight">Ocupación por Ciclo</h1>
        </div>
        {periodoActivo && (
          <div className="w-full lg:w-72 shrink-0">
            <label className="text-[10px] font-bold text-[#0A192F]/50 dark:text-white/50 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Periodo Académico
            </label>
            <div className="bg-gray-100 dark:bg-[#020C1B] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 dark:text-white flex items-center justify-between">
              <span>{periodoActivo.nombre}</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
          </div>
        )}
      </div>

      {/* CONSOLA DE OPERACIÓN (FILTRO Y EXPORTACIÓN) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PANEL IZQUIERDO: SELECCIÓN DE CICLO (5/12) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0A192F] rounded-2xl shadow-xl border border-gray-100 dark:border-[#112240] p-8 flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-gray-100 dark:border-[#112240] pb-5">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">Filtro de Semestre</h3>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Nivel Académico</p>
            </div>
          </div>

          <div className="flex-1">
            <SelectorFiltrable
              label="Especifique el ciclo a consultar"
              value={cicloSeleccionado?.toString() || ''}
              onChange={(val) => setCicloSeleccionado(val ? Number(val) : null)}
              opciones={(ciclos || []).map((c: any) => ({
                valor: String(c.id),
                etiqueta: `Ciclo ${c.numero}`
              }))}
              placeholder="Seleccione el ciclo..."
            />
          </div>
          
          <div className="mt-2 bg-[#003366]/5 dark:bg-[#020C1B]/50 p-4 rounded-2xl border border-[#003366]/10 dark:border-white/5 border-l-4 border-l-[#003366] dark:border-l-[#D4AF37]">
            <p className="text-xs text-[#003366]/80 dark:text-gray-400 font-medium leading-relaxed">
              La cuadrícula reflejará todas las secciones y cursos programados para este nivel formativo.
            </p>
          </div>
        </div>

        {/* PANEL DERECHO: EXPORTACIÓN (7/12) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#020C1B] rounded-2xl shadow-xl dark:shadow-2xl p-8 border border-gray-100 dark:border-[#112240] flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 dark:bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/10 pb-5 relative z-10">
            <div className="p-3 bg-gray-100 dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white shadow-sm dark:shadow-inner">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">Central de Exportación</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest mt-0.5">Generación de Reportes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
            {/* Exportación Específica */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ciclo en Vista</p>
                {cicloSeleccionado ? (
                   <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">LISTO</span>
                ) : (
                   <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-[9px] font-bold border border-gray-500/30">ESPERANDO</span>
                )}
              </div>
              
              <div className="flex gap-3">
                <button 
                  disabled={!cicloSeleccionado || !!descargando}
                  onClick={() => exportarArchivo('excel')}
                  className="flex-1 p-3 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl transition-all disabled:opacity-50 flex flex-col items-center gap-2 group"
                >
                  {descargando === 'excel' ? <SpinnerCarga /> : <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:-translate-y-0.5 transition-transform" />}
                  <span className="text-xs font-bold text-gray-800 dark:text-white mt-1">Excel</span>
                </button>
                <button 
                  disabled={!cicloSeleccionado || !!descargando}
                  onClick={() => exportarArchivo('pdf')}
                  className="flex-1 p-3 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl transition-all disabled:opacity-50 flex flex-col items-center gap-2 group"
                >
                  {descargando === 'pdf' ? <SpinnerCarga /> : <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400 group-hover:-translate-y-0.5 transition-transform" />}
                  <span className="text-xs font-bold text-gray-800 dark:text-white mt-1">PDF</span>
                </button>
              </div>
            </div>

            {/* Exportación Global */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consolidado Total (Carrera)</p>
              
              <div className="flex gap-3">
                <button 
                  disabled={!!descargando}
                  onClick={() => exportarArchivo('excel', true)}
                  className="flex-1 p-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-500/30 rounded-xl transition-all disabled:opacity-50 flex flex-col items-center gap-2 group"
                >
                  {descargando === 'excel-todo' ? <SpinnerCarga /> : <Share2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500 group-hover:-translate-y-0.5 transition-transform" />}
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1">Todos (XLS)</span>
                </button>
                <button 
                  disabled={!!descargando}
                  onClick={() => exportarArchivo('pdf', true)}
                  className="flex-1 p-3 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-500/30 rounded-xl transition-all disabled:opacity-50 flex flex-col items-center gap-2 group"
                >
                  {descargando === 'pdf-todo' ? <SpinnerCarga /> : <FileDown className="w-5 h-5 text-rose-600 dark:text-rose-500 group-hover:-translate-y-0.5 transition-transform" />}
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400 mt-1">Todos (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CUADRÍCULA OPERATIVA (CALENDARIO) */}
      {!cicloSeleccionado ? (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-50/50 dark:bg-[#0A192F]/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#112240] animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          <div className="p-6 bg-gray-100/80 dark:bg-[#020C1B] rounded-full mb-6 border border-gray-200 dark:border-[#112240] shadow-sm">
            <Layers className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h4 className="text-lg font-black text-gray-800 dark:text-white">Panel en Espera</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-2 text-center max-w-sm leading-relaxed">
            Busque y seleccione un ciclo académico para cargar su cronograma visual de ocupación.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0A192F] rounded-2xl shadow-xl border border-gray-100 dark:border-[#112240] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
          {periodoActivo ? (
            <div className="p-6 md:p-8">
              <CalendarioGeneral 
                idPeriodo={periodoActivo.id} 
                filtroTipo="CICLO" 
                filtroId={cicloSeleccionado} 
                modo="LECTURA" 
              />
            </div>
          ) : (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-full text-amber-500 border border-amber-100 dark:border-amber-500/20">
                <Share2 className="w-8 h-8" />
              </div>
              <p className="text-amber-700 dark:text-amber-400 font-bold text-lg">No hay un período académico activo para mostrar horarios.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
