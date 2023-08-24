// import {
//   ExecutionContext,
//   ForbiddenException,
//   Injectable,
// } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { ROLE_TYPE } from '../interfaces';

// @Injectable()
// export class AdminAuthGuard extends AuthGuard() {
//   constructor() {
//     super();
//   }
//   canActivate(context: ExecutionContext): any {
//     const request = context.switchToHttp().getRequest();
//     const user = request.user;
//     console.log(
//       '🚀 ~ file: auth.guard.guards.ts:14 ~ AdminAuthGuard ~ canActivate ~ user:',
//       request.user,
//     );
//     // if (user?.role?.code === ROLE_TYPE.ADMIN) {
//     //   return true;
//     // }
//     // throw new ForbiddenException('User cannot access this resource');
//   }
// }

// import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
// import { Observable } from 'rxjs';

// @Injectable()
// export class AuthGuard implements CanActivate {
//   canActivate(context: ExecutionContext): any {
//     const request = context.switchToHttp().getRequest();
//     console.log(
//       '🚀 ~ file: auth.guard.guards.ts:38 ~ AuthGuard ~ request:',
//       request.user,
//     );
//     // return validateRequest(request);
//   }
// }

import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ROLE_TYPE } from '../interfaces';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userWithRole = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (userWithRole?.role?.code === ROLE_TYPE.ADMIN) {
      return true;
    }

    throw new ForbiddenException('User cannot access this resource');
  }
}
