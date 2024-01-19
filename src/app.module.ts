import { AuthModule } from './auth/auth.module';
import { PrismaService } from './common/prisma/prisma.service';
import appConfig from './app.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtService } from '@nestjs/jwt';
import { JobListingsModule } from './job-listings/job-listings.module';
import { AdminModule } from './admin/admin.module';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './common/cache/cache.service';
import * as redisStore from 'cache-manager-redis-store';
import { HealthController } from './health-check.controller';
import { UserModule } from './user/user.module';
import { ProfileModule } from './user/profile/profile.module';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { BlogModule } from './admin/blog/blog.module';
import { JobListingApplicationsModule } from './job-listing-applications/job-listing-applications.module';
import { BookmarksModule } from './user/bookmarks/bookmarks.module';
import { GoogleStrategy } from './auth/google.strategy';
import { DatabaseModule } from './common/database/database.module';
import { MessagingModule } from './messaging/messaging.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    ThrottlerModule.forRoot([
      {
        ttl: 20000,
        limit: 10,
      },
    ]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        prefix: `${config.get('environment')}:${config.get('app.name')}`,
        redis: {
          host: config.get('redis.host'),
          port: config.get('redis.port'),
        },
      }),
    }),
    JobListingsModule,
    BlogModule,
    AdminModule,
    CloudinaryModule,
    NestCacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST');
        const redisPort = configService.get<string>('REDIS_PORT');
        const redisUsername = configService.get<string>('REDIS_USERNAME');
        const redisPassword = configService.get<string>('REDIS_PASSWORD');

        console.log('🚀 ~ Redis host:', redisHost);
        console.log('🚀 ~ Redis port:', redisPort);
        console.log('🚀 ~ Redis username:', redisUsername);
        console.log('🚀 ~ Redis password:', redisPassword);

        return {
          isGlobal: true,
          store: redisStore,
          host: redisHost,
          port: redisPort,
          username: redisUsername,
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
    CacheModule.register({ isGlobal: true }),
    UserModule,
    ProfileModule,
    PassportModule.register({ isGlobal: true, defaultStrategy: 'jwt' }),
    JobListingApplicationsModule,
    BookmarksModule,
    MessagingModule,
  ],
  controllers: [HealthController],
  providers: [
    PrismaService,
    JwtService,
    JwtStrategy,
    CacheService,
    GoogleStrategy,
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerGuard,
    },
  ],
  exports: [DatabaseModule],
})
export class AppModule {}
