import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '@@common/prisma/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { CacheService } from '@@common/cache/cache.service';
import { PrismaClientManager } from '@@/common/database/prisma-client-manager';
import { BullModule } from '@nestjs/bull';
import { QUEUE } from '@@/messaging/interfaces';
import { MessagingQueueConsumer } from '@@/messaging/queue/consumer';
import { MessagingQueueProducer } from '@@/messaging/queue/producer';

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
    BullModule.registerQueue({ name: QUEUE }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaClientManager,
    PrismaService,
    ConfigService,
    JwtStrategy,
    GoogleStrategy,
    CacheService,
    MessagingQueueConsumer,
    MessagingQueueProducer,
  ],
  exports: [AuthService, MessagingQueueConsumer, MessagingQueueProducer],
})
export class AuthModule {}
