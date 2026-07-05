export type TipoComponenteHorario = 'TEORIA' | 'PRACTICA' | 'LABORATORIO';

export interface BloqueHorarioReporteCiclo {
  id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  id_docente: number;
  docente: {
    nombres: string;
    apellidos: string;
  };
  ambiente: {
    codigo: string | null;
  } | null;
  grupo: {
    id: number;
    codigo: string;
  };
  componente: {
    id: number;
    tipo: TipoComponenteHorario;
    oferta: {
      id_curso: number;
      id_ciclo: number;
      curso: {
        nombre: string;
        codigo: string;
      };
    };
  };
}

export interface RegistroHorarioCiclo {
  indice: number;
  color: string;
  cursoId: number;
  cursoNombre: string;
  docenteNombre: string;
  grupoCodigo: string;
  grupoId: number;
  teoria: number;
  practica: number;
  laboratorio: number;
  totalHoras: number;
  departamento: string;
  tieneMultiplesGrupos: boolean;
}

export interface EntradaCeldaHorarioCiclo {
  registro: RegistroHorarioCiclo;
  bloque: BloqueHorarioReporteCiclo;
}

export interface ContextoHorarioCiclo {
  registros: RegistroHorarioCiclo[];
  celdas: Record<string, EntradaCeldaHorarioCiclo[]>;
}