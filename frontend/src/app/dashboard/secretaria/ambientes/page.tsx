'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { periodosService } from '@/services/periodos.service';
import { ambientesService } from '@/services/ambientes.service';
import { Selector } from '@/components/ui/Selector';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';
import { School, Search, Filter, LayoutGrid, List, Info, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utilidades';

export default function AmbientesSecretariaPage() {
  const [idPeriodo, setIdPeriodo] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroCapacidad, setFiltroCapacidad] = useState<string>('TODOS');
  const [busqueda, setBuscar] = useState('');
  const [vista, setVista] = useState<'grid' | 'tabla'>('grid');

  const { data: periodos, isLoading: periodosLoading } = useQuery({
    queryKey: ['periodos-secretaria-ambientes'],
    queryFn: () => periodosService.listar().then((res) => res.data),
  });

  const { data: periodoActivo } = useQuery({
    queryKey: ['periodo-activo-secretaria-ambientes'],
    queryFn: () => periodosService.activo().then((res) => res.data),
  });

  useEffect(() => {
    if (!idPeriodo && periodoActivo?.id) {
      setIdPeriodo(periodoActivo.id);
    }
    if (!idPeriodo && !periodoActivo?.id && (periodos || []).length > 0) {
      setIdPeriodo(periodos[0].id);
    }
  }, [idPeriodo, periodoActivo, periodos]);

  const { data: ambientes, isLoading: ambientesLoading } = useQuery({
    queryKey: ['ambientes-disponibilidad', idPeriodo],
    queryFn: () => ambientesService.disponibilidadGeneral(idPeriodo as number).then((res) => res.data),
    enabled: !!idPeriodo,
  });

  const ambientesFiltrados = useMemo(() => {
    return (ambientes || []).filter((amb: any) => {
      const coincideTipo = filtroTipo === 'TODOS' || amb.tipo === filtroTipo;
      
      let coincideCapacidad = true;
      if (filtroCapacidad === 'PEQUENO') coincideCapacidad = amb.capacidad <= 20;
      else if (filtroCapacidad === 'MEDIANO') coincideCapacidad = amb.capacidad > 20 && amb.capacidad <= 40;
      else if (filtroCapacidad === 'GRANDE') coincideCapacidad = amb.capacidad > 40;

      const coincideBusqueda = amb.codigo.toLowerCase().includes(busqueda.toLowerCase());
      return coincideTipo && coincideCapacidad && coincideBusqueda;
    });
  }, [ambientes, filtroTipo, filtroCapacidad, busqueda]);

  if (periodosLoading) return <SpinnerCarga />;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Header Estilo Classroom */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] px-10 py-12 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-white/90">
              <School className="w-3.5 h-3.5" />
              Gestión de Espacios
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Ambientes Disponibles</h1>
            <p className="text-lg text-white/70 max-w-2xl">
              Supervisa la ocupación y capacidad de las aulas y laboratorios de la Escuela en tiempo real.
            </p>
          </div>
          
          <div className="w-full lg:w-80 bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/20 shadow-inner">
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3 ml-1">Periodo de Consulta</p>
            <Selector
              label=""
              opciones={[
                { valor: '', etiqueta: 'Seleccionar periodo' },
                ...(periodos || []).map((p: any) => ({ valor: String(p.id), etiqueta: p.nombre })),
              ]}
              value={idPeriodo?.toString() || ''}
              onChange={(e) => setIdPeriodo(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="bg-white/20 border-white/10 text-white font-bold rounded-2xl h-[52px]"
            />
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200/60 p-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="relative flex-1 w-full group h-[52px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por código de ambiente..."
              value={busqueda}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full h-full pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-600 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl h-[52px]">
            <button
              onClick={() => setVista('grid')}
              className={cn("p-3 rounded-xl transition-all", vista === 'grid' ? "bg-white text-indigo-600 shadow-md" : "text-slate-400 hover:text-slate-600")}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setVista('tabla')}
              className={cn("p-3 rounded-xl transition-all", vista === 'tabla' ? "bg-white text-indigo-600 shadow-md" : "text-slate-400 hover:text-slate-600")}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Ambiente</label>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              {['TODOS', 'AULA', 'LABORATORIO'].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    filtroTipo === tipo ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {tipo === 'TODOS' ? 'Todos' : tipo === 'AULA' ? 'Aulas' : 'Labs'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacidad (Est.)</label>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              {[
                { id: 'TODOS', label: 'Cualquiera' },
                { id: 'PEQUENO', label: '≤ 20' },
                { id: 'MEDIANO', label: '21 - 40' },
                { id: 'GRANDE', label: '> 40' }
              ].map((cap) => (
                <button
                  key={cap.id}
                  onClick={() => setFiltroCapacidad(cap.id)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    filtroCapacidad === cap.id ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {cap.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
              <div className="flex-1 py-2.5 px-4 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-500 shadow-sm border border-slate-100 flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operativos
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {ambientesLoading ? (
        <SpinnerCarga />
      ) : vista === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {ambientesFiltrados.map((amb: any) => (
            <div key={amb.id} className="group bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
              <div className={cn(
                "absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 transition-transform group-hover:scale-150 duration-700",
                amb.tipo === 'AULA' ? "bg-emerald-500" : "bg-amber-500"
              )} />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "p-4 rounded-2xl shadow-sm",
                    amb.tipo === 'AULA' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  )}>
                    <School className="w-7 h-7" />
                  </div>
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    amb.tipo === 'AULA' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-600"
                  )}>
                    {amb.tipo}
                  </span>
                </div>

                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">{amb.codigo}</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Escuela de Ing. Sistemas</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-tighter">Capacidad</span>
                    </div>
                    <p className="text-lg font-black text-slate-700">{amb.capacidad} <span className="text-xs font-medium text-slate-400">Est.</span></p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-tighter">Ocupación</span>
                    </div>
                    <p className="text-lg font-black text-slate-700">{amb.bloques?.length || 0} <span className="text-xs font-medium text-slate-400">Hrs.</span></p>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Info className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Detalles de disponibilidad</span>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all">
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200/60 overflow-hidden animate-in fade-in duration-500">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Capacidad</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Horas Asignadas</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ambientesFiltrados.map((amb: any) => (
                <tr key={amb.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        amb.tipo === 'AULA' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        <School className="w-5 h-5" />
                      </div>
                      <span className="text-base font-black text-slate-700">{amb.codigo}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      amb.tipo === 'AULA' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-600"
                    )}>
                      {amb.tipo}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center font-bold text-slate-600">{amb.capacidad}</td>
                  <td className="px-8 py-5 text-center font-bold text-slate-600">{amb.bloques?.length || 0}h</td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      <Info className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
