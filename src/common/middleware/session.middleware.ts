import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    user_id?: number;
    username?: string;
    email?: string;
    role?: string;
    isLoggedIn?: boolean;
  }
}

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Pass session data to views via res.locals
    if (req.session) {
      res.locals.isLoggedIn = req.session.isLoggedIn || false;
      res.locals.username = req.session.username || 'Guest';
      res.locals.userRole = req.session.role || '';
      res.locals.userId = req.session.user_id || null;
    } else {
      res.locals.isLoggedIn = false;
      res.locals.username = 'Guest';
      res.locals.userRole = '';
      res.locals.userId = null;
    }
    next();
  }
}