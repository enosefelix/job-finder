import { MailerModule } from '@nestjs-modules/mailer';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './messaging-mail.service';
import { MessagingService } from './messaging.service';
import { MailProviderFactory } from './providers/mail-provider-factory';
import { CacheService } from '@@/common/cache/cache.service';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => config.get('smtp'),
    }),
  ],
  providers: [MailProviderFactory, MailService, MessagingService, CacheService],
  exports: [MailService, MessagingService],
})
export class MessagingModule {}
