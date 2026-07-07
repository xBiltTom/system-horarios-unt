'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Calendar, Info, Clock } from 'lucide-react';
import { periodosService } from '@/services/periodos.service';
import { TablaDatos } from '@/components/ui/TablaDatos';
import { Card, CardContent } from '@/components/ui/Card';
import { Boton } from '@/components/ui/Boton';
import { Modal } from '@/components/ui/Modal';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { cn } from '@/lib/utilidades';

export default function PeriodosPage() {
  const queryClient = useQueryClient();
  const [buscar, setBuscar] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [periodoEditando, setPeriodoEditando] = useState<any>(null);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    tipo: 'I' as 'I' | 'II' | 'III',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'BORRADOR',
    activo: false,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const periodos = Array.isArray(response) ? response : response?.data || [];

  const datosFiltrados = periodos.filter((p: any) => 
    p.nombre.toLowerCase().includes(buscar.toLowerCase())
  );

  const crearMutation = useMutation({
    mutationFn: (datos: any) => periodosService.crear(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      setModalAbierto(false);
      setToast({ mensaje: 'Período creado exitosamente', tipo: 'exito' });
      resetFormulario();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Error al crear período';
      setToast({ mensaje: msg, tipo: 'error' });
    },
  });

  const actualizarMutation = useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: any }) => periodosService.actualizar(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      setModalAbierto(false);
      setToast({ mensaje: 'Período actualizado exitosamente', tipo: 'exito' });
      resetFormulario();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Error al actualizar período';
      setToast({ mensaje: msg, tipo: 'error' });
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => periodosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
      setToast({ mensaje: 'Período desactivado exitosamente', tipo: 'exito' });
    },
    onError: () => {
      setToast({ mensaje: 'Error al desactivar período', tipo: 'error' });
    },
  });

  const resetFormulario = () => {
    setFormulario({
      nombre: '',
      tipo: 'I',
      fecha_inicio: '',
      fecha_fin: '',
      estado: 'BORRADOR',
      activo: false,
    });
    setPeriodoEditando(null);
  };

  const abrirModalCrear = () => {
    resetFormulario();
    setModalAbierto(true);
  };

  const abrirModalEditar = (periodo: any) => {
    setPeriodoEditando(periodo);
    setFormulario({
      nombre: periodo.nombre,
      tipo: periodo.tipo || 'I',
      fecha_inicio: periodo.fecha_inicio.split('T')[0],
      fecha_fin: periodo.fecha_fin.split('T')[0],
      estado: periodo.estado,
      activo: periodo.activo || false,
    });
    setModalAbierto(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (periodoEditando) {
      actualizarMutation.mutate({ id: periodoEditando.id, datos: formulario });
    } else {
      crearMutation.mutate(formulario);
    }
  };

  const columnas = [
    { 
      clave: 'nombre', 
      titulo: 'Período Académico',
      render: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg border border-transparent dark:border-[#112240]">
            <Calendar className="w-4 h-4 text-[#003366] dark:text-[#D4AF37]" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white tracking-wide">{item.nombre}</span>
        </div>
      )
    },
    { 
      clave: 'tipo', 
      titulo: 'Tipo',
      render: (item: any) => {
        let etiqueta = item.tipo;
        let color = 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300';
        if (item.tipo === 'I') {
          etiqueta = 'I (Impares)';
          color = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        } else if (item.tipo === 'II') {
          etiqueta = 'II (Pares)';
          color = 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
        } else if (item.tipo === 'III') {
          etiqueta = 'III (Extraordinario)';
          color = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
        }
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${color}`}>
            {etiqueta}
          </span>
        );
      }
    },
    { 
      clave: 'fecha_inicio', 
      titulo: 'Inicio / Fin',
      render: (item: any) => (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs font-medium">
          <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span>{new Date(item.fecha_inicio).toLocaleDateString('es-PE')}</span>
          <span className="text-gray-300 dark:text-gray-600">→</span>
          <span>{new Date(item.fecha_fin).toLocaleDateString('es-PE')}</span>
        </div>
      )
    },
    {
      clave: 'estado',
      titulo: 'Estado Proceso',
      render: (item: any) => {
        let color = 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-900/50 dark:text-gray-400 dark:border-gray-800';
        if (item.estado === 'ACTIVO') color = 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50';
        if (item.estado === 'BORRADOR') color = 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50';
        if (item.estado === 'CERRADO') color = 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-900/50';
        
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border ${color}`}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full mr-2",
              item.estado === 'ACTIVO' ? 'bg-emerald-500' : 
              item.estado === 'BORRADOR' ? 'bg-amber-500' : 'bg-rose-500'
            )} />
            {item.estado}
          </span>
        );
      },
    },
    {
      clave: 'activo',
      titulo: 'Vigencia',
      render: (item: any) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border ${
          item.activo ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/50 dark:text-gray-400 dark:border-gray-800'
        }`}>
          {item.activo ? 'Vigente' : 'Inactivo'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#003366] dark:text-white tracking-tight">Períodos Académicos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Configuración de ciclos y vigencia de la programación.</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar período..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-[#112240] rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all bg-white dark:bg-[#050f20] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-sm"
            />
          </div>
          <Boton onClick={abrirModalCrear} className="rounded-2xl px-6 bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] shadow-lg shadow-[#003366]/20 dark:shadow-[#D4AF37]/20 transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Período
          </Boton>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-[#000000]/20 rounded-[2.5rem] overflow-hidden bg-transparent">
        <CardContent className="p-0">
          <TablaDatos
            columnas={columnas}
            datos={datosFiltrados}
            loading={isLoading}
            alEditar={abrirModalEditar}
            alEliminar={(periodo) => {
              if (confirm(`¿Está seguro de desactivar el período "${periodo.nombre}"?`)) {
                eliminarMutation.mutate(periodo.id);
              }
            }}
          />
        </CardContent>
      </Card>

      <Modal 
        isOpen={modalAbierto} 
        onClose={() => setModalAbierto(false)}
        titulo={periodoEditando ? 'Editar Período Académico' : 'Registrar Nuevo Período'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <CampoTexto
            label="Nombre del Período"
            placeholder="Ej: 2026-I"
            value={formulario.nombre}
            onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400">Tipo de Período</label>
            <SelectorInstitucional
              value={formulario.tipo} 
              onChange={(val: any) => setFormulario({ ...formulario, tipo: val as 'I' | 'II' | 'III' })}
              opciones={[
                { value: 'I', label: 'Periodo I (Ciclos Impares: 1,3,5,7,9)' },
                { value: 'II', label: 'Periodo II (Ciclos Pares: 2,4,6,8,10)' },
                { value: 'III', label: 'Periodo III (Extraordinario - Sin Ciclos)' }
              ]}
              className="border-gray-200 dark:border-[#112240] bg-white dark:bg-[#050f20]"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <CampoTexto
              label="Fecha de Inicio"
              type="date"
              value={formulario.fecha_inicio}
              onChange={(e) => setFormulario({ ...formulario, fecha_inicio: e.target.value })}
              required
            />
            <CampoTexto
              label="Fecha de Finalización"
              type="date"
              value={formulario.fecha_fin}
              onChange={(e) => setFormulario({ ...formulario, fecha_fin: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400">Estado Inicial</label>
            <SelectorInstitucional 
              value={formulario.estado} 
              onChange={(val: any) => setFormulario({ ...formulario, estado: val })}
              opciones={[
                { value: 'BORRADOR', label: 'Borrador (Solo Admin)' },
                { value: 'ACTIVO', label: 'Activo (Vigente)' },
                { value: 'CERRADO', label: 'Cerrado (Histórico)' }
              ]}
              className="border-gray-200 dark:border-[#112240] bg-white dark:bg-[#050f20]"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="periodo-activo"
              checked={formulario.activo}
              onChange={(e) => setFormulario({ ...formulario, activo: e.target.checked })}
              className="w-5 h-5 text-[#003366] dark:text-[#D4AF37] focus:ring-[#003366] dark:focus:ring-[#D4AF37] border-gray-300 dark:border-[#112240] rounded dark:bg-[#050f20] transition-colors"
            />
            <label htmlFor="periodo-activo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Establecer como período vigente (desactivará otros períodos)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-[#112240]">
            <Boton type="button" variant="outline" onClick={() => setModalAbierto(false)} className="rounded-xl px-6 bg-white dark:bg-[#050f20] border-gray-200 dark:border-[#112240] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#112240]">
              Cancelar
            </Boton>
            <Boton type="submit" cargando={crearMutation.isPending || actualizarMutation.isPending} className="rounded-xl px-8 bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] shadow-md shadow-[#003366]/10 dark:shadow-[#D4AF37]/10">
              {periodoEditando ? 'Guardar Cambios' : 'Registrar Período'}
            </Boton>
          </div>
        </form>
      </Modal>

      {toast && (
        <NotificacionToast 
          mensaje={toast.mensaje} 
          tipo={toast.tipo === 'exito' ? 'exito' : 'error'} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
