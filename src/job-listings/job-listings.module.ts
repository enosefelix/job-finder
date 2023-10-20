import { Module } from '@nestjs/common';
import { JobListingsService } from './job-listings.service';
import { JobListingsController } from './job-listings.controller';
import { PrismaService } from '@@common/prisma/prisma.service';
import { CloudinaryService } from '@@cloudinary/cloudinary.service';
import { AuthService } from '@@/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@@/mailer/mailer.service';
import { CacheService } from '@@/common/cache/cache.service';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from '@@/auth/google.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [JobListingsController],
  providers: [
    AuthService,
    JobListingsService,
    PrismaService,
    CloudinaryService,
    GoogleStrategy,
    JwtService,
    MailerService,
    CacheService,
  ],
})
export class JobListingsModule {}
