import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUserDocument } from '../models/User';
import { Organization } from '../models/Organization';
import { Group } from '../models/Group';
import { UserRole } from '@formai/shared';
import { AppError, ConflictError, UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName?: string;
  }): Promise<{ user: IUserDocument; tokens: TokenPair }> {
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError('Un utilisateur avec cet email existe déjà');
    }

    // Créer ou trouver l'organisation
    const orgSlug = (data.organizationName || `org-${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');

    let organization = await Organization.findOne({ slug: orgSlug });
    if (!organization) {
      organization = await Organization.create({
        name: data.organizationName || `Organisation de ${data.firstName}`,
        slug: orgSlug,
      });
    }

    // Créer le groupe par défaut "Utilisateurs"
    let defaultGroup = await Group.findOne({ organization: organization._id, name: 'Utilisateurs' });
    if (!defaultGroup) {
      defaultGroup = await Group.create({
        name: 'Utilisateurs',
        description: 'Groupe par défaut',
        organization: organization._id,
        permissions: {
          forms: { create: false, read: true, update: false, delete: false, publish: false },
          submissions: { read: true, export: false, delete: false },
          users: { manage: false },
          settings: { manage: false },
        },
      });
    }

    const user = await User.create({
      email: data.email.toLowerCase(),
      passwordHash: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: UserRole.ADMIN,
      organization: organization._id,
      groups: [defaultGroup._id],
    });

    // Ajouter l'utilisateur au groupe
    defaultGroup.members.push(user._id);
    await defaultGroup.save();

    const tokens = this.generateTokens(user);

    logger.info('User registered', { userId: user._id, email: user.email });

    return { user, tokens };
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(email: string, password: string): Promise<{ user: IUserDocument; tokens: TokenPair }> {
    const user = await User.findOne({ email: email.toLowerCase() }).populate('groups');

    if (!user) {
      throw new UnauthorizedError('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Compte désactivé');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Email ou mot de passe incorrect');
    }

    user.lastLogin = new Date();
    await user.save();

    const tokens = this.generateTokens(user);

    logger.info('User logged in', { userId: user._id });

    return { user, tokens };
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Token invalide');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedError('Token de rafraîchissement invalide');
    }
  }

  /**
   * Génère une paire de tokens JWT
   */
  private generateTokens(user: IUserDocument): TokenPair {
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as unknown as number },
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as unknown as number },
    );

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
