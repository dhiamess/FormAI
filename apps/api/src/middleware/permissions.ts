import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserRole } from '@formai/shared';

type Permission =
  | 'forms.create' | 'forms.read' | 'forms.update' | 'forms.delete' | 'forms.publish'
  | 'submissions.read' | 'submissions.export' | 'submissions.delete'
  | 'users.manage' | 'settings.manage';

/**
 * Middleware de vérification des permissions RBAC
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, error: 'Non authentifié' });
    }

    // Superadmin a tous les droits
    if (user.role === UserRole.SUPERADMIN) return next();

    // Vérifier les permissions des groupes de l'utilisateur
    const userPermissions = new Set<string>();
    const groups = user.groups as unknown as Array<{
      permissions: Record<string, Record<string, boolean>>;
    }>;

    for (const group of groups) {
      if (!group.permissions) continue;
      for (const [category, perms] of Object.entries(group.permissions)) {
        for (const [perm, value] of Object.entries(perms as Record<string, boolean>)) {
          if (value) userPermissions.add(`${category}.${perm}`);
        }
      }
    }

    const hasPermission = permissions.some((p) => userPermissions.has(p));
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Permission insuffisante',
      });
    }

    next();
  };
}
