'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { horariosService } from '@/services/horarios.service';
import { cargaNoLectivaService } from '@/services/carga-no-lectiva.service';
import { SpinnerCarga } from '@/components/ui/SpinnerCarga';

interface Props {
  idPeriodo: number;
  idDocente: number;
  exportOption?: 'completo' | 'carga-lectiva' | 'carga-no-lectiva';
}

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const HORAS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 7;
  return `${h.toString().padStart(2, '0')}:00`;
});

function formatearFranjaHora(horaInicio: string): string {
  const horaBase = parseInt(horaInicio.split(':')[0], 10);
  const horaFin = horaBase + 1;
  return `${horaBase}:00 - ${horaFin}:00`;
}

function getLabelSeccion(clave: string) {
  const labels: Record<string, string> = {
    PREPARACION_EVALUACION: 'Preparación y Evaluación',
    CONSEJERIA_TUTORIA: 'Consejería y Tutoría',
    INVESTIGACION: 'Investigación',
    CAPACITACION: 'Capacitación',
    ACTIVIDADES_GOBIERNO: 'Actividades de Gobierno',
    ACTIVIDADES_ADMINISTRACION: 'Administración',
    ASESORIA_TESIS: 'Asesoría de Tesis',
    RESPONSABILIDAD_SOCIAL: 'Responsabilidad Social',
    COMITES_COMISIONES: 'Comités y Comisiones',
  };
  return labels[clave] || clave;
}

export function CalendarioGeneralConNoLectivos({ idPeriodo, idDocente, exportOption = 'completo' }: Props) {
  const { data: horarios, isLoading: loadingHorarios } = useQuery({
    queryKey: ['horarios-general', idPeriodo, 'DOCENTE', idDocente],
    queryFn: async () => {
      const params: any = { idPeriodo, idDocente };
      return horariosService.listarHorarios(params).then((res) => res.data);
    },
    enabled: !!idPeriodo && !!idDocente,
  });

  const { data: noLectivosData, isLoading: loadingNoLectivos } = useQuery({
    queryKey: ['horario-no-lectivo-docente', idPeriodo, idDocente],
    queryFn: async () => {
      return cargaNoLectivaService.obtenerMiHorarioNoLectivo(idPeriodo).then((res) => res.data);
    },
    enabled: !!idPeriodo && !!idDocente,
  });

  const noLectivos = noLectivosData?.no_lectivos || [];

  const getCelda = (dia: string, hora: string) => {
    if (!horarios) return [];
    return horarios.filter((h: any) => h.dia_semana === dia && h.hora_inicio === hora);
  };

  const getNoLectivoEnCelda = (dia: string, hora: string) => {
    return noLectivos.find(
      (n: any) => n.dia_semana === dia && n.hora_inicio === hora
    );
  };

  if (loadingHorarios || loadingNoLectivos)
    return (
      <div className="p-10 flex justify-center">
        <SpinnerCarga />
      </div>
    );

  return (
    <div className="flex gap-4 p-2 sm:p-4 items-start bg-slate-50 dark:bg-transparent relative w-full">
      <div className="flex-1 overflow-x-auto bg-white dark:bg-[#0A192F] rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 custom-scrollbar">
        <table className="w-full min-w-[800px] border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#112240] border-b border-gray-200 dark:border-white/10">
              <th className="w-32 p-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center border-r border-gray-200 dark:border-white/10 uppercase tracking-wider">
                Hora
              </th>
              {DIAS.map((dia) => (
                <th
                  key={dia}
                  className="p-4 text-xs font-bold text-gray-700 dark:text-gray-300 text-center border-r border-gray-200 dark:border-white/10 uppercase tracking-wider"
                >
                  {dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HORAS.map((hora) => {
              return (
                <tr key={hora} className="group hover:bg-slate-50 dark:hover:bg-[#112240]/50 transition-colors">
                  <td className="p-2 text-[11px] font-black tracking-widest text-gray-600 dark:text-gray-400 text-center border-r border-b border-gray-100 dark:border-white/5 align-middle w-32 bg-slate-50/30 dark:bg-white/5">
                    {formatearFranjaHora(hora)}
                  </td>
                  {DIAS.map((dia) => {
                    const clasesEnCelda = getCelda(dia, hora);
                    const noLectivoEnCelda = getNoLectivoEnCelda(dia, hora);

                    return (
                      <td
                        key={`${dia}-${hora}`}
                        className="p-1.5 border-r border-b border-gray-100 dark:border-white/5 relative min-h-[80px] align-top transition-all duration-200 bg-white dark:bg-transparent hover:bg-unt-primary/5 dark:hover:bg-white/5"
                      >
                        <div className="grid gap-1 min-h-[60px] p-1">
                          {(exportOption === 'completo' || exportOption === 'carga-lectiva') && clasesEnCelda.map((clase: any, idx: number) => {
                            const cursoNombre =
                              clase.componente?.oferta?.curso?.nombre ||
                              clase.grupo?.componente?.oferta?.curso?.nombre ||
                              clase.curso?.nombre ||
                              'Curso';
                            const tipoComponente =
                              clase.componente?.tipo ||
                              clase.grupo?.componente?.tipo ||
                              '';
                            const grupoCodigo =
                              clase.grupo?.codigo ||
                              clase.grupo?.codigo_grupo ||
                              'G';

                            return (
                              <div
                                key={idx}
                                className="p-2.5 rounded-xl text-xs border shadow-sm transition-all flex flex-col justify-between min-h-[55px] bg-blue-50/80 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-500/30 dark:text-blue-300"
                              >
                                <div className="font-bold text-[10.5px] leading-tight text-slate-800 dark:text-blue-100 break-words" title={cursoNombre}>
                                  {cursoNombre}
                                </div>
                                <div className="text-[8.5px] font-bold tracking-wide text-slate-500 dark:text-blue-300/80 mt-1.5 leading-none">
                                  {tipoComponente} {tipoComponente && '•'} Gr. {grupoCodigo}
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/5 dark:border-white/10 text-[9px] font-bold">
                                  <span className="bg-white/60 dark:bg-white/10 px-1.5 py-0.5 rounded border border-black/5 dark:border-white/10 text-[8.5px] text-slate-700 dark:text-blue-200">
                                    Aula: {clase.ambiente?.codigo || 'Pendiente'}
                                  </span>
                                  <span className="uppercase text-[7.5px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-black/30 leading-normal text-slate-700 dark:text-blue-200 tracking-wider">
                                    {clase.estado}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          {(exportOption === 'completo' || exportOption === 'carga-no-lectiva') && noLectivoEnCelda && (
                            <div className="p-2.5 rounded-xl text-xs border shadow-sm transition-all flex flex-col justify-between min-h-[55px] bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-500/30">
                              <div className="font-black text-[9px] text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                No Lectivo
                              </div>
                              <div className="text-[10px] font-bold text-indigo-900 dark:text-indigo-200 leading-tight mt-1.5">
                                {getLabelSeccion(noLectivoEnCelda.seccion)}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
