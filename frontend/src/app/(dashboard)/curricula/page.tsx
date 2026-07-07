'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Search, Plus, Hash, FileText, CheckCircle, XCircle } from 'lucide-react';
import { curriculaService } from '@/services/curricula.service';
import { useAuthStore } from '@/stores/auth.store';
import { TablaDatos } from '@/components/ui/TablaDatos';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { Boton } from '@/components/ui/Boton';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { cn } from '@/lib/utilidades';

const curriculaSchema = z.object({
  codigo: z.string().min(1, 'El código es obligatorio'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  vigente: z.boolean(),
});

type CurriculaFormData = z.infer<typeof curriculaSchema>;

export default function CurriculaPage() {
  const queryClient = useQueryClient();
  const { usuario } = useAuthStore();
  const esAdmin = usuario?.rol === 'ADMINISTRADOR';

  const [buscar, setBuscar] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' | 'advertencia' } | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['curricula', buscar],
    queryFn: () => curriculaService.listar({ buscar }).then((res) => res.data),
  });

  const lista = Array.isArray(response) ? response : response?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CurriculaFormData>({
    resolver: zodResolver(curriculaSchema),
    defaultValues: {
      codigo: '',
      nombre: '',
      vigente: false,
    },
  });

  const vigenteValue = watch('vigente');

  const guardarMutation = useMutation({
    mutationFn: (datos: CurriculaFormData) => {
      if (editando) {
        return curriculaService.actualizar(editando.id, datos);
      }
      return curriculaService.crear(datos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curricula'] });
      setToast({
        mensaje: editando ? 'Currícula actualizada exitosamente' : 'Currícula creada exitosamente',
        tipo: 'exito',
      });
      cerrarModal();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Error al guardar la currícula';
      setToast({ mensaje: msg, tipo: 'error' });
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => curriculaService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curricula'] });
      setToast({ mensaje: 'Currícula desactivada exitosamente', tipo: 'exito' });
    },
    onError: () => {
      setToast({ mensaje: 'Error al desactivar currícula', tipo: 'error' });
    },
  });

  const abrirCrear = () => {
    setEditando(null);
    reset({ codigo: '', nombre: '', vigente: false });
    setMostrarModal(true);
  };

  const abrirEditar = (item: any) => {
    setEditando(item);
    reset({
      codigo: item.codigo ?? '',
      nombre: item.nombre ?? '',
      vigente: item.vigente ?? false,
    });
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setEditando(null);
    reset();
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
      ),
    },
    {
      clave: 'nombre',
      titulo: 'Nombre',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#003366]/60 dark:text-[#D4AF37]/80" />
          <span className="font-bold text-gray-800 dark:text-gray-100">{item.nombre}</span>
        </div>
      ),
    },
    {
      clave: 'vigente',
      titulo: 'Vigente',
      render: (item: any) => (
        item.vigente ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50">
            <CheckCircle className="w-3.5 h-3.5" />
            Vigente
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-50 text-gray-500 border border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-[#112240]">
            <XCircle className="w-3.5 h-3.5" />
            Anterior
          </span>
        )
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
          <h1 className="text-3xl font-serif font-bold tracking-tight text-[#003366] dark:text-white">Currículas</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Gestiona las currículas (mallas curriculares) de la escuela.</p>
        </div>

        <div className="flex w-full gap-3 sm:w-auto items-end">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-[#112240] rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all bg-white dark:bg-[#050f20] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-sm"
            />
          </div>
          {esAdmin && (
            <Boton onClick={abrirCrear} className="rounded-2xl px-6 bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] shadow-lg shadow-[#003366]/20 dark:shadow-[#D4AF37]/20 transition-all">
              <Plus className="w-4 h-4 mr-2" />
              Nueva currícula
            </Boton>
          )}
        </div>
      </div>

      <div className="pt-4">
        <TablaDatos
          columnas={columnas}
          datos={lista}
          loading={isLoading}
          alEditar={esAdmin ? abrirEditar : undefined}
          alEliminar={esAdmin ? (item) => {
            if (window.confirm(`¿Estás seguro de desactivar la currícula "${item.nombre}"?`)) {
              eliminarMutation.mutate(item.id);
            }
          } : undefined}
        />
      </div>

      <Modal
        isOpen={mostrarModal}
        onClose={cerrarModal}
        titulo={editando ? 'Editar Currícula' : 'Registrar Nueva Currícula'}
      >
        <form onSubmit={handleSubmit((datos) => guardarMutation.mutate(datos))} className="space-y-6">
          <div className="grid gap-6">
            <CampoTexto
              label="Código"
              placeholder="Ej: 2024"
              {...register('codigo')}
              error={errors.codigo?.message}
            />
            <CampoTexto
              label="Nombre"
              placeholder="Ej: Currícula 2024"
              {...register('nombre')}
              error={errors.nombre?.message}
            />
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400">Estado de Vigencia</label>
              <SelectorInstitucional
                value={vigenteValue ? 'true' : 'false'}
                onChange={(val: any) => {
                  setValue('vigente', val === 'true', { shouldDirty: true, shouldTouch: true });
                }}
                opciones={[
                  { value: 'false', label: 'Anterior (No Vigente)' },
                  { value: 'true', label: 'Vigente (Actual)' }
                ]}
                className="border-gray-200 dark:border-[#112240] bg-white dark:bg-[#050f20]"
              />
              {errors.vigente && (
                <p className="text-sm text-red-500 mt-1 ml-1">{errors.vigente.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-[#112240]">
            <Boton type="button" variant="outline" onClick={cerrarModal} className="rounded-xl px-6 bg-white dark:bg-[#050f20] border-gray-200 dark:border-[#112240] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#112240]">
              Cancelar
            </Boton>
            <Boton type="submit" cargando={guardarMutation.isPending} className="rounded-xl px-8 bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] shadow-md shadow-[#003366]/10 dark:shadow-[#D4AF37]/10">
              {editando ? 'Actualizar Currícula' : 'Crear Currícula'}
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
