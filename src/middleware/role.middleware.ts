import { Request, Response, NextFunction } from 'express';

export type UserRole = 'ADMIN' | 'CLIENT' | 'USER' | 'BARBERSHOP';

/**
 * Middleware para verificar que el usuario tenga uno de los roles permitidos
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: No user found',
      });
      return;
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access denied. Required roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware específico para verificar acceso al backoffice
 * Solo ADMIN y CLIENT pueden acceder
 */
export const requireBackofficeAccess = requireRole('ADMIN', 'CLIENT');

