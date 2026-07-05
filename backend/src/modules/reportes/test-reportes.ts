import { ReportesService } from './reportes.service';
import fs from 'fs';
import path from 'path';

async function ejecutarPruebas() {
  console.log('=== INICIO DE PRUEBAS DE REPORTES ===');
  
  const idDocente = 1;
  const idPeriodo = 1;
  const outputDir = path.join(__dirname, '../../../reportes_test');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // 1. Probar PDF Docente
    console.log('Generando PDF Docente 1...');
    const pdfDocente = await ReportesService.generarPDFDocente(idDocente, idPeriodo);
    console.log(`PDF Docente 1 generado con éxito. Tamaño: ${pdfDocente.length} bytes`);
    fs.writeFileSync(path.join(outputDir, 'horario-docente-1.pdf'), pdfDocente);
    
    // 2. Probar Excel Docente
    console.log('Generando Excel Docente 1...');
    const excelDocente = await ReportesService.generarExcelDocente(idDocente, idPeriodo);
    console.log(`Excel Docente 1 generado con éxito. Tamaño: ${excelDocente.length} bytes`);
    fs.writeFileSync(path.join(outputDir, 'horario-docente-1.xlsx'), excelDocente);

    // 3. Probar PDF Global
    console.log('Generando PDF Global...');
    const pdfGlobal = await ReportesService.generarPDFGlobal(idPeriodo);
    console.log(`PDF Global generado con éxito. Tamaño: ${pdfGlobal.length} bytes`);
    fs.writeFileSync(path.join(outputDir, 'horario-global.pdf'), pdfGlobal);

    // 4. Probar Excel Global
    console.log('Generando Excel Global...');
    const excelGlobal = await ReportesService.generarExcelGlobal(idPeriodo);
    console.log(`Excel Global generado con éxito. Tamaño: ${excelGlobal.length} bytes`);
    fs.writeFileSync(path.join(outputDir, 'horario-global.xlsx'), excelGlobal);

    console.log('=== PRUEBAS COMPLETADAS CON ÉXITO ===');
    console.log(`Los archivos generados se guardaron en: ${outputDir}`);
  } catch (error) {
    console.error('❌ ERROR DURANTE LAS PRUEBAS DE REPORTES:', error);
    process.exit(1);
  }
}

ejecutarPruebas();
