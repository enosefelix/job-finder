import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JobListingsService } from '../job-listings/job-listings.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PassportModule } from '@nestjs/passport';
import { ProfileController } from './profile/profile.controller';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [UserController, ProfileController],
  providers: [
    UserService,
    JobListingsService,
    PrismaService,
    CloudinaryService,
  ],
})
export class UserModule {}
