import { Module } from '@nestjs/common';
import { JobListingApplicationsService } from './job-listing-applications.service';
import { JobListingApplicationsController } from './job-listing-applications.controller';
import { CloudinaryService } from '@@/cloudinary/cloudinary.service';
import { AuthService } from '@@/auth/auth.service';
import { MailerService } from '@@/mailer/mailer.service';
import { CacheService } from '@@/common/cache/cache.service';
import { JwtService } from '@nestjs/jwt';
import { JobListingsService } from '@@/job-listings/job-listings.service';
import { PrismaService } from '@@/common/prisma/prisma.service';
import { GoogleStrategy } from '@@/auth/google.strategy';
import { PrismaClientManager } from '@@/common/database/prisma-client-manager';

@Module({
  controllers: [JobListingApplicationsController],
  providers: [
    JobListingApplicationsService,
    JobListingsService,
    PrismaService,
    CloudinaryService,
    GoogleStrategy,
    AuthService,
    MailerService,
    CacheService,
    PrismaClientManager,
    JwtService,
  ],
})
export class JobListingApplicationsModule {}
