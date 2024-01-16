import { Injectable, NotAcceptableException } from '@nestjs/common';
import {
  MailProvider,
  MailProviders,
  SendGridConfig,
  SmtpConfig,
} from '../interfaces';
import { SendGridMailProvider } from './mail/sendgrid';
import { SmtpMailProvider } from './mail/smtp';

@Injectable()
export class MailProviderFactory {
  public provide(
    provider: MailProviders,
    config: SmtpConfig | SendGridConfig,
  ): MailProvider {
    switch (provider) {
      case MailProviders.Smtp: {
        const { authPassword, authUser, ...smtpConfig } = config as SmtpConfig;
        return new SmtpMailProvider({
          ...smtpConfig,
          auth: { user: authUser, pass: authPassword },
        });
      }
      case MailProviders.SendGrid:
        return new SendGridMailProvider(config as SendGridConfig);
      default:
        throw new NotAcceptableException(
          'Mail provider not available at the moment!',
        );
    }
  }
}
