import { AuthModule } from './auth/auth.module';
import { PrismaService } from './common/prisma/prisma.service';
import appConfig from './app.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtService } from '@nestjs/jwt';
import { JobListingsModule } from './job-listings/job-listings.module';
import { AdminModule } from './admin/admin.module';
import { MailerModule } from './mailer/mailer.module';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './common/cache/cache.service';
import * as redisStore from 'cache-manager-redis-store';
import { HealthController } from './health-check.controller';
import { MailerService } from './mailer/mailer.service';
import { UserModule } from './user/user.module';
import { ProfileModule } from './user/profile/profile.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    JobListingsModule,
    AdminModule,
    MailerModule,
    CloudinaryModule,
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisPassword = configService.get<string>('redis.password'); // Get the password from environment
        const host = configService.get<string>('redis.host'); // Get the password from environment
        const port = configService.get<string>('redis.port'); // Get the password from environment
        return {
          isGlobal: true,
          store: redisStore,
          host: host,
          port: port,
          password: redisPassword,
        };
      },
      inject: [ConfigService],
    }),
    NestMailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: configService.get<number>('MAIL_PORT'),
          security: configService.get<string>('MAIL_SECURITY'),
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASSWORD'),
          },
          pool: true,
          maxConnections: 10,
        },
        defaults: {
          from: `"No Reply" <no-reply@robot-mail.com>`,
        },
      }),
      inject: [ConfigService],
    }),
    CacheModule.register({}),
    UserModule,
    ProfileModule,
  ],
  controllers: [HealthController],
  providers: [
    PrismaService,
    JwtService,
    JwtStrategy,
    CacheService,
    MailerService,
  ],
})
export class AppModule {}
