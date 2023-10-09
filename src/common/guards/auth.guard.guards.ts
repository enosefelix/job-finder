import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
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
    try {
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

      throw new ForbiddenException(
        'User cannot access this resource. You are not an Admin',
      );
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
