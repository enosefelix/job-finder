import { Injectable } from '@nestjs/common';
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
    const generateToken = AppUtilities.generateToken();

    const token = generateToken.join('');

    const foundUser = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    const tokenExpires = parseInt(process.env.TOKEN_EXPIRES) || 5;

    const updateToken = await this.prisma.user.update({
      where: { email },
      data: {
        tokenExpiresIn: moment().add(tokenExpires, 'minutes').toDate(),
        token,
      },
    });

    await this.cacheService.set(token, email, 10 * 60);

    const fullName = `${foundUser.profile.firstName} ${foundUser.profile.lastName}`;
    const emailMessage = await this.updateEmailMessage(token, email);

    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Update',
      html: emailMessage,
      context: {
        fullName,
        token,
      },
    });

    return;
  }

  async updateEmailMessage(
    updateToken: string,
    email: string,
  ): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { profile: { select: { firstName: true, lastName: true } } },
    });

    const message = `Hello ${user.profile.firstName},\n\nHere's your token: ${updateToken}`;
    return message;
  }
}
