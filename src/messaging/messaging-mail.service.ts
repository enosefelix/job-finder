import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailBuilder } from './builder/email-builder';
import {
  MailProvider,
  MailProviders,
  SendGridConfig,
  SmtpConfig,
} from './interfaces';
import { MailProviderFactory } from './providers/mail-provider-factory';

@Injectable()
export class MailService {
  private logger = new Logger(MailService.name);
  private mailerService: MailProvider;

  constructor(
    mailerService: MailerService,
    private mailProviderFactory: MailProviderFactory,
  ) {
    this.mailerService = mailerService;
  }

  public setMailProviderOptions(
    provider: MailProviders,
    options: SmtpConfig | SendGridConfig,
  ) {
    this.mailerService = this.mailProviderFactory.provide(provider, options);
    return this;
  }

  async sendEmail(emailBuilder: EmailBuilder) {
    this.logger.log('-> sending email...');
    const mailDlvr = await this.mailerService.sendMail(emailBuilder.build());
    this.logger.log('-> done sending email...');

    return { ok: true, raw: mailDlvr };
  }
}
