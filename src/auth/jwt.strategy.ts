import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@@common/prisma/prisma.service';
import { PrismaClientManager } from '@@/common/database/prisma-client-manager';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private prismaClient;
  constructor(
    private prismaClientManager: PrismaClientManager,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
    this.prismaClient = this.prismaClientManager.getPrismaClient();
  }

  async validate(payload: any) {
    try {
      const user = await this.prismaClient.user.findUnique({
        where: { email: payload.email },
      });

      if (!user) {
        throw new UnauthorizedException();
      }

      return user;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException(error.message);
    }
  }
}
