import sgMail, { MailService } from '@sendgrid/mail';
import { SentMessageInfo } from 'nodemailer';
import {
  MailProvider,
  MailProviders,
  SendGridConfig,
  SendMailOptions,
} from '../../interfaces';

export class SendGridMailProvider implements MailProvider {
  private mailer: MailService;

  constructor(config: SendGridConfig) {
    this.mailer = sgMail;
    this.mailer.setApiKey(config.apiKey);
  }

  async sendMail(data: SendMailOptions): Promise<SentMessageInfo> {
    const [raw] = await this.mailer.send({
      from: data.from,
      html: data.body,
      to: data.to,
      subject: data.subject,
      attachments: data.attachments,
    });

    return {
      id: (raw.body as any).id,
      raw: raw.body,
    };
  }

  get id() {
    return MailProviders.SendGrid;
  }
}
