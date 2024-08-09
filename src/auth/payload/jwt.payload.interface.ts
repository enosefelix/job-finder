import { Roles } from '@prisma/client';

export interface JwtPayload {
  email: string;
  userId?: string;
  role?: Roles;
}
