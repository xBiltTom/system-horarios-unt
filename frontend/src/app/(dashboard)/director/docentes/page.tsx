'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { docentesService } from '@/services/docentes.service';
import { Card, CardContent } from '@/components/ui/Card';
import { Boton } from '@/components/ui/Boton';
import { CampoTexto } from '@/components/ui/CampoTexto';
import { SelectorInstitucional } from '@/components/ui/SelectorInstitucional';
import { Modal } from '@/components/ui/Modal';
import { NotificacionToast } from '@/components/ui/NotificacionToast';
import { TablaDatos } from '@/components/ui/TablaDatos';
import { UserPlus, Search, Mail, Phone, Briefcase, GraduationCap, Calendar, Edit2, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utilidades';

export default function GestionDocentesPage() {
  const queryClient = useQueryClient();
  const [buscar, setBuscar] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<any>(null);
  const [toast, setToast] = useState<{ mensaje: string; tipo: 'exito' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    codigo_ibm: '',
    dni: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    empleo: '',
    modalidad: 'NOMBRADO',
    categoria: 'PRINCIPAL',
    dedicacion: 'TIEMPO_COMPLETO_40H',
    antiguedad: 0,
    horas_max_semana: 40,
    crear_usuario: true
  });

  const resetForm = () => {
    setFormData({
      codigo_ibm: '',
      dni: '',
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      empleo: '',
      modalidad: 'NOMBRADO',
      categoria: 'PRINCIPAL',
      dedicacion: 'TIEMPO_COMPLETO_40H',
      antiguedad: 0,
      horas_max_semana: 40,
      crear_usuario: true
    });

    setDocenteSeleccionado(null);
  };

  const { data: response, isLoading } = useQuery({
    queryKey: ['docentes', buscar],
    queryFn: () => docentesService.listar({ buscar }).then(res => res.data)
  });

  const docentes = Array.isArray(response) ? response : response?.data || [];

  const mutationCrear = useMutation({
    mutationFn: (datos: any) => docentesService.crear(datos),
    onSuccess: (response: any) => {
      const password = response.data?.passwordTemporal;

      setToast({
        mensaje: password
          ? `Docente creado. Contraseña temporal: ${password}`
          : 'Docente creado correctamente',
        tipo: 'exito'
      });

      setModalAbierto(false);
      resetForm();

      queryClient.invalidateQueries({
        queryKey: ['docentes']
      });
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al crear docente', tipo: 'error' });
    }
  });

  const mutationEditar = useMutation({
    mutationFn: (datos: any) => docentesService.actualizar(docenteSeleccionado.id, datos),
    onSuccess: () => {
      setToast({ mensaje: 'Docente actualizado correctamente', tipo: 'exito' });
      setModalAbierto(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['docentes'] });
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al actualizar docente', tipo: 'error' });
    }
  });

  const mutationEliminar = useMutation({
    mutationFn: (id: number) => docentesService.eliminar(id),
    onSuccess: () => {
      setToast({ mensaje: 'Docente desactivado correctamente', tipo: 'exito' });
      queryClient.invalidateQueries({ queryKey: ['docentes'] });
    },
    onError: (error: any) => {
      setToast({ mensaje: error.response?.data?.error || 'Error al desactivar docente', tipo: 'error' });
    }
  });

  const abrirEditar = (docente: any) => {
    setDocenteSeleccionado(docente);

    setFormData({
      codigo_ibm: docente.codigo_ibm || '',
      dni: docente.dni || '',
      nombres: docente.nombres || '',
      apellidos: docente.apellidos || '',
      email: docente.email || '',
      telefono: docente.telefono || '',
      empleo: docente.empleo || '',
      modalidad: docente.modalidad || 'NOMBRADO',
      categoria: docente.categoria || 'PRINCIPAL',
      dedicacion: docente.dedicacion || 'TIEMPO_COMPLETO_40H',
      antiguedad: docente.antiguedad || 0,
      horas_max_semana: docente.horas_max_semana || 40,
      crear_usuario: false
    });

    setModalAbierto(true);
  };

  const manejarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (docenteSeleccionado) {
      mutationEditar.mutate(formData);
    } else {
      mutationCrear.mutate(formData);
    }
  };

  const columnas = [
    { 
      clave: 'nombre_completo', 
      titulo: 'Docente',
      render: (item: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 dark:text-white">{item.apellidos}, {item.nombres}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
            <Mail className="w-3 h-3" /> {item.email}
          </span>
        </div>
      )
    },
    { 
      clave: 'modalidad', 
      titulo: 'Modalidad',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <Briefcase className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.modalidad}</span>
        </div>
      )
    },
    { 
      clave: 'categoria', 
      titulo: 'Categoría',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <span className="px-2.5 py-1 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold uppercase tracking-tight border border-gray-200 dark:border-white/10">
            {item.categoria}
          </span>
        </div>
      )
    },
    { 
      clave: 'horas_max_semana', 
      titulo: 'Carga Máx.',
      render: (item: any) => (
        <span className="font-mono font-bold text-[#003366] dark:text-[#D4AF37] bg-[#003366]/5 dark:bg-[#D4AF37]/10 px-2 py-1 rounded text-xs border border-[#003366]/10 dark:border-[#D4AF37]/20">
          {item.horas_max_semana}H / SEM
        </span>
      )
    },
    {
      clave: 'activo',
      titulo: 'Estado',
      render: (item: any) => (
        <span className={cn(
          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border",
          item.activo 
            ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50" 
            : "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50"
        )}>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full mr-1.5",
            item.activo ? "bg-green-500" : "bg-red-500"
          )} />
          {item.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-[1800px] mx-auto pb-20 animate-in fade-in duration-500">
      {/* Header Institucional */}
      <div className="relative overflow-hidden rounded-[3rem] bg-[#0A192F] px-10 py-12 text-white shadow-2xl border border-[#112240]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute left-1/4 bottom-0 h-48 w-48 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D4AF37]/10 backdrop-blur-md rounded-full border border-[#D4AF37]/30 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              <Users className="w-4 h-4" />
              Gestión de Personal
            </div>
            <h1 className="text-4xl font-serif font-extrabold tracking-wide text-white">Gestión de Docentes</h1>
            <p className="text-lg text-gray-400 font-light max-w-2xl">
              Registro de plana docente y configuración de límites de carga lectiva por periodo académico.
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Acciones y Búsqueda */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="relative flex-1 w-full lg:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar docente por nombre, apellido o correo..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#0A192F] border border-gray-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] dark:focus:ring-[#D4AF37] text-gray-900 dark:text-white placeholder:text-gray-400 transition-all shadow-sm"
          />
        </div>
        <Boton 
          onClick={() => { resetForm(); setModalAbierto(true); }} 
          className="rounded-2xl px-8 py-4 shadow-lg shadow-[#003366]/20 dark:shadow-[#D4AF37]/10 bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] font-bold transition-all"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Nuevo Docente
        </Boton>
      </div>

      <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-none bg-white dark:bg-[#0A192F] rounded-[2.5rem] overflow-hidden border dark:border-white/5">
        <CardContent className="p-0">
          <TablaDatos
            columnas={columnas}
            datos={docentes}
            loading={isLoading}
            alEditar={abrirEditar}
            alEliminar={(docente) => {
              if (confirm(`¿Está seguro de desactivar al docente "${docente.nombres} ${docente.apellidos}"?`)) {
                mutationEliminar.mutate(docente.id);
              }
            }}
          />
        </CardContent>
      </Card>

      {modalAbierto && (
        <Modal 
          isOpen={true} 
          cerrar={() => setModalAbierto(false)}
          titulo={docenteSeleccionado ? 'Editar Docente' : 'Registrar Nuevo Docente'}
        >
          <form onSubmit={manejarSubmit} className="space-y-6">

            {/* DATOS PERSONALES */}
            <div className="grid grid-cols-2 gap-4">

              <CampoTexto
                label="Código IBM"
                value={formData.codigo_ibm}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    codigo_ibm: e.target.value
                  })
                }
              />

              <CampoTexto
                label="DNI"
                value={formData.dni}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dni: e.target.value
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">

              <CampoTexto
                label="Nombres"
                required
                value={formData.nombres}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nombres: e.target.value
                  })
                }
              />

              <CampoTexto
                label="Apellidos"
                required
                value={formData.apellidos}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    apellidos: e.target.value
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">

              <CampoTexto
                label="Email Institucional"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value
                  })
                }
              />

              <CampoTexto
                label="Teléfono"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    telefono: e.target.value
                  })
                }
              />
            </div>

            <CampoTexto
              label="Empleo / Cargo"
              value={formData.empleo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  empleo: e.target.value
                })
              }
            />

            {/* CONFIGURACIÓN DOCENTE */}
            <div className="grid grid-cols-2 gap-4">

              <SelectorInstitucional
                label="Modalidad"
                value={formData.modalidad}
                onChange={(val: any) =>
                  setFormData({
                    ...formData,
                    modalidad: val
                  })
                }
                opciones={[
                  { value: 'NOMBRADO', label: 'Nombrado' },
                  { value: 'CONTRATADO', label: 'Contratado' },
                ]}
              />

              <SelectorInstitucional
                label="Categoría"
                value={formData.categoria}
                onChange={(val: any) =>
                  setFormData({
                    ...formData,
                    categoria: val
                  })
                }
                opciones={[
                  { value: 'PRINCIPAL', label: 'Principal' },
                  { value: 'ASOCIADO', label: 'Asociado' },
                  { value: 'AUXILIAR', label: 'Auxiliar' },
                  { value: 'JEFE_PRACTICA', label: 'Jefe de Práctica' },
                ]}
              />
            </div>

            <SelectorInstitucional
              label="Dedicación"
              value={formData.dedicacion}
              onChange={(val: any) =>
                setFormData({
                  ...formData,
                  dedicacion: val
                })
              }
              opciones={[
                { value: 'TIEMPO_COMPLETO_40H', label: 'Tiempo Completo 40H' },
                { value: 'DEDICACION_EXCLUSIVA_40H', label: 'Dedicación Exclusiva 40H' },
                { value: 'TIEMPO_PARCIAL_20H', label: 'Tiempo Parcial 20H' },
                { value: 'TIEMPO_PARCIAL_16H', label: 'Tiempo Parcial 16H' },
                { value: 'TIEMPO_PARCIAL_12H', label: 'Tiempo Parcial 12H' },
                { value: 'TIEMPO_PARCIAL_10H', label: 'Tiempo Parcial 10H' },
                { value: 'TIEMPO_PARCIAL_8H', label: 'Tiempo Parcial 8H' }
              ]}
            />

            {/* HORAS */}
            <div className="grid grid-cols-2 gap-4">

              <CampoTexto
                label="Límite Horas/Semana"
                type="number"
                value={formData.horas_max_semana}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    horas_max_semana: Number(e.target.value)
                  })
                }
              />

              <CampoTexto
                label="Antigüedad (Años)"
                type="number"
                value={formData.antiguedad}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    antiguedad: Number(e.target.value)
                  })
                }
              />
            </div>

            {/* USUARIO */}
            {!docenteSeleccionado && (
              <div className="flex items-center gap-3 py-3 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  id="crear_usuario"
                  checked={formData.crear_usuario}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      crear_usuario: e.target.checked
                    })
                  }
                  className="w-5 h-5 text-[#003366] dark:text-[#D4AF37] bg-white dark:bg-[#020C1B] border-gray-300 dark:border-white/20 rounded focus:ring-[#003366] dark:focus:ring-[#D4AF37] focus:ring-offset-0 transition-all cursor-pointer"
                />

                <label
                  htmlFor="crear_usuario"
                  className="flex flex-col cursor-pointer"
                >
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Crear cuenta de acceso automáticamente</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Se generará una contraseña temporal para este docente
                  </span>
                </label>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/10">

              <Boton
                variante="secundario"
                type="button"
                onClick={() => setModalAbierto(false)}
                className="rounded-xl px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white border-transparent"
              >
                Cancelar
              </Boton>

              <Boton
                type="submit"
                disabled={mutationCrear.isPending || mutationEditar.isPending}
                className="rounded-xl px-8 bg-[#003366] hover:bg-[#002244] text-white dark:bg-[#D4AF37] dark:hover:bg-[#B8962E] dark:text-[#0A192F] font-bold border-transparent"
              >
                {mutationCrear.isPending || mutationEditar.isPending
                  ? 'Guardando...'
                  : docenteSeleccionado
                    ? 'Actualizar Docente'
                    : 'Guardar Docente'}
              </Boton>

            </div>
          </form>
        </Modal>
      )}

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
