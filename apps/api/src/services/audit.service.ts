import { AuditLog } from '../models/AuditLog';
import { logger } from '../utils/logger';

export class AuditService {
  /**
   * Enregistre une action dans le journal d'audit
   */
  async log(data: {
    organization: string;
    user: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details?: Record<string, unknown>;
    ip?: string;
  }) {
    try {
      await AuditLog.create({
        organization: data.organization,
        user: data.user,
        action: data.action,
        resource: { type: data.resourceType, id: data.resourceId },
        details: data.details || {},
        ip: data.ip,
      });
    } catch (error) {
      // Ne pas faire échouer l'opération principale à cause d'un log
      logger.error('Failed to create audit log', { error, data });
    }
  }

  /**
   * Liste les logs d'audit d'une organisation
   */
  async list(organizationId: string, options: {
    page?: number;
    limit?: number;
    action?: string;
  } = {}) {
    const { page = 1, limit = 50, action } = options;

    const filter: Record<string, unknown> = { organization: organizationId };
    if (action) filter.action = action;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'firstName lastName email'),
      AuditLog.countDocuments(filter),
    ]);

    return { logs, total };
  }
}

export const auditService = new AuditService();
