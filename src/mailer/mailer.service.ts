import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppUtilities } from '../app.utilities';
import * as moment from 'moment';
import { CacheService } from '../common/cache/cache.service';
import * as crypto from 'crypto';

@Injectable()
export class MailerService {
  constructor(
    private mailerService: NestMailerService,
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async sendUpdateEmail(email: string) {
    const generateToken = AppUtilities.generateToken(6);
    const generateSecret = AppUtilities.generateRandomString(12);

    const token = generateToken.join('');
    console.log(
      '🚀 ~ file: mailer.service.ts:20 ~ MailerService ~ sendUpdateEmail ~ token:',
      token,
    );

    const timestamp = moment().toString();
    const temporarySecret = `${generateSecret}${timestamp}`;
    console.log(
      '🚀 ~ file: mailer.service.ts:27 ~ MailerService ~ sendUpdateEmail ~ temporarySecret:',
      temporarySecret,
    );

    const foundUser = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    // Store the token hash in your cache
    const hashToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log(
      '🚀 ~ file: mailer.service.ts:55 ~ MailerService ~ sendUpdateEmail ~ hashToken:',
      hashToken,
    );
    const setHashToken = await this.cacheService.set(token, hashToken, 10 * 60);
    console.log(
      '🚀 ~ file: mailer.service.ts:60 ~ MailerService ~ sendUpdateEmail ~ setHashToken:',
      setHashToken,
    );
    const setTokenHash = await this.cacheService.set(
      hashToken,
      {
        userId: foundUser.id,
        temporarySecret,
      },
      10 * 60,
    );
    console.log(
      '🚀 ~ file: mailer.service.ts:67 ~ MailerService ~ sendUpdateEmail ~ setTokenHash:',
      setTokenHash,
    );

    const tokenExpires = parseInt(process.env.TOKEN_EXPIRES) || 5;

    const updateToken = await this.prisma.user.update({
      where: { email },
      data: {
        tokenExpiresIn: moment().add(tokenExpires, 'minutes').toDate(),
        token,
      },
    });

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
