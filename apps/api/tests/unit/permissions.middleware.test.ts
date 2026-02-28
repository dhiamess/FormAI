import { Response } from 'express';
import { requirePermission } from '../../src/middleware/permissions';
import { UserRole } from '@formai/shared';
import { AuthRequest } from '../../src/middleware/auth';

describe('Permissions Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should return 401 if no user is attached', () => {
    const middleware = requirePermission('forms.create');
    middleware(mockReq as any, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('should allow superadmin regardless of permissions', () => {
    mockReq.user = { role: UserRole.SUPERADMIN, groups: [] } as any;

    const middleware = requirePermission('forms.create');
    middleware(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should allow user with correct group permission', () => {
    mockReq.user = {
      role: UserRole.USER,
      groups: [{
        permissions: {
          forms: { create: true, read: true, update: false, delete: false, publish: false },
          submissions: { read: false, export: false, delete: false },
          users: { manage: false },
          settings: { manage: false },
        },
      }],
    } as any;

    const middleware = requirePermission('forms.create');
    middleware(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should deny user without correct permission', () => {
    mockReq.user = {
      role: UserRole.USER,
      groups: [{
        permissions: {
          forms: { create: false, read: true, update: false, delete: false, publish: false },
          submissions: { read: false, export: false, delete: false },
          users: { manage: false },
          settings: { manage: false },
        },
      }],
    } as any;

    const middleware = requirePermission('forms.create');
    middleware(mockReq as any, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
  });
});
