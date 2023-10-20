import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { PrismaService } from '@@/common/prisma/prisma.service';
import { AuthService } from '@@/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from '@@/auth/jwt.strategy';
import { CacheService } from '@@/common/cache/cache.service';
import { MailerService } from '@@/mailer/mailer.service';
import { CloudinaryService } from '@@/cloudinary/cloudinary.service';
import { GoogleStrategy } from '@@/auth/google.strategy';
@Module({
  controllers: [BlogController],
  providers: [
    BlogService,
    PrismaService,
    AuthService,
    JwtService,
    JwtStrategy,
    MailerService,
    GoogleStrategy,
    CacheService,
    CloudinaryService,
  ],
})
export class BlogModule {}
