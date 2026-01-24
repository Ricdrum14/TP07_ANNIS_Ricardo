import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET: string = process.env.JWT_SECRET || 'ta_cle_secrete_ici';

// Définir ce qu'on met dans le token
export interface AuthUserPayload {
  id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Étendre Request pour avoir req.user bien typé
declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

const jwtMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  // 401 = pas authentifié (token absent)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token manquant ou invalide' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;

    // sécurité : s'assurer qu'on a bien un id
    if (!decoded?.id) {
      res.status(401).json({ message: 'Token invalide' });
      return;
    }

    req.user = decoded;
    next();
  } catch {
    // 401 = token invalide/expiré
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

export default jwtMiddleware;
