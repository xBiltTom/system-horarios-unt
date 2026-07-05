import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { ReportesService } from './reportes.service';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  /**
   * Send schedule report (PDF + Excel) to a single teacher.
   */
  static async enviarReporteDocente(
    idDocente: number,
    idPeriodo: number
  ): Promise<void> {
    // Get teacher + period info
    const docente = await prisma.docente.findUnique({
      where: { id: idDocente },
      include: { usuario: true },
    });
    if (!docente) throw new Error(`Docente ${idDocente} no encontrado`);

    const periodo = await prisma.periodo_academico.findUnique({
      where: { id: idPeriodo },
      select: { nombre: true },
    });

    // Resolve destination email
    const destinatario =
      docente.usuario?.email ?? docente.email;

    if (!destinatario) {
      throw new Error(`No hay email disponible para el docente ${idDocente}`);
    }

    // Generate attachments in parallel
    const [pdfBuffer, excelBuffer] = await Promise.all([
      ReportesService.generarPDFDocente(idDocente, idPeriodo),
      ReportesService.generarExcelDocente(idDocente, idPeriodo),
    ]);

    const periodoNombre = periodo?.nombre ?? String(idPeriodo);
    const nombreCompleto = `${docente.nombres} ${docente.apellidos}`;

    await EmailService.transporter.sendMail({
      from: process.env.SMTP_USER,
      to: destinatario,
      subject: `Tu horario asignado - Período ${periodoNombre}`,
      html: `
        <h2>Horario Asignado - ${periodoNombre}</h2>
        <p>Estimado/a <strong>${nombreCompleto}</strong>,</p>
        <p>Adjunto encontrará su horario asignado para el período <strong>${periodoNombre}</strong> en formatos PDF y Excel.</p>
        <p>Si tiene alguna consulta, por favor comuníquese con la secretaría de la Escuela de Ingeniería de Sistemas.</p>
        <br/>
        <p>Atentamente,<br/>Escuela de Ingeniería de Sistemas<br/>Universidad Nacional de Trujillo</p>
      `,
      attachments: [
        {
          filename: `horario-${docente.apellidos}-${periodoNombre}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
        {
          filename: `horario-${docente.apellidos}-${periodoNombre}.xlsx`,
          content: excelBuffer,
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    });
  }

  /**
   * Send schedule reports to all teachers who have at least one bloque in the period.
   */
  static async enviarReportesTodosDocentes(
    idPeriodo: number
  ): Promise<{ enviados: number; errores: number }> {
    const docentes = await prisma.docente.findMany({
      where: {
        activo: true,
        bloques: { some: { id_periodo: idPeriodo } },
      },
      select: { id: true },
    });

    let enviados = 0;
    let errores = 0;

    for (const d of docentes) {
      try {
        await EmailService.enviarReporteDocente(d.id, idPeriodo);
        enviados++;
      } catch (err) {
        console.error(`Error enviando correo al docente ${d.id}:`, err);
        errores++;
      }
    }

    return { enviados, errores };
  }
}
