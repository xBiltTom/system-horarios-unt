'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { cursosService } from '@/services/cursos.service';
import { curriculaService } from '@/services/curricula.service';
import { cargaHorariaService } from '@/services/carga-horaria.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { Boton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { SelectorFiltrable } from '@/components/ui/SelectorFiltrable';
import { Plus, Trash2, Save, Clock, GraduationCap, Server } from 'lucide-react';

export default function OfertaAcademicaPage() {
  const queryClient = useQueryClient();
  const [idPeriodo, setIdPeriodo] = useState<number>(0);
  const [idCurso, setIdCurso] = useState<number>(0);
  const [idCiclo, setIdCiclo] = useState<number>(0);
  const [idCurricula, setIdCurricula] = useState<number | null>(null);
  const [tipoCurso, setTipoCurso] = useState<'REGULAR' | 'ELECTIVO'>('REGULAR');
  const [componentes, setComponentes] = useState<any[]>([]);
  
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: 'exito' | 'error' | 'advertencia';
  } | null>(null);

  const { data: periodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosService.listar().then(res => res.data)
  });

  // Pre-seleccionar periodo activo
  useEffect(() => {
    if (periodos && idPeriodo === 0) {
      const activo = periodos.find((p: any) => p.activo);
      if (activo) setIdPeriodo(activo.id);
    }
  }, [periodos, idPeriodo]);

  const { data: curricula } = useQuery({
    queryKey: ['curricula'],
    queryFn: () => curriculaService.listar().then(res => res.data)
  });

  // Find vigente curricula to set as default
  const curriculaVigente = curricula?.find((c: any) => c.vigente);

  // Auto-set idCurricula to vigente when curricula loads
  useEffect(() => {
    if (curriculaVigente && idCurricula === null) {
      setIdCurricula(curriculaVigente.id);
    }
  }, [curriculaVigente, idCurricula]);

  const { data: cursos } = useQuery({
    queryKey: ['cursos', idCurricula],
    queryFn: () => cursosService.listar({ id_curricula: idCurricula || undefined }).then(res => res.data),
    enabled: idCurricula !== null
  });

  const { data: periodoDetalle } = useQuery({
    queryKey: ['periodo', idPeriodo],
    queryFn: () => periodosService.obtener(idPeriodo).then(res => res.data),
    enabled: idPeriodo > 0
  });

  const { data: ciclosConOferta } = useQuery({
    queryKey: ['ciclos-con-oferta', idPeriodo],
    queryFn: () => cargaHorariaService.obtenerCiclosPorPeriodo(idPeriodo).then(res => res.data),
    enabled: idPeriodo > 0
  });

  const { data: ciclosDisponibles } = useQuery({
    queryKey: ['ciclos-disponibles', idPeriodo],
    queryFn: () => periodosService.obtenerCiclosPorPeriodo(idPeriodo).then(res => res.data),
    enabled: idPeriodo > 0
  });

  const { data: ofertaExistente, isLoading: isLoadingOferta } = useQuery({
    queryKey: ['oferta-detalle', idPeriodo, idCurso, idCiclo],
    queryFn: () => cargaHorariaService.obtenerOfertaDetalle(idPeriodo, idCurso, idCiclo).then(res => res.data),
    enabled: idPeriodo > 0 && idCurso > 0 && idCiclo > 0
  });

  // Usar useEffect para reaccionar a ofertaExistente
  useEffect(() => {
    if (isLoadingOferta) return;

    if (ofertaExistente) {
      setTipoCurso(ofertaExistente.tipo_curso);
      const comps = ofertaExistente.componentes.map((c: any) => ({
        tipo: c.tipo,
        horas_requeridas: c.horas_requeridas / (c.grupos?.length || 1),
        n_grupos: c.grupos?.length || 1
      }));
      setComponentes(comps);
    } else if (idCurso > 0 && idPeriodo > 0 && idCiclo > 0) {
      // Si no existe pero hay curso seleccionado, empezar con uno por defecto
      setComponentes([{ tipo: 'TEORIA', horas_requeridas: 2, n_grupos: 1 }]);
    } else {
      setComponentes([]);
    }
  }, [ofertaExistente, idCurso, idPeriodo, idCiclo, isLoadingOferta]);

  const mutation = useMutation({
    mutationFn: (datos: any) => cargaHorariaService.configurarOferta(datos),
    onSuccess: () => {
      setMensaje({ texto: 'Oferta académica configurada correctamente', tipo: 'exito' });
      queryClient.invalidateQueries({ queryKey: ['oferta-detalle', idPeriodo, idCurso, idCiclo] });
      queryClient.invalidateQueries({ queryKey: ['curso', idCurso] });
    },
    onError: (error: any) => {
      setMensaje({ texto: error.response?.data?.error || 'Error al configurar oferta', tipo: 'error' });
    }
  });

  const agregarComponente = () => {
    // Si no hay teoría, agregamos teoría por defecto, si no, laboratorio
    const tieneTeoria = componentes.some(c => c.tipo === 'TEORIA');
    const tieneLab = componentes.some(c => c.tipo === 'LABORATORIO');

    if (tieneTeoria && tieneLab) {
      setMensaje({ texto: 'Este curso ya tiene todos los componentes permitidos (Teoría-Práctica y Laboratorio)', tipo: 'advertencia' });
      return;
    }

    const nuevoTipo = tieneTeoria ? 'LABORATORIO' : 'TEORIA';
    setComponentes([...componentes, { tipo: nuevoTipo, horas_requeridas: 2, n_grupos: 1 }]);
  };

  const eliminarComponente = (index: number) => {
    setComponentes(componentes.filter((_, i) => i !== index));
  };

  const actualizarComponente = (index: number, campo: string, valor: any) => {
    if (campo === 'tipo') {
      const yaExiste = componentes.some((c, i) => i !== index && c.tipo === valor);
      if (yaExiste) {
        setMensaje({ texto: `El componente de ${valor === 'TEORIA' ? 'Teoría-Práctica' : 'Laboratorio'} ya está agregado.`, tipo: 'advertencia' });
        return;
      }
    }
    const nuevos = [...componentes];
    nuevos[index][campo] = valor;
    setComponentes(nuevos);
  };

  const guardarOferta = () => {
    if (!idPeriodo || !idCurso || !idCiclo) {
      setMensaje({ texto: 'Debe completar todos los campos obligatorios', tipo: 'error' });
      return;
    }

    // Validar duplicados de tipos (Teoría/Laboratorio)
    const tipos = componentes.map(c => c.tipo);
    if (new Set(tipos).size !== tipos.length) {
      setMensaje({ texto: 'No se pueden guardar componentes duplicados para el mismo curso.', tipo: 'error' });
      return;
    }
    
    // Validar que no haya horas en 0
    if (componentes.some(c => c.horas_requeridas <= 0 || c.n_grupos <= 0)) {
      setMensaje({ texto: 'Las horas y grupos deben ser mayores a 0', tipo: 'error' });
      return;
    }

    mutation.mutate({
      id_periodo: idPeriodo,
      id_curso: idCurso,
      id_ciclo: idCiclo,
      tipo_curso: tipoCurso,
      componentes: componentes.map(c => ({
        ...c,
        horas_requeridas: Number(c.horas_requeridas),
        n_grupos: Number(c.n_grupos)
      }))
    });
  };

  return (
    <div className="space-y-8 max-w-[1800px] mx-auto pb-20 animate-in fade-in duration-500">
      {/* Header Institucional */}
      {/* Dossier Header */}
      <div className="pb-5 border-b border-[#0A192F]/12 dark:border-white/10">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0A192F]/40 dark:text-white/40 mb-1.5">
          <Server className="w-3.5 h-3.5" />
          <span>Configuración Académica</span>
        </div>
        <h1 className="font-serif text-[2rem] text-[#0A192F] dark:text-white tracking-tight leading-tight">Oferta Académica</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 overflow-visible border-none shadow-xl bg-white dark:bg-[#0A192F] rounded-xl">
          <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
            <CardTitle className="text-xl font-serif text-[#003366] dark:text-white">Datos de la Oferta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 min-h-[450px]">
            <SelectorInstitucional
              label="Período Académico"
              value={idPeriodo}
              onChange={(val: any) => setIdPeriodo(Number(val))}
              opciones={[
                { value: 0, label: '-- Seleccione un periodo --' },
                ...(periodos?.map((p: any) => ({ value: p.id, label: p.nombre })) || [])
              ]}
            />

            <SelectorInstitucional
              label="Ciclo"
              value={idCiclo}
              onChange={(val: any) => setIdCiclo(Number(val))}
              disabled={!idPeriodo}
              opciones={[
                { value: 0, label: '-- Seleccione un ciclo --' },
                ...(ciclosDisponibles?.map((c: any) => ({ value: c.id, label: `Ciclo ${c.numero}` })) || [])
              ]}
            />

            <SelectorInstitucional
              label="Currícula"
              value={idCurricula?.toString() || ''}
              onChange={(val: any) => setIdCurricula(val ? parseInt(val) : null)}
              opciones={
                (curricula || []).map((c: any) => ({
                  value: String(c.id),
                  label: `${c.codigo} - ${c.nombre}${c.vigente ? ' (Vigente)' : ''}`
                }))
              }
            />

            <SelectorFiltrable
              label="Curso"
              value={idCurso}
              onChange={(valor) => setIdCurso(Number(valor))}
              opciones={cursos?.map((c: any) => ({
                value: c.id,
                label: `${c.codigo} - ${c.nombre}`
              })) || []}
              placeholder="Buscar curso por código o nombre..."
            />

            <SelectorInstitucional
              label="Tipo de Curso"
              value={tipoCurso}
              onChange={(val: any) => setTipoCurso(val)}
              opciones={[
                { value: 'REGULAR', label: 'Regular' },
                { value: 'ELECTIVO', label: 'Electivo' }
              ]}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-xl bg-white dark:bg-[#0A192F] rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
            <CardTitle className="text-xl font-serif text-[#003366] dark:text-white">Componentes y Grupos</CardTitle>
            <Boton
              onClick={agregarComponente}
              className="px-4 py-2 text-sm bg-white hover:bg-gray-50 text-[#003366] border border-gray-200 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white rounded-xl font-bold shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Componente
            </Boton>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {componentes.map((comp, index) => (
              <div key={index} className="p-6 border border-gray-100 dark:border-white/5 rounded-2xl bg-gray-50/50 dark:bg-[#050f20] space-y-4 relative group transition-colors">
                <button
                  onClick={() => eliminarComponente(index)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Eliminar Componente"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SelectorInstitucional
                    label="Tipo de Componente"
                    value={comp.tipo}
                    onChange={(val: any) => actualizarComponente(index, 'tipo', val)}
                    opciones={[
                      { value: 'TEORIA', label: 'Teoría-Práctica' },
                      { value: 'LABORATORIO', label: 'Laboratorio' },
                    ]}
                  />
                  <CampoTexto
                    label={comp.tipo === 'LABORATORIO' ? "Horas/Semana (por grupo)" : "Horas/Semana (Teoría)"}
                    type="number"
                    value={comp.horas_requeridas}
                    onChange={(e: any) => actualizarComponente(index, 'horas_requeridas', Number(e.target.value))}
                  />
                  <CampoTexto
                    label="Nº Grupos"
                    type="number"
                    value={comp.n_grupos}
                    onChange={(e: any) => actualizarComponente(index, 'n_grupos', Number(e.target.value))}
                    disabled={comp.tipo === 'TEORIA'}
                  />
                </div>
                <div className="pt-2">
                  <p className="text-xs font-bold text-[#003366] dark:text-[#D4AF37] flex items-center gap-2 bg-[#003366]/5 dark:bg-[#D4AF37]/10 p-3 rounded-xl border border-[#003366]/10 dark:border-[#D4AF37]/20">
                    <Clock className="w-4 h-4" />
                    RESUMEN: {comp.horas_requeridas}h por grupo × {comp.n_grupos} {comp.n_grupos === 1 ? 'grupo' : 'grupos'} = {comp.horas_requeridas * comp.n_grupos} horas totales de carga.
                  </p>
                </div>
              </div>
            ))}

            <div className="pt-6 flex justify-end border-t border-gray-100 dark:border-white/5">
              <Boton 
                onClick={guardarOferta} 
                disabled={mutation.isPending}
                className="px-8 py-3.5 rounded-xl bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] font-bold shadow-lg shadow-[#003366]/20 dark:shadow-[#D4AF37]/10"
              >
                <Save className="h-5 w-5 mr-2" /> 
                {mutation.isPending ? 'Guardando...' : 'Guardar Oferta'}
              </Boton>
            </div>
          </CardContent>
        </Card>
      </div>

      {mensaje && (
        <NotificacionToast
          mensaje={mensaje.texto}
          tipo={mensaje.tipo}
          onClose={() => setMensaje(null)}
        />
      )}
    </div>
  );
}
