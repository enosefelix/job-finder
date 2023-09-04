import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../common/prisma/prisma.service';
import { PassportModule } from '@nestjs/passport';
import { JobListingsService } from 'src/job-listings/job-listings.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { AuthService } from 'src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from 'src/mailer/mailer.service';
import { CacheService } from 'src/common/cache/cache.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    CacheModule.register(),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    PrismaService,
    JobListingsService,
    CloudinaryService,
    AuthService,
    JwtService,
    MailerService,
    CacheService,
  ],
})
export class AdminModule {}
