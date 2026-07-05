import { Worker } from 'bullmq';
import { redis } from '@/lib/redis';
import { GeneradorPdfService } from '@/modules/reportes/generador-pdf.service';
import fs from 'fs';
import path from 'path';

const CARPETA_REPORTES = path.join(process.cwd(), 'reportes');

const worker = new Worker(
  'reportes',
  async (job) => {
    const { tipo, parametros } = job.data;
    console.log(`Generando reporte ${tipo} (job ${job.id})`);

    // Actualizar progreso
    await job.updateProgress(10);

    let pdfBuffer: Buffer;
    if (tipo === 'docente') {
      pdfBuffer = await GeneradorPdfService.generarHorarioDocentePdf(parametros.idPeriodo, parametros.idDocente);
    } else if (tipo === 'aula' || tipo === 'laboratorio') {
      pdfBuffer = await GeneradorPdfService.generarHorarioAmbientePdf(parametros.idPeriodo, parametros.idAula);
    } else if (tipo === 'gestion') {
      pdfBuffer = await GeneradorPdfService.generarGlobalPdf(parametros.idPeriodo);
    } else {
      throw new Error(`Tipo de reporte no soportado: ${tipo}`);
    }

    await job.updateProgress(90);

    // Guardar en disco
    const filePath = path.join(CARPETA_REPORTES, `${job.id}.pdf`);
    fs.writeFileSync(filePath, pdfBuffer);

    await job.updateProgress(100);
    return { filePath };
  },
  { connection: redis }
);

export default worker;