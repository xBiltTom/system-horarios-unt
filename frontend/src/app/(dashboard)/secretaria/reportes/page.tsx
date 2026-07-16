'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { reportesService, descargarBlob } from '@/services/reportes.service';
import { estadisticasService } from '@/services/estadisticas.service';
import { Boton } from '@/components/ui/Boton';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { cn } from '@/lib/utilidades';
import { SelectorFiltrable } from '@/components/ui/SelectorFiltrable';
import { 
  FileText, 
  FileSpreadsheet, 
  Mail, 
  MessageCircle, 
  Download, 
  Calendar, 
  User, 
  BarChart3,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';

export default function ReportesSecretariaPage() {
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [idDocente, setIdDocente] = useState<number>(0);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>('');
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);
  const [enviandoId, setEnviandoId] = useState<number | null>(null);
  const [modalEnviarTodos, setModalEnviarTodos] = useState(false);
  const [descargando, setDescargando] = useState<string | null>(null);

  const { data: periodos, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-reportes'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: periodoActivo } = useQuery({
    queryKey: ['periodo-activo-reportes'],
    queryFn: () => periodosService.activo().then(res => res.data),
  });

  // Seleccionar periodo activo por defecto
  useEffect(() => {
    if (!idPeriodo) {
      if (periodoActivo?.id) {
        setIdPeriodo(periodoActivo.id);
      } else if (periodos && periodos.length > 0) {
        // Si no hay activo, seleccionar el primero de la lista (el más reciente por el order desc)
        setIdPeriodo(periodos[0].id);
      }
    }
  }, [periodoActivo, idPeriodo, periodos]);

  const { data: cargaDocentes, isLoading: cargaLoading } = useQuery({
    queryKey: ['carga-docente-reportes', idPeriodo],
    queryFn: () => estadisticasService.cargaDocente(idPeriodo!).then((res) => res.data),
    enabled: !!idPeriodo,
  });

  const handleDescargar = async (tipo: 'pdf' | 'excel', idDoc?: number) => {
    if (!idPeriodo) return;
    const key = idDoc ? `${tipo}-${idDoc}` : `global-${tipo}`;
    setDescargando(key);
    try {
      let response: any;
      if (idDoc) {
        response = tipo === 'pdf'
          ? await reportesService.pdfDocente(idDoc, idPeriodo)
          : await reportesService.excelDocente(idDoc, idPeriodo);
        const docente = (cargaDocentes || []).find((d: any) => d.id === idDoc);
        const nombre = docente ? `${docente.apellidos}_${docente.nombres}` : `docente_${idDoc}`;
        descargarBlob(response.data, `horario_${nombre}.${tipo === 'pdf' ? 'pdf' : 'xlsx'}`);
      } else {
        response = tipo === 'pdf'
          ? await reportesService.pdfGlobal(idPeriodo)
          : await reportesService.excelGlobal(idPeriodo);
        descargarBlob(response.data, `horarios_global.${tipo === 'pdf' ? 'pdf' : 'xlsx'}`);
      }
      setToast({ mensaje: 'Reporte descargado correctamente', tipo: 'exito' });
    } catch (err: any) {
      setToast({ mensaje: err.response?.data?.error || 'Error al generar reporte', tipo: 'error' });
    } finally {
      setDescargando(null);
    }
  };

  const handleDescargarDia = async (tipo: 'pdf' | 'excel') => {
    if (!idPeriodo || !diaSeleccionado) return;
    const key = `dia-${tipo}`;
    setDescargando(key);
    try {
      const response = tipo === 'pdf'
        ? await reportesService.pdfDia(diaSeleccionado, idPeriodo)
        : await reportesService.excelDia(diaSeleccionado, idPeriodo);
      descargarBlob(response.data, `auditoria_${diaSeleccionado.toLowerCase()}.${tipo === 'pdf' ? 'pdf' : 'xlsx'}`);
      setToast({ mensaje: 'Reporte de auditoría generado', tipo: 'exito' });
    } catch (err: any) {
      setToast({ mensaje: 'Error al generar reporte de auditoría', tipo: 'error' });
    } finally {
      setDescargando(null);
    }
  };

  const handleEnviarCorreo = async (idDoc: number) => {
    if (!idPeriodo) return;
    setEnviandoId(idDoc);
    try {
      await reportesService.enviarCorreoDocente(idDoc, idPeriodo);
      setToast({ mensaje: 'Reporte enviado al correo del docente', tipo: 'exito' });
    } catch (err: any) {
      setToast({ mensaje: err.response?.data?.error || 'Error al enviar correo', tipo: 'error' });
    } finally {
      setEnviandoId(null);
    }
  };

  const handleEnviarWhatsApp = (docente: any) => {
    if (!docente.telefono) {
      setToast({ mensaje: `El docente ${docente.apellidos} no tiene un teléfono registrado`, tipo: 'error' });
      return;
    }
    let numero = docente.telefono.replace(/\D/g, '');
    if (numero.length === 9) numero = `51${numero}`;

    const urlReporte = `${window.location.origin}/api/reportes/docente/${docente.id}/pdf`;
    const mensaje = `Estimado/a Prof. *${docente.nombres} ${docente.apellidos}*,\n\nLe saluda la Secretaría de la EIS-UNT. Adjuntamos su horario oficial para el periodo actual.\n👉 ${urlReporte}`;

    const link = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    window.open(link, '_blank');
  };

  const enviarTodosMutation = useMutation({
    mutationFn: () => reportesService.enviarCorreosTodos(idPeriodo!),
    onSuccess: (res: any) => {
      const { enviados, errores } = res.data;
      setToast({ mensaje: `Enviados: ${enviados} correos. Errores: ${errores}`, tipo: errores > 0 ? 'error' : 'exito' });
      setModalEnviarTodos(false);
    },
    onError: (err: any) => {
      setToast({ mensaje: err.response?.data?.error || 'Error al enviar correos', tipo: 'error' });
      setModalEnviarTodos(false);
    },
  });

  const dias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto pb-20">
      {/* Dossier Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#0A192F]/10 dark:border-white/10 mb-8 mx-4 sm:mx-6 lg:mx-8 mt-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A192F]/50 dark:text-white/50 mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Central de Exportación y Auditoría</span>
          </div>
          <h1 className="text-3xl font-black text-[#0A192F] dark:text-white tracking-tight">Reportes Institucionales</h1>
        </div>
        <div className="w-full lg:w-72 shrink-0">
          <label className="text-[10px] font-bold text-[#0A192F]/50 dark:text-white/50 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Periodo Auditado
          </label>
          <SelectorInstitucional
            opciones={[
              { value: '', label: 'Seleccionar periodo...' },
              ...(periodos || []).map((p: any) => ({ value: String(p.id), label: p.nombre })),
            ]}
            value={idPeriodo?.toString() || ''}
            onChange={(val) => setIdPeriodo(val ? parseInt(val as string, 10) : null)}
          />
        </div>
      </div>

      {!idPeriodo ? (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-50/50 dark:bg-[#0A192F]/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#112240] animate-in fade-in duration-700">
          <div className="p-6 bg-gray-100/80 dark:bg-[#020C1B] rounded-full mb-6 border border-gray-200 dark:border-[#112240] shadow-sm">
            <LayoutDashboard className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h4 className="text-lg font-black text-gray-800 dark:text-white">Módulo Suspendido</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-2 text-center max-w-sm leading-relaxed">
            Es requisito indispensable identificar el periodo académico antes de acceder a la emisión de documentos oficiales.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-700">
          
          {/* SECCIÓN 1: EMISIÓN INDIVIDUAL (7/12) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Padrón Docente */}
            <div className="bg-white dark:bg-[#0A192F] rounded-2xl shadow-xl border border-gray-100 dark:border-[#112240] p-8 flex flex-col gap-6">
              <div className="flex items-center gap-4 border-b border-gray-100 dark:border-[#112240] pb-5">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">Padrón Individual</h3>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Emisión de Carga por Docente</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-end">
                <div className="sm:col-span-7">
                  <SelectorFiltrable
                    label="Docente a consultar"
                    value={idDocente}
                    onChange={(val) => setIdDocente(Number(val))}
                    opciones={(cargaDocentes || []).map((d: any) => ({
                      valor: d.id,
                      etiqueta: `${d.apellidos}, ${d.nombres}`
                    }))}
                    placeholder="Buscar docente..."
                  />
                </div>
                <div className="sm:col-span-5 flex gap-3">
                  <button 
                    disabled={!idDocente || !!descargando}
                    onClick={() => handleDescargar('pdf', idDocente)}
                    className="flex-1 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {descargando === `pdf-${idDocente}` ? <SpinnerCarga /> : <FileText className="w-4 h-4" />}
                    PDF
                  </button>
                  <button 
                    disabled={!idDocente || !!descargando}
                    onClick={() => handleDescargar('excel', idDocente)}
                    className="flex-1 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {descargando === `excel-${idDocente}` ? <SpinnerCarga /> : <FileSpreadsheet className="w-4 h-4" />}
                    Excel
                  </button>
                </div>
              </div>


            </div>

            {/* Auditoría por Día */}
            <div className="bg-white dark:bg-[#0A192F] rounded-2xl shadow-xl border border-gray-100 dark:border-[#112240] p-8 flex flex-col gap-6">
              <div className="flex items-center gap-4 border-b border-gray-100 dark:border-[#112240] pb-5">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">Actas Diarias</h3>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Control de Infraestructura</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-end">
                <div className="sm:col-span-7 space-y-2">
                  <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Día Hábil</p>
                  <SelectorInstitucional
                    opciones={[
                      { value: '', label: 'Seleccionar día...' },
                      ...dias.map(d => ({ value: d, label: d }))
                    ]}
                    value={diaSeleccionado}
                    onChange={(val) => setDiaSeleccionado(val as string)}
                  />
                </div>
                <div className="sm:col-span-5 flex gap-3">
                  <button 
                    disabled={!diaSeleccionado || !!descargando}
                    onClick={() => handleDescargarDia('pdf')}
                    className="flex-1 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {descargando === 'dia-pdf' ? <SpinnerCarga /> : <FileText className="w-4 h-4" />}
                    PDF
                  </button>
                  <button 
                    disabled={!diaSeleccionado || !!descargando}
                    onClick={() => handleDescargarDia('excel')}
                    className="flex-1 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {descargando === 'dia-excel' ? <SpinnerCarga /> : <FileSpreadsheet className="w-4 h-4" />}
                    Excel
                  </button>
                </div>
              </div>
              
              <div className="mt-2 bg-[#003366]/5 dark:bg-[#020C1B]/50 p-4 rounded-2xl border border-[#003366]/10 dark:border-white/5 border-l-4 border-l-[#003366] dark:border-l-[#D4AF37]">
                <p className="text-xs text-[#003366]/80 dark:text-gray-400 font-medium leading-relaxed">
                  El acta de auditoría detalla las ocupaciones de infraestructura asignadas para el día, ideal para la supervisión de asistencia en pabellones.
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: OPERACIONES GLOBALES (5/12) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white dark:bg-[#020C1B] rounded-2xl shadow-xl dark:shadow-2xl p-8 space-y-8 border border-gray-100 dark:border-[#112240] relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 dark:bg-white/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/10 pb-5 relative z-10">
                <div className="p-3 bg-gray-100 dark:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white shadow-sm dark:shadow-inner">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-gray-900 dark:text-white">Consolidados Globales</h2>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest mt-0.5">Operaciones del Periodo</p>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <button 
                  className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all flex items-center justify-between group disabled:opacity-50"
                  onClick={() => handleDescargar('pdf')}
                  disabled={!!descargando}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-rose-50 dark:bg-rose-500/20 rounded-lg border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-800 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-100">Libro Maestro (PDF)</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Todos los horarios</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-rose-600 dark:group-hover:text-white transition-colors" />
                </button>
                
                <button 
                  className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all flex items-center justify-between group disabled:opacity-50"
                  onClick={() => handleDescargar('excel')}
                  disabled={!!descargando}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/20 rounded-lg border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-100">Matriz de Datos (Excel)</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Data procesable</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-emerald-600 dark:group-hover:text-white transition-colors" />
                </button>
              </div>

            </div>

            {/* Tarjeta Informativa Institucional */}
            <div className="bg-white dark:bg-[#0A192F] rounded-2xl shadow-lg border border-gray-100 dark:border-[#112240] p-6 flex items-start gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="pt-1">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight">Validez Institucional</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Los documentos generados cumplen con el estándar A4 e incluyen codificación unificada de la EIS.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal enviar a todos */}
      {modalEnviarTodos && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0A192F] rounded-2xl shadow-2xl p-10 max-w-md w-full mx-4 border border-gray-100 dark:border-[#112240]">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-rose-50/50 dark:ring-rose-900/10 border border-rose-100 dark:border-rose-800/30">
                <Mail className="w-10 h-10 text-rose-600 dark:text-rose-400" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Difusión Masiva</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-4 leading-relaxed">
                Esta operación procesará y enviará un correo electrónico oficial a <strong className="text-gray-800 dark:text-gray-200">cada docente del padrón activo</strong> adjuntando su horario respectivo en PDF y Excel.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setModalEnviarTodos(false)} 
                className="flex-1 py-4 rounded-xl font-bold border border-gray-200 dark:border-gray-700 bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => enviarTodosMutation.mutate()}
                disabled={enviarTodosMutation.isPending}
                className="flex-1 py-4 rounded-xl font-black bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {enviarTodosMutation.isPending ? 'Procesando...' : 'Confirmar Envío'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <NotificacionToast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
}
