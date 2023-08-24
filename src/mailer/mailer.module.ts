import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerController } from './mailer.controller';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
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
  ],
  controllers: [MailerController],
  providers: [MailerService, PrismaService, CacheService],
  exports: [MailerService],
})
export class MailerModule {}
