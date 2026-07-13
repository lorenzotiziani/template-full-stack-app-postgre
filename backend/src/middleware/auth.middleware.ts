import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../api/auth/auth.service';
import { UnauthorizedError } from '../errors';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // Verifica presenza header Authorization
    if (!authHeader) {
      throw new UnauthorizedError('Token di autenticazione mancante');
    }

    // Verifica formato Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedError('Formato token non valido. Usa: Bearer <token>');
    }

    const token = parts[1];

    // Verifica validità token
    const decoded = await AuthService.verifyAccessToken(token);

    // Aggiungi user info alla request
    (req as AuthRequest).user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Consente l'accesso solo agli utenti con ruolo ADMIN.
// Va usato DOPO authMiddleware (che popola req.user con il ruolo dal JWT).
export const requireAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
  const user = (req as AuthRequest).user;
  if (!user || user.role !== 'ADMIN') {
    next(new UnauthorizedError('Accesso riservato agli amministratori'));
    return;
  }
  next();
};