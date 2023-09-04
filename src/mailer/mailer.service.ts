import { BadRequestException, Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppUtilities } from '../app.utilities';
import * as moment from 'moment';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class MailerService {
  constructor(
    private mailerService: NestMailerService,
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async sendUpdateEmail(email: string) {
    try {
      const generateToken = AppUtilities.generateToken(6);

      const token = generateToken.join('');

      const foundUser = await this.prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });
      const tokenExpires = parseInt(process.env.TOKEN_EXPIRES) || 5;

      const hashedToken = await AppUtilities.hasher(token);

      await this.prisma.user.update({
        where: { email },
        data: {
          tokenExpiresIn: moment().add(tokenExpires, 'minutes').toDate(),
          token: hashedToken,
          updatedAt: moment().toISOString(),
        },
      });

      await this.cacheService.set(token, email, 10 * 60);

      const fullName = `${foundUser.profile.firstName} ${foundUser.profile.lastName}`;
      const emailMessage = await this.updateEmailMessage(token, email);

      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Password',
        html: emailMessage,
        context: {
          fullName,
          token,
        },
      });

      return;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateEmailMessage(
    updateToken: string,
    email: string,
  ): Promise<string> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { profile: { select: { firstName: true, lastName: true } } },
      });

      const message = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <style>
      section {
        font-family:"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", "Lucida Sans", sans-serif;
        color: #24557D;
        font-weight: 700;
        line-height: 3;
      }
      .contact-link {
        text-decoration: none;
        color: #35D1BE;
      }
      .token {
        color: black;
        font-size: xx-large;
      }
    </style>
  </head>
  <body>
    <section>
      <p>Hello ${user.profile.firstName} ${user.profile.lastName},<br>
      We've received a request to reset the password for the Job Finder
      account associated with <a class="contact-link" href="mailto:${email}">${email}</a>. No changes
      have been made to your account yet.<br>
      Do not share this token with anyone.<br>
      You can update your password by using the token below:
      <br>
      <b class= "token">${updateToken}</b>
    </p>
    </section>
  </body>
  </html>
`;

      return message;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
