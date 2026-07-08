'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ambientesService } from '@/services/ambientes.service';
import { periodosService } from '@/services/periodos.service';
import { reportesService, descargarBlob } from '@/services/reportes.service';
import { SelectorFiltrable } from '@/components/ui/SelectorFiltrable';
import { CalendarioGeneral } from '@/components/horarios/CalendarioGeneral';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { 
  School, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  FileDown, 
  Share2, 
  Filter,
  MapPin
} from 'lucide-react';

export default function VistaHorarioAulaPage() {
  const [ambienteSeleccionado, setAmbienteSeleccionado] = useState<number | null>(null);
  const [descargando, setDescargando] = useState<'excel' | 'pdf' | 'excel-todo' | 'pdf-todo' | null>(null);

  // Obtener período activo
  const { data: periodoActivo, isLoading: periodoLoading } = useQuery({
    queryKey: ['periodo-activo-aula'],
    queryFn: () => periodosService.activo().then((res) => res.data),
  });

  // Obtener lista de ambientes activos
  const { data: ambientes } = useQuery({
    queryKey: ['ambientes-activos-vista'],
    queryFn: () => ambientesService.listar().then((res) => res.data),
  });

  const exportarArchivo = async (tipo: 'excel' | 'pdf', todo: boolean = false) => {
    if (!periodoActivo) return;
    if (!todo && !ambienteSeleccionado) return;

    const key = todo ? `${tipo}-todo` : tipo;
    try {
      setDescargando(key as any);
      let res;
      let nombre;

      if (todo) {
        res = tipo === 'excel' 
          ? await reportesService.excelTodosLosAmbientes(periodoActivo.id)
          : await reportesService.pdfTodosLosAmbientes(periodoActivo.id);
        nombre = `horarios-todos-los-ambientes-${periodoActivo.nombre}.${tipo === 'excel' ? 'xlsx' : 'pdf'}`;
      } else {
        const amb = (ambientes || []).find((a: any) => a.id === ambienteSeleccionado);
        res = tipo === 'excel'
          ? await reportesService.excelAmbiente(ambienteSeleccionado!, periodoActivo.id)
          : await reportesService.pdfAmbiente(ambienteSeleccionado!, periodoActivo.id);
        nombre = `horario-ambiente-${amb?.codigo || ambienteSeleccionado}-${periodoActivo.nombre}.${tipo === 'excel' ? 'xlsx' : 'pdf'}`;
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
      {/* PANEL DE CONTEXTO: INFRAESTRUCTURA EDUCATIVA */}
      <div className="bg-[#0A192F] rounded-3xl shadow-2xl border border-[#112240] flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative transition-all p-8 lg:p-10">
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full text-[10px] font-black uppercase tracking-widest text-[#D4AF37] shadow-sm">
            <School className="w-3.5 h-3.5" />
            Infraestructura Educativa
          </div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Ocupación de Ambientes</h1>
          <p className="text-sm text-gray-400 font-medium leading-relaxed">
            Consulte en tiempo real la asignación académica de aulas y laboratorios, y genere reportes operativos de la infraestructura física.
          </p>
        </div>
        
        {periodoActivo && (
          <div className="relative z-10 flex items-center gap-4 bg-[#020C1B]/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-xl shrink-0">
            <div className="p-3 bg-[#D4AF37]/20 rounded-xl border border-[#D4AF37]/30">
              <Calendar className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Periodo Académico</p>
              <p className="text-lg font-black text-white leading-tight">{periodoActivo.nombre}</p>
            </div>
          </div>
        )}
      </div>

      {/* CONSOLA DE OPERACIÓN (FILTRO Y EXPORTACIÓN) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PANEL IZQUIERDO: SELECCIÓN DE AMBIENTE (5/12) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0A192F] rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-[#112240] p-8 flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-gray-100 dark:border-[#112240] pb-5">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">Filtro de Localización</h3>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Búsqueda de Aulas</p>
            </div>
          </div>

          <div className="flex-1">
            <SelectorFiltrable
              label="Especifique el ambiente a consultar"
              value={ambienteSeleccionado || ''}
              onChange={(val) => setAmbienteSeleccionado(val ? Number(val) : null)}
              opciones={(ambientes?.filter((a: any) => a.activo) || []).map((a: any) => ({
                valor: a.id,
                etiqueta: `${a.codigo} (${a.tipo === 'AULA' ? 'Aula' : 'Laboratorio'} - Cap: ${a.capacidad})`
              }))}
              placeholder="Escriba el código del ambiente..."
            />
          </div>
          
          <div className="mt-2 bg-[#003366]/5 dark:bg-[#020C1B]/50 p-4 rounded-2xl border border-[#003366]/10 dark:border-white/5 border-l-4 border-l-[#003366] dark:border-l-[#D4AF37]">
            <p className="text-xs text-[#003366]/80 dark:text-gray-400 font-medium leading-relaxed">
              La cuadrícula operativa reflejará la ocupación del ambiente seleccionado en tiempo real.
            </p>
          </div>
        </div>

        {/* PANEL DERECHO: EXPORTACIÓN (7/12) */}
        <div className="lg:col-span-7 bg-[#020C1B] rounded-[2.5rem] shadow-2xl p-8 border border-[#112240] flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-4 border-b border-white/10 pb-5 relative z-10">
            <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-white shadow-inner">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">Central de Exportación</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Generación de Reportes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
            {/* Exportación Específica */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ambiente en Vista</p>
                {ambienteSeleccionado ? (
                   <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">LISTO</span>
                ) : (
                   <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-[9px] font-bold border border-gray-500/30">ESPERANDO</span>
                )}
              </div>
              
              <div className="flex gap-3">
                <button 
                  disabled={!ambienteSeleccionado || !!descargando}
                  onClick={() => exportarArchivo('excel')}
                  className="flex-1 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-50 flex flex-col items-center gap-2 group"
                >
                  {descargando === 'excel' ? <SpinnerCarga /> : <FileSpreadsheet className="w-5 h-5 text-emerald-400 group-hover:-translate-y-0.5 transition-transform" />}
                  <span className="text-xs font-bold text-white mt-1">Excel</span>
                </button>
                <button 
                  disabled={!ambienteSeleccionado || !!descargando}
                  onClick={() => exportarArchivo('pdf')}
                  className="flex-1 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all disabled:opacity-50 flex flex-col items-center gap-2 group"
                >
                  {descargando === 'pdf' ? <SpinnerCarga /> : <FileText className="w-5 h-5 text-rose-400 group-hover:-translate-y-0.5 transition-transform" />}
                  <span className="text-xs font-bold text-white mt-1">PDF</span>
                </button>
              </div>
            </div>

            {/* Exportación Global */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consolidado Total (Pabellón)</p>
              
              <div className="flex gap-3">
                <button 
                  disabled={!!descargando}
                  onClick={() => exportarArchivo('excel', true)}
                  className="flex-1 p-3 bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-500/30 rounded-xl transition-all disabled:opacity-50 flex flex-col items-center gap-2 group"
                >
                  {descargando === 'excel-todo' ? <SpinnerCarga /> : <Share2 className="w-5 h-5 text-emerald-500 group-hover:-translate-y-0.5 transition-transform" />}
                  <span className="text-xs font-bold text-emerald-400 mt-1">Todos (XLS)</span>
                </button>
                <button 
                  disabled={!!descargando}
                  onClick={() => exportarArchivo('pdf', true)}
                  className="flex-1 p-3 bg-rose-900/20 hover:bg-rose-900/40 border border-rose-500/30 rounded-xl transition-all disabled:opacity-50 flex flex-col items-center gap-2 group"
                >
                  {descargando === 'pdf-todo' ? <SpinnerCarga /> : <FileDown className="w-5 h-5 text-rose-500 group-hover:-translate-y-0.5 transition-transform" />}
                  <span className="text-xs font-bold text-rose-400 mt-1">Todos (PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CUADRÍCULA OPERATIVA (CALENDARIO) */}
      {!ambienteSeleccionado ? (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-50/50 dark:bg-[#0A192F]/50 backdrop-blur-sm rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-[#112240] animate-in fade-in duration-700">
          <div className="p-6 bg-gray-100/80 dark:bg-[#020C1B] rounded-full mb-6 border border-gray-200 dark:border-[#112240] shadow-sm">
            <School className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h4 className="text-lg font-black text-gray-800 dark:text-white">Panel en Espera</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-2 text-center max-w-sm leading-relaxed">
            Busque y seleccione un aula o laboratorio para cargar su cronograma visual de ocupación.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0A192F] rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-[#112240] overflow-hidden animate-in zoom-in-95 duration-500">
          {periodoActivo ? (
            <div className="p-6 md:p-8">
              <CalendarioGeneral 
                idPeriodo={periodoActivo.id} 
                filtroTipo="AULA" 
                filtroId={ambienteSeleccionado} 
                modo="LECTURA" 
              />
            </div>
          ) : (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-full text-amber-500 border border-amber-100 dark:border-amber-500/20">
                <Share2 className="w-8 h-8" />
              </div>
              <p className="text-amber-700 dark:text-amber-400 font-bold text-lg">No hay un periodo académico activo para mostrar horarios.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}