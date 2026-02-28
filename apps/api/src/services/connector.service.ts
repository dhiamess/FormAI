import { ApiConnection, IApiConnectionDocument } from '../models/ApiConnection';
import { ConnectionType } from '@formai/shared';
import { encrypt, decrypt } from '../utils/encryption';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

export class ConnectorService {
  /**
   * Crée une nouvelle connexion avec credentials chiffrées
   */
  async create(data: {
    name: string;
    organization: string;
    type: ConnectionType;
    config: Record<string, unknown>;
    createdBy: string;
  }): Promise<IApiConnectionDocument> {
    // Chiffrer les champs sensibles
    const encryptedConfig = this.encryptSensitiveFields(data.config);

    const connection = await ApiConnection.create({
      name: data.name,
      organization: data.organization,
      type: data.type,
      config: encryptedConfig,
      createdBy: data.createdBy,
      status: 'inactive',
    });

    logger.info('Connection created', { id: connection._id, type: data.type });

    return connection;
  }

  /**
   * Teste une connexion
   */
  async testConnection(connectionId: string): Promise<boolean> {
    const connection = await ApiConnection.findById(connectionId);
    if (!connection) throw new NotFoundError('Connexion');

    const decryptedConfig = this.decryptSensitiveFields(connection.config as Record<string, string>);

    try {
      switch (connection.type) {
        case ConnectionType.SQLSERVER:
          await this.testSQLServer(decryptedConfig);
          break;
        case ConnectionType.MONGODB:
          await this.testMongoDB(decryptedConfig);
          break;
        case ConnectionType.REST_API:
          await this.testRestAPI(decryptedConfig);
          break;
        default:
          throw new ValidationError(`Type de connexion non supporté: ${connection.type}`);
      }

      connection.status = 'active';
      connection.lastTestedAt = new Date();
      await connection.save();

      logger.info('Connection test successful', { id: connectionId });
      return true;
    } catch (error) {
      connection.status = 'error';
      connection.lastTestedAt = new Date();
      await connection.save();

      logger.error('Connection test failed', { id: connectionId, error });
      return false;
    }
  }

  /**
   * Liste les connexions d'une organisation
   */
  async list(organizationId: string) {
    return ApiConnection.find({ organization: organizationId }).sort({ createdAt: -1 });
  }

  /**
   * Supprime une connexion
   */
  async delete(connectionId: string) {
    const result = await ApiConnection.findByIdAndDelete(connectionId);
    if (!result) throw new NotFoundError('Connexion');
  }

  private async testSQLServer(config: Record<string, unknown>): Promise<void> {
    const mssql = await import('mssql');
    const pool = await mssql.default.connect({
      server: config.host as string,
      port: config.port as number,
      database: config.database as string,
      user: config.username as string,
      password: config.password as string,
      options: { encrypt: true, trustServerCertificate: true },
    });
    await pool.request().query('SELECT 1');
    await pool.close();
  }

  private async testMongoDB(config: Record<string, unknown>): Promise<void> {
    const mongoose = await import('mongoose');
    const conn = await mongoose.default.createConnection(config.connectionString as string).asPromise();
    await conn.close();
  }

  private async testRestAPI(config: Record<string, unknown>): Promise<void> {
    const url = config.apiUrl as string;
    const headers: Record<string, string> = {};
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
  }

  private encryptSensitiveFields(config: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['password', 'apiKey', 'connectionString', 'username'];
    const encrypted = { ...config };
    for (const key of sensitiveKeys) {
      if (encrypted[key] && typeof encrypted[key] === 'string') {
        encrypted[key] = encrypt(encrypted[key] as string);
      }
    }
    return encrypted;
  }

  private decryptSensitiveFields(config: Record<string, string>): Record<string, unknown> {
    const sensitiveKeys = ['password', 'apiKey', 'connectionString', 'username'];
    const decrypted: Record<string, unknown> = { ...config };
    for (const key of sensitiveKeys) {
      if (decrypted[key] && typeof decrypted[key] === 'string') {
        try {
          decrypted[key] = decrypt(decrypted[key] as string);
        } catch {
          // Not encrypted or invalid — keep as-is
        }
      }
    }
    return decrypted;
  }
}

export const connectorService = new ConnectorService();
