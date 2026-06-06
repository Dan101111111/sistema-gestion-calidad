'use strict';

/**
 * Middleware de autorización por roles
 * @param {...string} roles - Roles permitidos
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'No autenticado' },
      });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Acceso denegado. Se requiere uno de: ${roles.join(', ')}`,
        },
      });
    }
    next();
  };
}

/**
 * Verifica que el usuario es admin
 */
const isAdmin = authorize('admin');

/**
 * Verifica que el usuario es admin o gestor_calidad
 */
const isAdminOrGestor = authorize('admin', 'gestor_calidad');

/**
 * Verifica que el usuario puede gestionar (admin, gestor, auditor)
 */
const canManage = authorize('admin', 'gestor_calidad', 'auditor');

module.exports = { authorize, isAdmin, isAdminOrGestor, canManage };
