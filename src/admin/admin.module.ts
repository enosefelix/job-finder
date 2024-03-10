import { Module } from '@nestjs/common';
import { AdminService } from '@@admin/admin.service';
import { AdminController } from '@@admin/admin.controller';
import { PrismaService } from '@@common/prisma/prisma.service';
import { PassportModule } from '@nestjs/passport';
import { JobListingsService } from '@@job-listings/job-listings.service';
import { CloudinaryService } from '@@cloudinary/cloudinary.service';
import { AuthService } from '@@auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { MailerService } from '@@mailer/mailer.service';
import { CacheService } from '@@common/cache/cache.service';
import { JwtStrategy } from '@@auth/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BlogService } from './blog/blog.service';
import { UserService } from '@@/user/user.service';
import { BookmarksService } from '@@/user/bookmarks/bookmarks.service';
import { GoogleStrategy } from '@@/auth/google.strategy';
import { PrismaClientManager } from '@@/common/database/prisma-client-manager';

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
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    PrismaService,
    JobListingsService,
    CloudinaryService,
    AuthService,
    JwtStrategy,
    MailerService,
    CacheService,
    BlogService,
    UserService,
    GoogleStrategy,
    BookmarksService,
    PrismaClientManager,
  ],
})
export class AdminModule {}
