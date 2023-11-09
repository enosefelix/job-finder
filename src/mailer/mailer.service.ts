import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '@@common/prisma/prisma.service';
import { CacheService } from '@@common/cache/cache.service';
import { CacheKeysEnums } from '@@/common/cache/cache.enums';
import { v4 } from 'uuid';
import { readFileSync } from 'fs';
import handlebars from 'handlebars';
import { AppUtilities } from '@@/app.utilities';
import { TEMPLATE } from './interfaces';
import { PrismaClientManager } from '@@/common/database/prisma-client-manager';

@Injectable()
export class MailerService {
  private prismaClient;
  logger = new Logger(MailerService.name);

  constructor(
    private prismaClientManager: PrismaClientManager,
    private mailerService: NestMailerService,
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {
    this.prismaClient = this.prismaClientManager.getPrismaClient();
  }

  async sendUpdateEmail(email: string, templateName: string) {
    try {
      const foundUser = await this.prismaClient.user.findUnique({
        where: { email },
        include: { profile: true, role: true },
      });
      const requestId = v4();
      console.log(
        '🚀 ~ file: mailer.service.ts:39 ~ MailerService ~ sendUpdateEmail ~ requestId:',
        requestId,
      );

      await this.cacheService.set(
        CacheKeysEnums.REQUESTS + requestId,
        {
          email,
          userId: foundUser.id,
          role: foundUser?.role?.code,
        },
        parseInt(process.env.PASSWORD_RESET_EXPIRES),
      );

      const resetUrlUser = new URL(
        `${process.env.FRONTEND_URL_USER}/pages/auth/reset-password/${requestId}`,
      );

      const resetUrlAdmin = new URL(
        `${process.env.FRONTEND_URL_ADMIN}/pages/auth/reset-password/${requestId}`,
      );

      const firstName = foundUser.profile.firstName,
        lastName = foundUser.profile.lastName;

      const fullName = `${firstName} ${lastName}`;
      const imagePath =
        'aHR0cHM6Ly9yZXMuY2xvdWRpbmFyeS5jb20vZGpta3l4eGJjL2ltYWdlL3VwbG9hZC92MTY5NzYxNDYzOC9kZXZlbG9wbWVudC9odHRwczp3aGFsZS1hcHAtd3E3aGMub25kaWdpdGFsb2NlYW4uYXBwL2ltYWdlcy9tYWlsLWltYWdlcy9pLVdvcmstaW4tQWZyaWthX3Z5MXM4ei5wbmc=';
      const mailServicePayload = {
        context: {
          fullName,
          resetUrl:
            templateName === TEMPLATE.RESET_MAIL_ADMIN
              ? resetUrlAdmin
              : resetUrlUser,
          email: foundUser.email,
          imagePath: AppUtilities.decode(imagePath),
        },
        email: foundUser.email,
        templateName: TEMPLATE.RESET_MAIL_USER,
        subject: 'Reset Password',
      };

      this.logger.debug(`Sending reset link mail...`);
      await this.sendMail(mailServicePayload, templateName);
      this.logger.debug(`Mail sent!`);

      return;
    } catch (error) {
      if (
        error.message ===
          'Client network socket disconnected before secure TLS connection was established' ||
        error.message === 'getaddrinfo ENOTFOUND smtp.gmail.com'
      )
        throw new ServiceUnavailableException(
          "Network Error, make sure you're connected to the internet",
        );
      throw new BadRequestException(error.message);
    }
  }

  buildEmailTemplate = (templateName: string) => {
    return handlebars.compile(
      readFileSync(`src/mailer/public/templates/${templateName}.hbs`, 'utf-8'),
    );
  };

  async sendMail(payload: any, templateName: string) {
    try {
      const emailTemplate = this.buildEmailTemplate(templateName)(
        payload.context,
      );

      const mailOptions = {
        to: payload.email,
        subject: payload.subject,
        attachments: [],
        html: emailTemplate,
      };

      return this.mailerService.sendMail(mailOptions);
    } catch (error) {
      console.log(error);
      throw new ServiceUnavailableException('Service Unavailable');
    }
  }
}
