'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, MapPin, Users, Info } from 'lucide-react';
import { ambientesService } from '@/services/ambientes.service';
import { TablaDatos } from '@/components/ui/TablaDatos';
import { Boton } from '@/components/ui/Boton';
import { Modal } from '@/components/ui/Modal';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utilidades';

export default function AmbientesPage() {
  const queryClient = useQueryClient();
  const usuario = useAuthStore(state => state.usuario);
  const esAdmin = usuario?.rol === 'ADMINISTRADOR';
  const [buscar, setBuscar] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ambienteEditando, setAmbienteEditando] = useState<any>(null);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);
  const [formulario, setFormulario] = useState({
    codigo: '',
    tipo: 'AULA',
    capacidad: 40,
    piso: '',
    equipamiento: '',
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ['ambientes'],
    queryFn: () => ambientesService.listar().then(res => res.data),
  });

  const ambientes = Array.isArray(response) ? response : response?.data || [];

  const crearMutation = useMutation({
    mutationFn: (datos: any) => ambientesService.crear(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ambientes'] });
      setModalAbierto(false);
      setToast({ mensaje: 'Ambiente creado exitosamente', tipo: 'exito' });
      resetFormulario();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Error al crear ambiente';
      setToast({ mensaje: msg, tipo: 'error' });
    },
  });

  const actualizarMutation = useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: any }) => ambientesService.actualizar(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ambientes'] });
      setModalAbierto(false);
      setToast({ mensaje: 'Ambiente actualizado exitosamente', tipo: 'exito' });
      resetFormulario();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Error al actualizar ambiente';
      setToast({ mensaje: msg, tipo: 'error' });
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => ambientesService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ambientes'] });
      setToast({ mensaje: 'Ambiente desactivado exitosamente', tipo: 'exito' });
    },
    onError: () => {
      setToast({ mensaje: 'Error al desactivar ambiente', tipo: 'error' });
    },
  });

  const resetFormulario = () => {
    setFormulario({
      codigo: '',
      tipo: 'AULA',
      capacidad: 40,
      piso: '',
      equipamiento: '',
    });
    setAmbienteEditando(null);
  };

  const abrirModalCrear = () => {
    resetFormulario();
    setModalAbierto(true);
  };

  const abrirModalEditar = (ambiente: any) => {
    setAmbienteEditando(ambiente);
    setFormulario({
      codigo: ambiente.codigo,
      tipo: ambiente.tipo,
      capacidad: ambiente.capacidad,
      piso: ambiente.piso?.toString() || '',
      equipamiento: ambiente.equipamiento || '',
    });
    setModalAbierto(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const datosParaEnviar = {
      ...formulario,
      capacidad: parseInt(formulario.capacidad as any) || 0,
      piso: formulario.piso ? parseInt(formulario.piso) : null,
    };
    if (ambienteEditando) {
      actualizarMutation.mutate({ id: ambienteEditando.id, datos: datosParaEnviar });
    } else {
      crearMutation.mutate(datosParaEnviar);
    }
  };

  const columnas = [
    { 
      clave: 'codigo', 
      titulo: 'Ambiente',
      render: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-lg border border-transparent dark:border-[#112240]">
            <MapPin className="w-4 h-4 text-[#003366] dark:text-[#D4AF37]" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white tracking-wide">{item.codigo}</span>
        </div>
      )
    },
    {
      clave: 'tipo',
      titulo: 'Tipo',
      render: (item: any) => {
        const isLab = item.tipo === 'LABORATORIO';
        return (
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-transparent ${
            isLab 
              ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-900/50' 
              : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50'
          }`}>
            {item.tipo}
          </span>
        );
      },
    },
    { 
      clave: 'capacidad', 
      titulo: 'Aforo',
      render: (item: any) => (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4" />
          <span>{item.capacidad} personas</span>
        </div>
      )
    },
    { 
      clave: 'piso', 
      titulo: 'Ubicación',
      render: (item: any) => (
        <span className="text-gray-600 dark:text-gray-300 font-medium">Piso {item.piso || 'N/A'}</span>
      )
    },
    {
      clave: 'activo',
      titulo: 'Estado',
      render: (item: any) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border ${
          item.activo ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50'
        }`}>
          <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", item.activo ? "bg-green-500" : "bg-red-500")} />
          {item.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  if (!esAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
          <Info className="w-12 h-12 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Acceso Restringido</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md text-center">Solo los administradores autorizados pueden gestionar la infraestructura física.</p>
      </div>
    );
  }

  const ambientesFiltrados = ambientes.filter((a: any) => 
    a.codigo.toLowerCase().includes(buscar.toLowerCase()) ||
    a.tipo.toLowerCase().includes(buscar.toLowerCase()) ||
    (a.equipamiento && a.equipamiento.toLowerCase().includes(buscar.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#003366] dark:text-white tracking-tight">Infraestructura Académica</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Gestión de aulas, laboratorios y espacios de aprendizaje.</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar ambiente..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-[#112240] rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all bg-white dark:bg-[#050f20] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 shadow-sm"
            />
          </div>
          <Boton onClick={abrirModalCrear} className="rounded-2xl px-6 bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] shadow-lg shadow-[#003366]/20 dark:shadow-[#D4AF37]/20 transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Ambiente
          </Boton>
        </div>
      </div>

      <div className="pt-4">
        <TablaDatos
          columnas={columnas}
          datos={ambientesFiltrados}
          loading={isLoading}
          alEditar={abrirModalEditar}
          alEliminar={(ambiente) => {
            if (confirm(`¿Está seguro de desactivar el ambiente "${ambiente.codigo}"?`)) {
              eliminarMutation.mutate(ambiente.id);
            }
          }}
        />
      </div>

      <Modal 
        isOpen={modalAbierto} 
        onClose={() => setModalAbierto(false)}
        titulo={ambienteEditando ? 'Editar Información de Ambiente' : 'Registrar Nuevo Ambiente'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <CampoTexto 
              label="Código de Ambiente" 
              placeholder="Ej: A-101"
              value={formulario.codigo}
              onChange={(e) => setFormulario({ ...formulario, codigo: e.target.value })}
              required
            />
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-500 dark:text-gray-400">Tipo de Espacio</label>
              <SelectorInstitucional 
                value={formulario.tipo} 
                onChange={(val: any) => setFormulario({ ...formulario, tipo: val })}
                opciones={[
                  { value: 'AULA', label: 'Aula de Clase' },
                  { value: 'LABORATORIO', label: 'Laboratorio Especializado' }
                ]}
                className="border-gray-200 dark:border-[#112240] bg-white dark:bg-[#050f20]"
              />
            </div>
            <CampoTexto 
              label="Capacidad (Aforo)" 
              type="number"
              value={formulario.capacidad}
              onChange={(e) => setFormulario({ ...formulario, capacidad: parseInt(e.target.value) })}
              required
            />
            <CampoTexto 
              label="Nivel / Piso" 
              placeholder="Ej: 1"
              value={formulario.piso}
              onChange={(e) => setFormulario({ ...formulario, piso: e.target.value })}
            />
          </div>
          <CampoTexto 
            label="Equipamiento / Observaciones" 
            placeholder="Ej: Proyector, Aire Acondicionado, 40 PCs..."
            value={formulario.equipamiento}
            onChange={(e) => setFormulario({ ...formulario, equipamiento: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-[#112240]">
            <Boton type="button" variant="outline" onClick={() => setModalAbierto(false)} className="rounded-xl px-6 bg-white dark:bg-[#050f20] border-gray-200 dark:border-[#112240] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#112240]">
              Cancelar
            </Boton>
            <Boton type="submit" cargando={crearMutation.isPending || actualizarMutation.isPending} className="rounded-xl px-8 bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] shadow-md shadow-[#003366]/10 dark:shadow-[#D4AF37]/10">
              {ambienteEditando ? 'Guardar Cambios' : 'Registrar Ambiente'}
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
