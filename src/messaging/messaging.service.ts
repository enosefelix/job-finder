import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailBuilder } from './builder/email-builder';
import { MailProviders, TEMPLATE } from './interfaces';
import { MailService } from './messaging-mail.service';
import { PrismaClient } from '@prisma/client';
import { MessageStatus, MessageType } from '@@common/interfaces';
import moment from 'moment';
import { CacheService } from '@@/common/cache/cache.service';
import { CacheKeysEnums } from '@@/common/cache/cache.enums';
import { v4 } from 'uuid';
import { AppUtilities } from '@@/app.utilities';

@Injectable()
export class MessagingService {
  private senderEmail: string;

  constructor(
    private configService: ConfigService,
    private mailService: MailService,
    private cacheService: CacheService,
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

  public async sendUpdateEmail({
    email,
    templateName = TEMPLATE.RESET_MAIL_ADMIN,
  }) {
    // get message template from db
    const prismaClient = new PrismaClient();

    const foundUser = await prismaClient.user.findUnique({
      where: { email },
      include: { profile: true, role: true },
    });

    const emailTemplate = await prismaClient.messageTemplate.findFirst({
      where: {
        code:
          templateName === TEMPLATE.RESET_MAIL_ADMIN
            ? 'reset-password-admin'
            : 'reset-password-user',
      },
    });

    if (!emailTemplate)
      throw new BadRequestException('Email template has not been setup');

    const config = await this.getAppEmailConfig();

    const requestId = v4();

    await this.cacheService.set(
      CacheKeysEnums.REQUESTS + requestId,
      {
        email,
        fullName: `${foundUser.profile.firstName} ${foundUser.profile.lastName}`,
        userId: foundUser.id,
        role: foundUser?.role?.code,
      },
      parseInt(process.env.PASSWORD_RESET_EXPIRES),
    );

    const fullName = `${foundUser.profile.firstName} ${foundUser.profile.lastName}`;

    const encodeReqId = await AppUtilities.encode(requestId);

    const resetUrlUser = new URL(
      `${process.env.FRONTEND_URL_USER}/pages/auth/reset-password/${encodeReqId}`,
    );

    const resetUrlAdmin = new URL(
      `${process.env.FRONTEND_URL_ADMIN}/pages/auth/reset-password/${encodeReqId}`,
    );

    const findImage = await prismaClient.mailImage.findFirst({
      where: { code: 'mail-logo' },
    });

    if (!findImage) throw new BadRequestException('Image logo not setup');

    const { logo } = findImage;

    const emailBuilder = new EmailBuilder()
      .useTemplate(emailTemplate, {
        fullName,
        email,
        resetUrl:
          templateName === TEMPLATE.RESET_MAIL_ADMIN
            ? resetUrlAdmin
            : resetUrlUser,
        imagePath: AppUtilities.decode(logo),
      })
      .addRecipients([email]);

    // add sender details from config settings
    emailBuilder.addFrom(config.senderAddress, config.senderName);

    // create message in base message table
    const message = await prismaClient.message.create({
      data: {
        bindings: {
          sender: this.senderEmail,
          recipient: email,
        },
        template: { connect: { id: emailTemplate.id } },
        type: MessageType.Email,
        client: { connect: { id: foundUser.id } },
      },
    });

    // send mail
    const { ok } = await this.mailService
      .setMailProviderOptions(config.provider, config)
      .sendEmail(emailBuilder);
    if (ok) {
      await prismaClient.message.update({
        where: { id: message.id },
        data: {
          status: MessageStatus.Sent,
          updatedAt: moment().toDate(),
        },
      });
    }
  }
}
