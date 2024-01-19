import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { PrismaService } from '@@/common/prisma/prisma.service';
import { AuthService } from '@@/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from '@@/auth/jwt.strategy';
import { CacheService } from '@@/common/cache/cache.service';
import { CloudinaryService } from '@@/cloudinary/cloudinary.service';
import { GoogleStrategy } from '@@/auth/google.strategy';
import { PrismaClientManager } from '@@/common/database/prisma-client-manager';
import { MessagingQueueProducer } from '@@/messaging/queue/producer';
import { BullModule } from '@nestjs/bull';
import { QUEUE } from '@@/messaging/interfaces';
@Module({
  imports: [BullModule.registerQueue({ name: QUEUE })],
  controllers: [BlogController],
  providers: [
    BlogService,
    PrismaService,
    AuthService,
    JwtService,
    JwtStrategy,
    GoogleStrategy,
    CacheService,
    CloudinaryService,
    PrismaClientManager,
    MessagingQueueProducer,
  ],
})
export class BlogModule {}
