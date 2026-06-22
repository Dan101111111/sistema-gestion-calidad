'use strict';
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize, isAdmin, isAdminOrGestor } = require('../middleware/roles');
const rateLimit = require('../middleware/rateLimit');
const upload = require('../middleware/upload');
const { auditMiddleware } = require('../middleware/requestLogger');

const auth = require('../controllers/authController');
const usuarios = require('../controllers/usuariosController');
const docs = require('../controllers/documentosController');
const capas = require('../controllers/capasController');
const riesgos = require('../controllers/riesgosController');
const indicadores = require('../controllers/indicadoresController');
const main = require('../controllers/mainController');
const tiposDocumento = require('../controllers/tiposDocumentoController');
const { validar, authSchemas, usuarioSchemas, documentoSchemas,
        macroprocesoSchemas, procesoSchemas, capaSchemas, riesgoSchemas,
        indicadorSchemas, encuestaSchemas, auditoriaSchemas, acreditacionSchemas,
        tipoDocumentoSchemas } = require('../validators');

// ============================================================
// AUTH (público + rate limit estricto)
// ============================================================
router.post('/auth/login', rateLimit.auth, validar(authSchemas.login), auth.login);
router.post('/auth/refresh', rateLimit.auth, auth.refresh);
router.post('/auth/logout', authenticate, auth.logout);
router.post('/auth/recuperar', rateLimit.auth, validar(authSchemas.recuperar), auth.recuperarPassword);
router.post('/auth/reset-password', rateLimit.auth, validar(authSchemas.resetPassword), auth.resetPassword);
router.post('/auth/cambiar-password', authenticate, validar(authSchemas.cambiarPassword), auth.cambiarPassword);
router.get('/auth/me', authenticate, auth.me);
router.get('/auth/sesiones', authenticate, auth.sesionesActivas);
router.delete('/auth/sesiones/:id', authenticate, auth.revocarSesion);

// ============================================================
// USUARIOS (solo admin)
// ============================================================
router.get('/usuarios', authenticate, isAdminOrGestor, usuarios.listar);
router.get('/usuarios/perfil', authenticate, usuarios.miPerfil);
router.put('/usuarios/perfil', authenticate, usuarios.actualizarPerfil);
router.get('/usuarios/:id', authenticate, isAdmin, usuarios.obtener);
router.post('/usuarios', authenticate, isAdmin, auditMiddleware('usuarios','CREATE'), usuarios.crear);
router.put('/usuarios/:id', authenticate, isAdmin, auditMiddleware('usuarios','UPDATE'), usuarios.actualizar);
router.patch('/usuarios/:id/toggle-activo', authenticate, isAdmin, usuarios.toggleActivo);
router.patch('/usuarios/:id/rol', authenticate, isAdmin, usuarios.asignarRol);
router.post('/usuarios/:id/reset-password', authenticate, isAdmin, usuarios.resetPasswordAdmin);

// ============================================================
// DOCUMENTOS
// ============================================================
router.get('/documentos', authenticate, authorize('admin', 'gestor_calidad', 'auditor', 'docente'), docs.listar);
router.get('/documentos/:id', authenticate, authorize('admin', 'gestor_calidad', 'auditor', 'docente'), docs.obtener);
router.post('/documentos', authenticate, authorize('admin', 'gestor_calidad', 'docente'), validar(documentoSchemas.crear), auditMiddleware('documentos','CREATE'), docs.crear);
router.put('/documentos/:id', authenticate, authorize('admin', 'gestor_calidad', 'docente'), auditMiddleware('documentos','UPDATE'), docs.actualizar);
router.delete('/documentos/:id', authenticate, authorize('admin', 'gestor_calidad', 'docente'), auditMiddleware('documentos','DELETE'), docs.eliminar);
router.patch('/documentos/:id/estado', authenticate, authorize('admin', 'gestor_calidad', 'docente'), validar(documentoSchemas.cambiarEstado), docs.cambiarEstado);
router.get('/documentos/:id/versiones', authenticate, authorize('admin', 'gestor_calidad', 'auditor', 'docente'), docs.versiones);
router.get('/documentos/reporte/pdf', authenticate, isAdminOrGestor, docs.reportePDF);

// ============================================================
// PROCESOS
// ============================================================
router.get('/macroprocesos', authenticate, main.listarMacroprocesos);
router.post('/macroprocesos', authenticate, isAdminOrGestor, auditMiddleware('macroprocesos','CREATE'), main.crearMacroproceso);
router.put('/macroprocesos/:id', authenticate, isAdminOrGestor, auditMiddleware('macroprocesos','UPDATE'), main.actualizarMacroproceso);
router.delete('/macroprocesos/:id', authenticate, isAdminOrGestor, auditMiddleware('macroprocesos','DELETE'), main.eliminarMacroproceso);

