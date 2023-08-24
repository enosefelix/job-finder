import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { ROLE_TYPE } from '../interfaces';

export const GetAdminUser = createParamDecorator(
  (_data, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest();
    if (req.user?.role?.code === ROLE_TYPE.ADMIN) {
      return req.user;
    }
    throw new ForbiddenException('User cannot access this resource');
  },
);
