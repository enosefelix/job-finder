import { Module } from '@nestjs/common';
import { JobListingsService } from './job-listings.service';
import { JobListingsController } from './job-listings.controller';
import { PrismaService } from '@@common/prisma/prisma.service';
import { CloudinaryService } from '@@cloudinary/cloudinary.service';
import { AuthService } from '@@/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { CacheService } from '@@/common/cache/cache.service';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from '@@/auth/google.strategy';
import { PrismaClientManager } from '@@/common/database/prisma-client-manager';
import { MessagingQueueProducer } from '@@/messaging/queue/producer';
import { BullModule } from '@nestjs/bull';
import { QUEUE } from '@@/messaging/interfaces';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    BullModule.registerQueue({ name: QUEUE }),
  ],
  controllers: [JobListingsController],
  providers: [
    AuthService,
    JobListingsService,
    PrismaService,
    CloudinaryService,
    GoogleStrategy,
    JwtService,
    PrismaClientManager,
    CacheService,
    MessagingQueueProducer,
  ],
})
export class JobListingsModule {}