router.get('/procesos', authenticate, main.listarProcesos);
router.get('/procesos/:id', authenticate, main.obtenerProceso);
router.post('/procesos', authenticate, isAdminOrGestor, auditMiddleware('procesos','CREATE'), main.crearProceso);
router.put('/procesos/:id', authenticate, isAdminOrGestor, auditMiddleware('procesos','UPDATE'), main.actualizarProceso);
router.delete('/procesos/:id', authenticate, isAdminOrGestor, auditMiddleware('procesos','DELETE'), main.eliminarProceso);

router.post('/procesos/:procesoId/actividades', authenticate, isAdminOrGestor, main.crearActividad);
router.put('/actividades/:id', authenticate, isAdminOrGestor, main.actualizarActividad);
router.delete('/actividades/:id', authenticate, isAdminOrGestor, main.eliminarActividad);
router.post('/procesos/:procesoId/actividades/reordenar', authenticate, isAdminOrGestor, main.reordenarActividades);
router.post('/procesos/:procesoId/flujo', authenticate, isAdminOrGestor, main.guardarFlujoProceso);

router.get('/procesos/reporte/pdf', authenticate, isAdminOrGestor, main.reportePDFProcesos);

// ============================================================
// ACREDITACIÓN
// ============================================================
router.get('/estandares', authenticate, main.listarEstandares);
router.post('/estandares', authenticate, isAdminOrGestor, main.crearEstandar);
router.post('/factores', authenticate, isAdminOrGestor, main.crearFactor);

router.get('/autoevaluaciones', authenticate, main.listarAutoevaluaciones);
router.post('/autoevaluaciones', authenticate, isAdminOrGestor, main.crearAutoevaluacion);
router.post('/evaluaciones-criterio', authenticate, isAdminOrGestor, main.evaluarCriterio);
router.get('/autoevaluaciones/comparativa', authenticate, main.comparativaAutoevaluaciones);
router.get('/autoevaluaciones/:id/reporte/pdf', authenticate, isAdminOrGestor, main.reportePDFAcreditacion);

// ============================================================
// AUDITORÍAS
// ============================================================
router.get('/planes-auditoria', authenticate, main.listarPlanes);
router.post('/planes-auditoria', authenticate, authorize('admin','gestor_calidad','auditor'), auditMiddleware('planes_auditoria','CREATE'), main.crearPlan);
router.put('/planes-auditoria/:id', authenticate, authorize('admin','gestor_calidad','auditor'), main.actualizarPlan);
router.delete('/planes-auditoria/:id', authenticate, authorize('admin','gestor_calidad','auditor'), auditMiddleware('planes_auditoria','DELETE'), main.eliminarPlan);
router.get('/planes-auditoria/:id/reporte/pdf', authenticate, main.reportePDFAuditoria);

router.get('/hallazgos', authenticate, main.listarHallazgos);
router.post('/hallazgos', authenticate, authorize('admin','gestor_calidad','auditor'), auditMiddleware('hallazgos','CREATE'), main.crearHallazgo);
router.put('/hallazgos/:id', authenticate, authorize('admin','gestor_calidad','auditor'), main.actualizarHallazgo);
router.delete('/hallazgos/:id', authenticate, authorize('admin','gestor_calidad','auditor'), auditMiddleware('hallazgos','DELETE'), main.eliminarHallazgo);

// ============================================================
// CAPA
// ============================================================
router.get('/capas', authenticate, capas.listar);
router.get('/capas/:id', authenticate, capas.obtener);
router.post('/capas', authenticate, isAdminOrGestor, validar(capaSchemas.crear), auditMiddleware('capas','CREATE'), capas.crear);
router.put('/capas/:id', authenticate, isAdminOrGestor, auditMiddleware('capas','UPDATE'), capas.actualizar);
router.delete('/capas/:id', authenticate, isAdminOrGestor, auditMiddleware('capas','DELETE'), capas.eliminar);
router.patch('/capas/:id/estado', authenticate, isAdminOrGestor, validar(capaSchemas.cambiarEstado), capas.cambiarEstado);
router.post('/capas/:id/seguimientos', authenticate, validar(capaSchemas.seguimiento), capas.agregarSeguimiento);
router.get('/capas/reporte/pdf', authenticate, isAdminOrGestor, capas.reportePDF);

