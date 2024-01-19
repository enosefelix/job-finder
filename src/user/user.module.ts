import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JobListingsService } from '@@job-listings/job-listings.service';
import { PrismaService } from '@@common/prisma/prisma.service';
import { CloudinaryService } from '@@cloudinary/cloudinary.service';
import { PassportModule } from '@nestjs/passport';
import { ProfileController } from './profile/profile.controller';
import { AuthService } from '@@/auth/auth.service';
import { CacheService } from '@@/common/cache/cache.service';
import { JwtService } from '@nestjs/jwt';
import { JobListingApplicationsService } from '@@/job-listing-applications/job-listing-applications.service';
import { BookmarksService } from './bookmarks/bookmarks.service';
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
  controllers: [UserController, ProfileController],
  providers: [
    UserService,
    JobListingsService,
    PrismaService,
    CloudinaryService,
    AuthService,
    CacheService,
    GoogleStrategy,
    JwtService,
    JobListingApplicationsService,
    BookmarksService,
    PrismaClientManager,
    MessagingQueueProducer,
  ],
})
export class UserModule {}
