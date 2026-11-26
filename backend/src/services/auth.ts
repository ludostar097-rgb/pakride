import dotenv from 'dotenv';
dotenv.config();
if (!process.env.JWT_SECRET) {
  dotenv.config({ path: 'backend/.env' });
}
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../shared/types.js';
import { db } from '../db/store.js';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing. Refusing to start without a secure secret.');
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthTokenPayload {
  userId: string;
  phone: string;
  role: UserRole;
  fullName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export class AuthService {
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  public static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  public static generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  }

  public static verifyToken(token: string): AuthTokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    } catch {
      return null;
    }
  }

  public static requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer token' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = AuthService.verifyToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
      return;
    }

    req.user = payload;
    next();
  }

  public static requireRole(roles: UserRole[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: Authentication required' });
        return;
      }
      if (!roles.includes(req.user.role)) {
        res.status(403).json({ error: `Forbidden: Requires one of [${roles.join(', ')}] roles` });
        return;
      }
      next();
    };
  }
}
