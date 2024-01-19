import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { AuthModule } from '@@auth/auth.module';
import { CacheService } from './cache.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
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
    AuthModule,
  ],
  providers: [CacheService],
})
export class CacheModule {}
