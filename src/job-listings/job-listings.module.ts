import { Module } from '@nestjs/common';
import { JobListingsService } from './job-listings.service';
import { JobListingsController } from './job-listings.controller';
import { PrismaService } from '../common/prisma/prisma.service';
import { PassportModule } from '@nestjs/passport';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [JobListingsController],
  providers: [JobListingsService, PrismaService, CloudinaryService],
})
export class JobListingsModule {}
