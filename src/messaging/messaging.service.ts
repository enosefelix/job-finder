import { AppUtilities } from '@@/app.utilities';
import { CacheKeysEnums } from '@@/common/cache/cache.enums';
import { CacheService } from '@@/common/cache/cache.service';
import { PrismaService } from '@@/common/prisma/prisma.service';
import { TEMPLATE } from '@@/mailer/interfaces';
import {
  AUTH_ERROR_MSGS,
  MessageStatus,
  MessageType,
} from '@@common/interfaces';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import moment from 'moment';
import { v4 } from 'uuid';
import { EmailBuilder } from './builder/email-builder';
import { MailProviders } from './interfaces';
import { MailService } from './messaging-mail.service';

@Injectable()
export class MessagingService {
  private senderEmail: string;

  constructor(
    private configService: ConfigService,
    private mailService: MailService,
    private cacheService: CacheService,
    private prisma: PrismaService,
  ) {
    this.senderEmail = this.configService.get<string>('messaging.senderEmail');
  }

  private async getAppEmailConfig() {
    return {
      apiKey: this.configService.get<string>('smtp.transport.auth.pass'),
      port: this.configService.get<string>('smtp.transport.port'),
      senderAddress: this.configService.get<string>(
        'smtp.defaults.from.address',
      ),
      senderName: this.configService.get<string>('smtp.defaults.from.name'),
      authPassword: this.configService.get<string>('smtp.transport.auth.pass'),
      authUser: this.configService.get<string>('smtp.transport.auth.user'),
      host: this.configService.get<string>('smtp.transport.host'),
      provider: MailProviders.Smtp,
      secure: this.configService.get<string>('smtp.transport.secure'),
    };
  }

  public async sendUpdateEmail(user: User, templateName: TEMPLATE) {
    // const getUser = await this.
    // get message template from db

    const findUser = await this.prisma.user.findFirst({
      where: {
        id: user.id,
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        role: {
          select: {
            code: true,
          },
        },
      },
    });

    if (!findUser)
      throw new BadRequestException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const emailTemplate = await this.prisma.messageTemplate.findFirst({
      where: {
        code: templateName,
      },
    });

    if (!emailTemplate)
      throw new BadRequestException('Email template has not been setup');

    const config = await this.getAppEmailConfig();

    const requestId = v4();

    await this.cacheService.set(
      CacheKeysEnums.REQUESTS + requestId,
      {
        email: user.email,
        fullName: `${findUser.profile.firstName} ${findUser.profile.lastName}`,
        userId: user.id,
        role: findUser.role?.code,
      },
      parseInt(process.env.PASSWORD_RESET_EXPIRES || '3600'),
    );

    const fullName = `${findUser.profile.firstName} ${findUser.profile.lastName}`;

    const resetUrlUser = new URL(
      `${process.env.FRONTEND_URL_USER}/pages/auth/reset-password/${requestId}`,
    );

    const resetUrlAdmin = new URL(
      `${process.env.FRONTEND_URL_ADMIN}/pages/auth/reset-password/${requestId}`,
    );

    const imagePath = this.configService.get<string>(
      'smtp.attachments.imagePath',
    );

    const resetUrl =
      templateName === TEMPLATE.RESET_MAIL_ADMIN ? resetUrlAdmin : resetUrlUser;

    const emailBuilder = new EmailBuilder()
      .useTemplate(emailTemplate, {
        fullName,
        email: user.email,
        resetUrl,
        imagePath: AppUtilities.decode(imagePath),
      })
      .addRecipients(user.email);

    // add sender details from config settings
    emailBuilder.addFrom(config.senderAddress, config.senderName);

    // create message in base message table
    const message = await this.prisma.message.create({
      data: {
        bindings: {
          sender: this.senderEmail,
          recipient: user.email,
        },
        template: { connect: { id: emailTemplate.id } },
        type: MessageType.Email,
        client: { connect: { id: user.id } },
      },
    });

    // send mail
    const { ok } = await this.mailService
      .setMailProviderOptions(config.provider, config)
      .sendEmail(emailBuilder);
    if (ok) {
      await this.prisma.message.update({
        where: { id: message.id },
        data: {
          status: MessageStatus.Sent,
          updatedAt: moment().toDate(),
        },
      });
    }
  }
}
