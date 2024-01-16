import { Injectable } from '@nestjs/common';
import nodemailer, { SentMessageInfo, Transporter } from 'nodemailer';
import SMTPConnection from 'nodemailer/lib/smtp-connection';
import { MailProvider, MailProviders, SendMailOptions } from '../../interfaces';

@Injectable()
export class SmtpMailProvider implements MailProvider {
  private transporter: Transporter;

  constructor(config: SMTPConnection.Options) {
    this.transporter = nodemailer.createTransport(config);
  }

  async sendMail(data: SendMailOptions): Promise<SentMessageInfo> {
    if (!this.transporter) {
      throw new Error('Method not implemented.');
    }
    const raw = await this.transporter.sendMail({
      from: data.from,
      messageId: data.ref,
      html: data.body,
      to: data.to,
      subject: data.subject,
      attachments: data.attachments,
    });

    return {
      id: raw.messageId,
      timestamp: new Date().toDateString(),
      raw,
    };
  }

  get id() {
    return MailProviders.Smtp;
  }
}
