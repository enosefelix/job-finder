import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../common/prisma/prisma.service';
import { PassportModule } from '@nestjs/passport';
import { JobListingsService } from '../job-listings/job-listings.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AuthService } from '../auth/auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MailerService } from '../mailer/mailer.service';
import { CacheService } from '../common/cache/cache.service';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule.forRoot()],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') },
      }),
    }),
    CacheModule.register(),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    PrismaService,
    JobListingsService,
    CloudinaryService,
    AuthService,
    JwtService,
    JwtStrategy,
    MailerService,
    CacheService,
  ],
})
export class AdminModule {}
