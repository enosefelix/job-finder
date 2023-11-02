// tokenBlacklist.middleware.ts

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TokenBlacklistMiddleware implements NestMiddleware {
  tokenBlacklist = new Set();
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;

    if (this.tokenBlacklist.has(token)) {
      // Token is in the blacklist, unauthorized
      return res.sendStatus(401);
    }

    // Token is valid, proceed with the request
    next();
  }
}
