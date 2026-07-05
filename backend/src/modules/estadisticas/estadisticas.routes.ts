import { Router, type Router as ExpressRouter } from 'express';
import { EstadisticasController } from './estadisticas.controller';
import { middlewareAutenticacion } from '@/middleware/autenticacion';

const router: ExpressRouter = Router();
router.use(middlewareAutenticacion);

router.get('/resumen', EstadisticasController.resumen);
router.get('/avance-categoria', EstadisticasController.avanceCategoria);
router.get('/ocupacion-ambientes', EstadisticasController.ocupacionAmbientes);
router.get('/mapa-calor', EstadisticasController.mapaCalor);
router.get('/carga-docente', EstadisticasController.cargaDocente);
router.get('/avance-cursos', EstadisticasController.avanceCursos);
router.get('/kpis-secretaria', EstadisticasController.kpisSecretaria);
router.get('/docente-resumen', EstadisticasController.resumenDocente);

export default router;