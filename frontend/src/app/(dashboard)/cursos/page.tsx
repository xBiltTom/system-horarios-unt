'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Search, Plus, BookOpen, Hash, Layers, FileText } from 'lucide-react';
import { cursosService } from '@/services/cursos.service';
import { curriculaService } from '@/services/curricula.service';
import { useAuthStore } from '@/stores/auth.store';
import { TablaDatos } from '@/components/ui/TablaDatos';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { cn } from '@/lib/utilidades';
import { Boton } from '@/components/ui/Boton';
import { NotificacionToast } from '@/components/ui/NotificacionToast';

const cursoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  codigo: z.string().min(1, 'El código es obligatorio'),
  creditos: z.coerce.number().int().min(1, 'Debe ser al menos 1'),
  id_curricula: z.number().int().positive().nullable().optional(),
});

type CursoFormData = z.infer<typeof cursoSchema>;

export default function CursosPage() {
  const queryClient = useQueryClient();
  const { usuario } = useAuthStore();
  const esAdmin = usuario?.rol === 'ADMINISTRADOR';

  const [buscar, setBuscar] = useState('');
  const [idCurriculaFiltro, setIdCurriculaFiltro] = useState<number | undefined>(undefined);
  const [mostrarModalCurso, setMostrarModalCurso] = useState(false);
  const [cursoEditando, setCursoEditando] = useState<any | null>(null);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' | 'advertencia' } | null>(null);

  const { data: curriculaList } = useQuery({
    queryKey: ['curricula'],
    queryFn: () => curriculaService.listar().then((res) => res.data),
  });

  const curriculaOpts = Array.isArray(curriculaList) ? curriculaList : curriculaList?.data || [];

  const { data: response, isLoading } = useQuery({
    queryKey: ['cursos', buscar, idCurriculaFiltro],
    queryFn: () => cursosService.listar({ buscar, id_curricula: idCurriculaFiltro }).then((res) => res.data),
  });

  const cursos = Array.isArray(response) ? response : response?.data || [];

  const {
    register: registerCurso,
    handleSubmit: handleSubmitCurso,
    reset: resetCurso,
    watch,
    setValue,
    formState: { errors: erroresCurso },
  } = useForm<CursoFormData>({
    resolver: zodResolver(cursoSchema),
    defaultValues: {
      nombre: '',
      codigo: '',
      creditos: 1,
      id_curricula: null,
    },
  });

  const guardarCursoMutation = useMutation({
    mutationFn: (datos: CursoFormData) => {
      if (cursoEditando) {
        return cursosService.actualizar(cursoEditando.id, datos);
      }
      return cursosService.crear(datos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      setToast({ 
        mensaje: cursoEditando ? 'Curso actualizado exitosamente' : 'Curso creado exitosamente', 
        tipo: 'exito' 
      });
      cerrarModalCurso();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Error al guardar el curso';
      setToast({ mensaje: msg, tipo: 'error' });
    },
  });

  const eliminarCursoMutation = useMutation({
    mutationFn: (id: number) => cursosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      setToast({ mensaje: 'Curso desactivado exitosamente', tipo: 'exito' });
    },
    onError: () => {
      setToast({ mensaje: 'Error al desactivar curso', tipo: 'error' });
    },
  });

  const abrirCrearCurso = () => {
    setCursoEditando(null);
    resetCurso({
      nombre: '',
      codigo: '',
      creditos: 1,
      id_curricula: null,
    });
    setMostrarModalCurso(true);
  };

  const abrirEditarCurso = (curso: any) => {
    setCursoEditando(curso);
    resetCurso({
      nombre: curso.nombre ?? '',
      codigo: curso.codigo ?? '',
      creditos: curso.creditos ?? 1,
      id_curricula: curso.id_curricula ?? null,
    });
    setMostrarModalCurso(true);
  };

  const cerrarModalCurso = () => {
    setMostrarModalCurso(false);
    setCursoEditando(null);
    resetCurso();
  };

  const columnas = [
    { 
      clave: 'codigo', 
      titulo: 'Código',
      render: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg border border-transparent dark:border-[#112240]">
            <Hash className="w-4 h-4 text-[#003366] dark:text-[#D4AF37]" />
          </div>
          <span className="font-mono font-bold text-gray-900 dark:text-white tracking-wide">{item.codigo}</span>
        </div>
      )
    },
    { 
      clave: 'nombre', 
      titulo: 'Asignatura',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#003366]/60 dark:text-[#D4AF37]/80" />
          <span className="font-bold text-gray-800 dark:text-gray-100">{item.nombre}</span>
        </div>
      )
    },
    { 
      clave: 'creditos', 
      titulo: 'Créditos', 
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span className="bg-gray-100 dark:bg-[#112240] border border-transparent dark:border-[#D4AF37]/20 px-2 py-1 rounded-lg text-xs font-bold text-gray-600 dark:text-[#D4AF37]">
            {item.creditos} CR
          </span>
        </div>
      )
    },
    {
      clave: 'curricula',
      titulo: 'Currícula',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          {item.curricula ? (
            <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-lg border border-transparent ${
              item.curricula.vigente 
                ? 'bg-[#003366]/10 text-[#003366] dark:bg-[#D4AF37]/20 dark:text-[#D4AF37] dark:border-[#D4AF37]/30' 
                : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
            }`}>
              {item.curricula.nombre}
            </span>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">Sin asignar</span>
          )}
        </div>
      ),
    },
    {
      clave: 'activo',
      titulo: 'Estado',
      render: (item: any) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border ${
            item.activo 
              ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50' 
              : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50'
          }`}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", item.activo ? "bg-green-500" : "bg-red-500")} />
          {item.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-[#003366] dark:text-white">Cursos y Asignaturas</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Gestiona el catálogo de cursos activos de la escuela.</p>
        </div>

        <div className="flex w-full flex-wrap gap-3 sm:w-auto sm:flex-nowrap items-end">
          <div className="w-full sm:w-48 space-y-1">
            <SelectorInstitucional
              value={idCurriculaFiltro ?? ''}
              onChange={(val: any) => setIdCurriculaFiltro(val ? Number(val) : undefined)}
              opciones={[
                { value: '', label: 'Vigente (predet.)' },
                { value: '0', label: 'Sin currícula' },
                ...(curriculaOpts.map((c: any) => ({
                  value: String(c.id),
                  label: `${c.nombre}${c.vigente ? ' (Vigente)' : ''}`
                })))
              ]}
              className="border-gray-200 dark:border-[#112240] bg-white dark:bg-[#050f20]"
            />
          </div>
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={buscar}
              onChange={(event) => setBuscar(event.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-[#112240] rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all bg-white dark:bg-[#050f20] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-sm"
            />
          </div>
          {esAdmin && (
            <Boton onClick={abrirCrearCurso} className="rounded-2xl px-6 bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] shadow-lg shadow-[#003366]/20 dark:shadow-[#D4AF37]/20 transition-all">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo curso
            </Boton>
          )}
        </div>
      </div>

      <div className="pt-4">
        <TablaDatos 
          columnas={columnas} 
          datos={cursos} 
          loading={isLoading}
          alEditar={esAdmin ? abrirEditarCurso : undefined}
          alEliminar={esAdmin ? (item) => {
            if (window.confirm(`¿Estás seguro de desactivar el curso "${item.nombre}"?`)) {
              eliminarCursoMutation.mutate(item.id);
            }
          } : undefined}
        />
      </div>

      <Modal 
        isOpen={mostrarModalCurso} 
        onClose={cerrarModalCurso}
        titulo={cursoEditando ? 'Editar Curso' : 'Registrar Nuevo Curso'}
      >
        <form onSubmit={handleSubmitCurso((datos) => guardarCursoMutation.mutate(datos))} className="space-y-6">
          <div className="grid gap-6">
            <CampoTexto 
              label="Código de Asignatura" 
              placeholder="Ej: INF-123"
              {...registerCurso('codigo')} 
              error={erroresCurso.codigo?.message} 
            />
            <CampoTexto 
              label="Nombre de Asignatura" 
              placeholder="Ej: Ingeniería de Software"
              {...registerCurso('nombre')} 
              error={erroresCurso.nombre?.message} 
            />
            <CampoTexto 
              label="Número de Créditos" 
              type="number" 
              min="1" 
              max="10"
              {...registerCurso('creditos')} 
              error={erroresCurso.creditos?.message} 
            />
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400">Currícula</label>
              <SelectorInstitucional
                value={watch('id_curricula')?.toString() || ''}
                onChange={(val: any) => setValue('id_curricula', val ? parseInt(val) : null)}
                opciones={[
                  { value: '', label: '-- Sin asignar --' },
                  ...(curriculaOpts.map((c: any) => ({
                    value: String(c.id),
                    label: `${c.nombre}${c.vigente ? ' (Vigente)' : ''}`
                  })))
                ]}
                className="border-gray-200 dark:border-[#112240] bg-white dark:bg-[#050f20]"
              />
              {erroresCurso.id_curricula && (
                <p className="text-sm text-red-500 mt-1 ml-1">{erroresCurso.id_curricula.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-[#112240]">
            <Boton type="button" variant="outline" onClick={cerrarModalCurso} className="rounded-xl px-6 bg-white dark:bg-[#050f20] border-gray-200 dark:border-[#112240] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#112240]">
              Cancelar
            </Boton>
            <Boton type="submit" cargando={guardarCursoMutation.isPending} className="rounded-xl px-8 bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] shadow-md shadow-[#003366]/10 dark:shadow-[#D4AF37]/10">
              {cursoEditando ? 'Actualizar Curso' : 'Crear Curso'}
            </Boton>
          </div>
        </form>
      </Modal>

      {toast && (
        <NotificacionToast 
          mensaje={toast.mensaje} 
          tipo={toast.tipo} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
