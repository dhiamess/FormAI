import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Mock dependencies before importing the module
jest.mock('../../src/config/env', () => ({
  env: {
    JWT_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
  },
}));

jest.mock('../../src/models/User', () => ({
  User: {
    findById: jest.fn(),
  },
}));

import { authenticate } from '../../src/middleware/auth';
import { User } from '../../src/models/User';
import { env } from '../../src/config/env';

const mockFindById = User.findById as jest.Mock;

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if no token is provided', async () => {
    await authenticate(mockReq as any, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Token manquant' }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 for an invalid token', async () => {
    mockReq.headers = { authorization: 'Bearer invalid-token' };

    await authenticate(mockReq as any, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Token invalide' }),
    );
  });

  it('should return 401 if user not found', async () => {
    const token = jwt.sign({ userId: 'user123' }, env.JWT_SECRET);
    mockReq.headers = { authorization: `Bearer ${token}` };
    mockFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

    await authenticate(mockReq as any, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 if user is inactive', async () => {
    const token = jwt.sign({ userId: 'user123' }, env.JWT_SECRET);
    mockReq.headers = { authorization: `Bearer ${token}` };
    mockFindById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ isActive: false }),
    });

    await authenticate(mockReq as any, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('should call next() and attach user for valid token', async () => {
    const mockUser = { _id: 'user123', isActive: true, role: 'admin' };
    const token = jwt.sign({ userId: 'user123' }, env.JWT_SECRET);
    mockReq.headers = { authorization: `Bearer ${token}` };
    mockFindById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockUser),
    });

    await authenticate(mockReq as any, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect((mockReq as any).user).toEqual(mockUser);
  });
});
