import { CacheService } from '@@/common/cache/cache.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './messaging-mail.service';
import { MessagingService } from './messaging.service';
import { MailProviderFactory } from './providers/mail-provider-factory';
import { MessagingQueueConsumer } from './queue/consumer';
import { MessagingQueueProducer } from './queue/producer';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => config.get('smtp'),
    }),
  ],
  providers: [
    MailProviderFactory,
    MailService,
    MessagingService,
    CacheService,
    MessagingQueueConsumer,
    MessagingQueueProducer,
  ],
  exports: [MailService, MessagingService, MessagingQueueProducer],
})
export class MessagingModule {}
