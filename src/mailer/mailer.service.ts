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

@Injectable()
export class MailerService {
  logger = new Logger(MailerService.name);

  constructor(
    private mailerService: NestMailerService,
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async sendUpdateEmail(email: string) {
    try {
      const foundUser = await this.prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });
      const requestId = v4();

      await this.cacheService.set(
        CacheKeysEnums.REQUESTS + requestId,
        {
          email,
          userId: foundUser.id,
        },
        parseInt(process.env.PASSWORD_RESET_EXPIRES),
      );

      const resetUrl = new URL(
        `${process.env.FRONTENDURL}/pages/auth/reset-password/${requestId}`,
      );

      const firstName = foundUser.profile.firstName,
        lastName = foundUser.profile.lastName;

      const fullName = `${firstName} ${lastName}`;
      const imagePath =
        'aHR0cHM6Ly9yZXMuY2xvdWRpbmFyeS5jb20vZGpta3l4eGJjL2ltYWdlL3VwbG9hZC92MTY5NzYxNDYzOC9kZXZlbG9wbWVudC9odHRwczp3aGFsZS1hcHAtd3E3aGMub25kaWdpdGFsb2NlYW4uYXBwL2ltYWdlcy9tYWlsLWltYWdlcy9pLVdvcmstaW4tQWZyaWthX3Z5MXM4ei5wbmc=';
      const mailServicePayload = {
        context: {
          fullName,
          resetUrl,
          email: foundUser.email,
          imagePath: AppUtilities.decode(imagePath),
        },
        email: foundUser.email,
        templateName: TEMPLATE.RESET_MAIL,
        subject: 'Reset Password',
      };

      this.logger.debug(`Sending reset link mail...`);
      await this.sendMail(mailServicePayload);
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

  async sendMail(payload: any) {
    const buildEmailTemplate = (templateName: string) => {
      return handlebars.compile(
        readFileSync(
          `src/mailer/public/templates/${templateName}.hbs`,
          'utf-8',
        ),
      );
    };

    const emailTemplate = buildEmailTemplate('reset-password')(payload.context);

    const mailOptions = {
      to: payload.email,
      subject: payload.subject,
      attachments: [
        // {
        //   filename: 'i-Work-in-Afrika.jpg',
        //   path: imagePath,
        //   cid: 'i-Work-in-Afrika_u1xcki',
        // },
      ],
      html: emailTemplate,
    };

    return this.mailerService.sendMail(mailOptions);
  }
}