// ============================================================
// RIESGOS
// ============================================================
router.get('/riesgos', authenticate, riesgos.listar);
router.get('/riesgos/matriz-calor', authenticate, riesgos.matrizCalor);
router.get('/riesgos/ranking', authenticate, riesgos.ranking);
router.get('/riesgos/:id', authenticate, riesgos.obtener);
router.post('/riesgos', authenticate, isAdminOrGestor, validar(riesgoSchemas.crear), auditMiddleware('riesgos','CREATE'), riesgos.crear);
router.put('/riesgos/:id', authenticate, isAdminOrGestor, auditMiddleware('riesgos','UPDATE'), riesgos.actualizar);
router.delete('/riesgos/:id', authenticate, isAdmin, auditMiddleware('riesgos','DELETE'), riesgos.eliminar);
router.post('/riesgos/:id/mitigaciones', authenticate, isAdminOrGestor, validar(riesgoSchemas.mitigacion), riesgos.agregarMitigacion);
router.get('/riesgos/reporte/pdf', authenticate, isAdminOrGestor, riesgos.reportePDF);

// ============================================================
// INDICADORES
// ============================================================
router.get('/indicadores', authenticate, indicadores.listar);
router.get('/indicadores/:id', authenticate, indicadores.obtener);
router.post('/indicadores', authenticate, isAdminOrGestor, validar(indicadorSchemas.crear), auditMiddleware('indicadores','CREATE'), indicadores.crear);
router.put('/indicadores/:id', authenticate, isAdminOrGestor, auditMiddleware('indicadores','UPDATE'), indicadores.actualizar);
router.post('/indicadores/:id/mediciones', authenticate, isAdminOrGestor, validar(indicadorSchemas.medicion), indicadores.registrarMedicion);
router.get('/indicadores/:id/tendencias', authenticate, indicadores.tendencias);
router.get('/indicadores/reporte/pdf', authenticate, isAdminOrGestor, indicadores.reportePDF);

// ============================================================
// ENCUESTAS
// ============================================================
router.get('/encuestas', authenticate, main.listarEncuestas);
router.get('/encuestas/:id', authenticate, main.obtenerEncuesta);
router.post('/encuestas', authenticate, isAdminOrGestor, validar(encuestaSchemas.crear), main.crearEncuesta);
router.put('/encuestas/:id', authenticate, isAdminOrGestor, validar(encuestaSchemas.actualizar), main.actualizarEncuesta);
router.delete('/encuestas/:id', authenticate, isAdminOrGestor, main.eliminarEncuesta);
router.patch('/encuestas/:id/publicar', authenticate, isAdminOrGestor, main.publicarEncuesta);
router.post('/encuestas/:id/responder', authenticate, main.responderEncuesta);
router.get('/encuestas/:id/resultados', authenticate, isAdminOrGestor, main.resultadosEncuesta);
router.get('/encuestas/:id/reporte/pdf', authenticate, isAdminOrGestor, main.reportePDFEncuesta);

// ============================================================
// NOTIFICACIONES
// ============================================================
router.get('/notificaciones', authenticate, main.listarNotificaciones);
router.get('/notificaciones/no-leidas', authenticate, main.conteoNoLeidas);
router.patch('/notificaciones/:id/leida', authenticate, main.marcarLeida);
router.patch('/notificaciones/marcar-todas', authenticate, main.marcarTodasLeidas);

// ============================================================
// ARCHIVOS
// ============================================================
router.post('/archivos', authenticate, rateLimit.upload, upload.single('archivo'), main.subirArchivo);
router.get('/archivos/:id/url', authenticate, main.obtenerUrlArchivo);
router.delete('/archivos/:id', authenticate, main.eliminarArchivo);

// ============================================================
// BÚSQUEDA GLOBAL
// ============================================================
router.get('/buscar', authenticate, main.busquedaGlobal);

// ============================================================
// AUDITORÍA LOG (admin / gestor)
// ============================================================
router.get('/auditoria', authenticate, isAdminOrGestor, main.logGeneral);
router.get('/auditoria/:tabla/:id', authenticate, isAdminOrGestor, main.historialRegistro);

// ============================================================
// DASHBOARD
// ============================================================
router.get('/dashboard/kpis', authenticate, main.dashboardKpis);
router.get('/dashboard/graficos', authenticate, main.dashboardGraficos);

// ============================================================
// CONFIGURACIÓN (solo admin)
// ============================================================
router.get('/configuracion', authenticate, isAdmin, main.obtenerConfiguracion);
router.put('/configuracion', authenticate, isAdmin, main.actualizarConfiguracion);

// ============================================================
// TIPOS DE DOCUMENTO (solo admin para escrituras)
// ============================================================
router.get('/tipos-documento', authenticate, tiposDocumento.listar);
router.post('/tipos-documento', authenticate, isAdmin, validar(tipoDocumentoSchemas.crear), auditMiddleware('tipos_documento', 'CREATE'), tiposDocumento.crear);
router.put('/tipos-documento/:id', authenticate, isAdmin, validar(tipoDocumentoSchemas.actualizar), auditMiddleware('tipos_documento', 'UPDATE'), tiposDocumento.actualizar);
router.delete('/tipos-documento/:id', authenticate, isAdmin, auditMiddleware('tipos_documento', 'DELETE'), tiposDocumento.eliminar);

module.exports = router;
