'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { useKPIsSecretaria } from '@/hooks/useEstadisticas';
import { reportesService, descargarBlob } from '@/services/reportes.service';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { Boton } from '@/components/ui/Boton';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/stores/auth.store';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { 
  Users, 
  BookOpen, 
  School, 
  Clock, 
  CheckSquare, 
  FileDown, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Mail,
  LayoutDashboard,
  Calendar,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  MessageCircle,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { cn } from '@/lib/utilidades';

export default function SecretariaDashboard() {
  const { usuario } = useAuthStore();
  
  const { data: periodos, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-lista-secretaria'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: periodoActivo } = useQuery({
    queryKey: ['periodo-activo-secretaria'],
    queryFn: () => periodosService.activo().then((res) => res.data),
  });

  const [idPeriodo, setIdPeriodo] = useState<number>(0);

  // Seleccionar periodo activo por defecto
  useEffect(() => {
    if (periodoActivo && idPeriodo === 0) {
      setIdPeriodo(periodoActivo.id);
    } else if (!idPeriodo && periodos && periodos.length > 0) {
      setIdPeriodo(periodos[0].id);
    }
  }, [periodoActivo, periodos, idPeriodo]);

  const { data: kpisData, isLoading: kpisLoading } = useKPIsSecretaria(idPeriodo);
  const [modalPublicarOpen, setModalPublicarOpen] = useState(false);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);
  const [descargando, setDescargando] = useState<'pdf' | 'excel' | null>(null);

  const handleDescargarGlobal = async (tipo: 'pdf' | 'excel') => {
    if (!idPeriodo) return;
    setDescargando(tipo);
    try {
      const response = tipo === 'pdf'
        ? await reportesService.pdfGlobal(idPeriodo)
        : await reportesService.excelGlobal(idPeriodo);
      descargarBlob(response.data, `horarios_global_${tipo === 'pdf' ? 'pdf' : 'xlsx'}`);
      setToast({ mensaje: 'Reporte global descargado con éxito', tipo: 'exito' });
    } catch (err: any) {
      setToast({ mensaje: 'Error al generar reporte global', tipo: 'error' });
    } finally {
      setDescargando(null);
    }
  };

  const publicarPeriodoMutation = useMutation({
    mutationFn: () => reportesService.publicarPeriodo(idPeriodo),
    onSuccess: (res: any) => {
      setToast({
        mensaje: res.data.mensaje || 'Periodo publicado exitosamente',
        tipo: 'exito',
      });
      setModalPublicarOpen(false);
    },
    onError: (err: any) => {
      setToast({
        mensaje: err.response?.data?.error || 'Error al publicar el periodo',
        tipo: 'error',
      });
      setModalPublicarOpen(false);
    },
  });

  if (periodosLoading || kpisLoading) return <SpinnerCarga />;

  const porcentajeDocentes = kpisData?.docentes.total > 0 
    ? Math.round((kpisData.docentes.elegidos / kpisData.docentes.total) * 100) 
    : 0;
  const porcentajeCursos = kpisData?.cursos.total > 0 
    ? Math.round((kpisData.cursos.completos / kpisData.cursos.total) * 100) 
    : 0;
  const porcentajeOcupacion = kpisData?.ocupacion.horasDisponibles > 0 
    ? Math.round((kpisData.ocupacion.horasOcupadas / kpisData.ocupacion.horasDisponibles) * 100) 
    : 0;

  const chartData = (kpisData?.avanceCursos || [])
    .map((curso: any) => ({
      curso: curso.curso,
      porcentaje: curso.porcentaje
    }))
    .sort((a: any, b: any) => b.porcentaje - a.porcentaje)
    .slice(0, 10); // Mostrar top 10 o los que tengan menos avance

  return (
    <div className="space-y-10 max-w-[1800px] mx-auto pb-20 animate-in fade-in duration-500">
      {/* Header Institucional UNT */}
      <div className="relative rounded-[3rem] bg-[#0A192F] px-10 py-12 text-white shadow-2xl border border-[#112240] z-20">
        <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute left-1/4 bottom-0 h-48 w-48 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full text-[10px] font-black uppercase tracking-widest text-[#D4AF37] shadow-sm">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Panel de Control
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-white drop-shadow-sm">
              Bienvenida, <span className="text-[#D4AF37]">Secretaria</span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl font-medium leading-relaxed">
              Supervisa el progreso de la asignación docente, administra la infraestructura física y oficializa la programación académica de la Escuela.
            </p>
          </div>
          
          <div className="w-full lg:w-96 bg-[#020C1B]/50 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl dark">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3 ml-1">Periodo de Gestión Actual</p>
            <SelectorInstitucional
              opciones={[
                { value: '', label: 'Seleccionar Periodo...' },
                ...(periodos || []).map((p: any) => ({ value: String(p.id), label: p.nombre })),
              ]}
              value={idPeriodo?.toString() || ''}
              onChange={(val) => setIdPeriodo(val ? parseInt(val as string) : 0)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Grid de KPIs Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-700 delay-100">
        
        {/* KPI: Docentes */}
        <div className="bg-white dark:bg-[#0A192F] rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-[#112240] group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-[#003366]/5 dark:bg-[#003366]/20 rounded-2xl text-[#003366] dark:text-blue-400 group-hover:bg-[#003366] group-hover:text-white transition-colors duration-300">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Participación</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{porcentajeDocentes}%</p>
            </div>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 font-bold text-sm uppercase tracking-tight mb-1">Docentes Activos</h3>
          <p className="text-gray-400 dark:text-gray-500 text-xs font-medium mb-4">{kpisData?.docentes.elegidos} de {kpisData?.docentes.total} ya eligieron horario</p>
          <div className="h-2 w-full bg-gray-100 dark:bg-[#112240] rounded-full overflow-hidden">
            <div className="h-full bg-[#003366] dark:bg-blue-500 rounded-full" style={{ width: `${porcentajeDocentes}%` }} />
          </div>
        </div>

        {/* KPI: Cursos */}
        <div className="bg-white dark:bg-[#0A192F] rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-[#112240] group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Completitud</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{porcentajeCursos}%</p>
            </div>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 font-bold text-sm uppercase tracking-tight mb-1">Cursos Programados</h3>
          <p className="text-gray-400 dark:text-gray-500 text-xs font-medium mb-4">{kpisData?.cursos.completos} de {kpisData?.cursos.total} con carga completa</p>
          <div className="h-2 w-full bg-gray-100 dark:bg-[#112240] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${porcentajeCursos}%` }} />
          </div>
        </div>

        {/* KPI: Ambientes */}
        <div className="bg-white dark:bg-[#0A192F] rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-[#112240] group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-amber-50 dark:bg-[#D4AF37]/10 rounded-2xl text-amber-600 dark:text-[#D4AF37] group-hover:bg-amber-600 dark:group-hover:bg-[#D4AF37] group-hover:text-white transition-colors duration-300">
              <School className="w-6 h-6" />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Ocupación</span>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{porcentajeOcupacion}%</p>
            </div>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 font-bold text-sm uppercase tracking-tight mb-1">Uso de Ambientes</h3>
          <p className="text-gray-400 dark:text-gray-500 text-xs font-medium mb-4">{kpisData?.ocupacion.horasOcupadas}h de {kpisData?.ocupacion.horasDisponibles}h semanales</p>
          <div className="h-2 w-full bg-gray-100 dark:bg-[#112240] rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 dark:bg-[#D4AF37] rounded-full" style={{ width: `${porcentajeOcupacion}%` }} />
          </div>
        </div>

        {/* KPI: Ventana / Tiempo */}
        <div className="bg-[#0A192F] dark:bg-[#020C1B] rounded-[2.5rem] p-8 shadow-2xl text-white group hover:scale-[1.02] transition-all duration-300 border border-[#112240]">
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-white/10 rounded-2xl text-white group-hover:bg-[#D4AF37] group-hover:text-white transition-all duration-300">
              <Clock className="w-6 h-6" />
            </div>
            {kpisData?.ventana && (
              <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm",
                kpisData.ventana.semaforo === 'ROJO' ? 'bg-rose-500' : 
                kpisData.ventana.semaforo === 'AMARILLO' ? 'bg-amber-500' : 'bg-emerald-500'
              )}>
                En Curso
              </div>
            )}
          </div>
          <h3 className="text-[#D4AF37] font-bold text-sm uppercase tracking-tight mb-1">Tiempo de Ventana</h3>
          {kpisData?.ventana ? (
            <>
              <p className="text-2xl font-black mb-4">
                {kpisData.ventana.tiempoRestante.dias}d {kpisData.ventana.tiempoRestante.horas}h {kpisData.ventana.tiempoRestante.minutos}m
              </p>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Restantes para el cierre</p>
            </>
          ) : (
            <p className="text-xl font-bold text-white/40">Sin ventana activa</p>
          )}
        </div>
      </div>

      {/* Accesos Rápidos y Acciones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lado Izquierdo: Tarjetas de Acción (8/12) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-left-4 duration-700 delay-200">
          
          {/* Card: Registro Manual */}
          <Link href="/secretaria/registro-horarios" className="group">
            <div className="h-full bg-white dark:bg-[#0A192F] rounded-[3rem] p-8 shadow-xl border border-gray-100 dark:border-[#112240] hover:border-[#003366]/30 dark:hover:border-[#D4AF37]/50 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#003366]/5 dark:bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 space-y-6">
                <div className="p-4 bg-[#003366]/10 dark:bg-white/10 rounded-2xl text-[#003366] dark:text-[#D4AF37] w-fit">
                  <CheckSquare className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Asignación Excepcional</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Gestiona directamente la carga horaria para casos especiales o docentes que requieran asistencia administrativa.</p>
                </div>
                <div className="flex items-center text-[#003366] dark:text-[#D4AF37] font-black text-xs uppercase tracking-widest gap-2">
                  Ir al Formulario <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>

          {/* Card: Ambientes */}
          <Link href="/secretaria/ambientes" className="group">
            <div className="h-full bg-white dark:bg-[#0A192F] rounded-[3rem] p-8 shadow-xl border border-gray-100 dark:border-[#112240] hover:border-[#003366]/30 dark:hover:border-[#D4AF37]/50 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#003366]/5 dark:bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 space-y-6">
                <div className="p-4 bg-[#003366]/10 dark:bg-white/10 rounded-2xl text-[#003366] dark:text-[#D4AF37] w-fit">
                  <School className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Control de Infraestructura</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">Administra la disponibilidad de aulas y laboratorios garantizando una distribución óptima del espacio físico.</p>
                </div>
                <div className="flex items-center text-[#003366] dark:text-[#D4AF37] font-black text-xs uppercase tracking-widest gap-2">
                  Ver Ambientes <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>

          {/* Card: Reportes Consolidados */}
          <div className="md:col-span-2 bg-white dark:bg-[#0A192F] rounded-[3rem] p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-[#112240] overflow-hidden relative">
            <div className="flex flex-col xl:flex-row items-center justify-between gap-6 xl:gap-8">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
                <div className="p-4 sm:p-5 bg-blue-50 dark:bg-[#D4AF37]/10 rounded-[2rem] text-blue-600 dark:text-[#D4AF37] flex-shrink-0">
                  <FileDown className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-1 truncate sm:whitespace-normal">Consolidados Académicos</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm max-w-md">Genera y exporta los padrones oficiales de la programación académica para su validación y archivo.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full xl:w-auto">
                <Boton
                  variante="borde"
                  className="flex-1 xl:flex-none px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold border-gray-200 dark:border-[#112240] text-sm sm:text-base whitespace-nowrap hover:bg-[#003366] hover:text-white hover:border-[#003366] dark:hover:bg-[#D4AF37] dark:hover:text-[#0A192F] dark:hover:border-[#D4AF37] transition-all"
                  onClick={() => handleDescargarGlobal('pdf')}
                  disabled={!!descargando}
                >
                  {descargando === 'pdf' ? <SpinnerCarga /> : <><FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> PDF Global</>}
                </Boton>
                <Boton
                  variante="borde"
                  className="flex-1 xl:flex-none px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold border-gray-200 dark:border-[#112240] text-sm sm:text-base whitespace-nowrap hover:bg-[#003366] hover:text-white hover:border-[#003366] dark:hover:bg-[#D4AF37] dark:hover:text-[#0A192F] dark:hover:border-[#D4AF37] transition-all"
                  onClick={() => handleDescargarGlobal('excel')}
                  disabled={!!descargando}
                >
                  {descargando === 'excel' ? <SpinnerCarga /> : <><FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Excel Global</>}
                </Boton>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Publicación y Notificación (4/12) */}
        <div className="lg:col-span-4 animate-in slide-in-from-right-4 duration-700 delay-300">
          <div className="bg-[#0A192F] h-full rounded-[3rem] p-10 shadow-2xl text-white flex flex-col justify-between relative overflow-hidden group border border-[#112240]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full -ml-10 -mb-10 blur-2xl" />
            
            <div className="relative z-10 space-y-8">
              <div className="p-5 bg-[#D4AF37]/20 rounded-[2rem] text-[#D4AF37] w-fit">
                <CheckSquare className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tight mb-4">Emisión Oficial de Horarios</h3>
                <p className="text-white/60 leading-relaxed mb-6">
                  Aprueba y emite de forma definitiva la programación académica. Esta acción hará visibles los horarios para toda la comunidad estudiantil.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm font-bold text-white/80">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Transición a estado 'Publicado Oficialmente'
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-white/80">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Cierre de modificaciones regulares del periodo
                  </div>
                </div>
              </div>
            </div>

            <Boton
              className="relative z-10 w-full py-8 rounded-[2rem] bg-white text-[#0A192F] hover:bg-[#D4AF37] transition-all duration-500 font-black text-xl flex items-center justify-center gap-3 mt-12 shadow-2xl shadow-black/20"
              onClick={() => setModalPublicarOpen(true)}
              disabled={publicarPeriodoMutation.isPending}
            >
              {publicarPeriodoMutation.isPending ? 'PROCESANDO...' : 'PUBLICAR'}
              <ArrowRight className="w-6 h-6" />
            </Boton>
          </div>
        </div>
      </div>

      {/* Sección de Gráficos de Avance */}
      <div className="animate-in slide-in-from-bottom-4 duration-700 delay-400">
        <div className="bg-white dark:bg-[#0A192F] rounded-[3rem] shadow-xl border border-gray-100 dark:border-[#112240] p-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#003366]/5 dark:bg-white/5 rounded-2xl text-[#003366] dark:text-[#D4AF37]">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Avance de Programación</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Top 10 Cursos por Periodo</p>
              </div>
            </div>
          </div>

          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 80, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" className="dark:opacity-10" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  dataKey="curso"
                  type="category"
                  width={250}
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc', opacity: 0.1 }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }}
                  itemStyle={{ fontWeight: 800, fontSize: '14px' }}
                />
                <Bar dataKey="porcentaje" radius={[0, 20, 20, 0]} barSize={32}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.porcentaje === 100 ? '#10b981' : '#D4AF37'} />
                  ))}
                  <LabelList 
                    dataKey="porcentaje" 
                    position="right" 
                    formatter={(value: number) => `${value}%`} 
                    style={{ fontWeight: 900, fontSize: '14px', fill: '#64748b' }} 
                    offset={15}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modal de Publicación */}
      <Modal
        abierto={modalPublicarOpen}
        cerrar={() => setModalPublicarOpen(false)}
        titulo="¿Confirmar Publicación Oficial?"
      >
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center ring-8 ring-emerald-50/50 dark:ring-emerald-500/5">
              <CheckSquare className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Emisión de Horarios</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              Esta acción emitirá oficialmente la programación académica, cerrando la edición regular del periodo y notificando la publicación.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-3xl p-5 flex gap-4">
            <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-800 dark:text-blue-300 font-bold leading-relaxed">
              Después de publicar, los horarios dejarán de estar en estado borrador (amarillo).
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Boton
              variante="secundario"
              onClick={() => setModalPublicarOpen(false)}
              className="flex-1 py-4 rounded-2xl font-bold border-gray-200 dark:border-[#112240]"
            >
              Cancelar
            </Boton>
            <Boton
              onClick={() => publicarPeriodoMutation.mutate()}
              disabled={publicarPeriodoMutation.isPending}
              className="flex-1 py-4 rounded-2xl font-black shadow-lg bg-[#003366] text-white hover:bg-[#002244] dark:bg-[#D4AF37] dark:text-[#0A192F] dark:hover:bg-[#B8962E]"
            >
              {publicarPeriodoMutation.isPending ? 'Publicando...' : 'Confirmar Publicación'}
            </Boton>
          </div>
        </div>
      </Modal>

      {toast && <NotificacionToast mensaje={toast.mensaje} tipo={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  );
}

