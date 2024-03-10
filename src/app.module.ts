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
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { BlogModule } from './admin/blog/blog.module';
import { JobListingApplicationsModule } from './job-listing-applications/job-listing-applications.module';
import { BookmarksModule } from './user/bookmarks/bookmarks.module';
import { GoogleStrategy } from './auth/google.strategy';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConvertModule } from './convert/convert.module';
import { DatabaseModule } from './common/database/database.module';
import { MessagingModule } from './messaging/messaging.module';

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
    JobListingsModule,
    BlogModule,
    AdminModule,
    MailerModule,
    CloudinaryModule,
    NestCacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisPassword = configService.get<string>('redis.password');
        const host = configService.get<string>('redis.host');
        const port = configService.get<string>('redis.port');
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
    CacheModule.register({ isGlobal: true }),
    UserModule,
    ProfileModule,
    PassportModule.register({ isGlobal: true, defaultStrategy: 'jwt' }),
    JobListingApplicationsModule,
    BookmarksModule,
    ServeStaticModule.forRoot({
      rootPath: join('src/mailer/public/images'),
    }),
    ConvertModule,
    MessagingModule,
  ],
  controllers: [HealthController],
  providers: [
    PrismaService,
    JwtService,
    JwtStrategy,
    CacheService,
    MailerService,
    GoogleStrategy,
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerGuard,
    },
  ],
  exports: [DatabaseModule],
})
export class AppModule {}
