import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { MailerModule } from '@@mailer/mailer.module';
import { AuthModule } from '@@auth/auth.module';
import { CacheService } from './cache.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
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
    MailerModule,
    AuthModule,
  ],
  providers: [CacheService],
})
export class CacheModule {}
