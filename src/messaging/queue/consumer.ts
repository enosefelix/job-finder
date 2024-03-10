import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Process, Processor } from '@nestjs/bull';
import { ISendEmail, JOBS, QUEUE } from '../interfaces';
import { QueueProcessor } from '@@/common/interfaces/queue';
import { MessagingService } from '../messaging.service';

@Processor(QUEUE)
export class MessagingQueueConsumer extends QueueProcessor {
  protected logger: Logger;

  constructor(private mailingService: MessagingService) {
    super();
    this.logger = new Logger(MessagingQueueConsumer.name);
  }

  @Process({ name: JOBS.QUEUE_RESET_TOKEN_EMAIL })
  async queueResetTokenEmail({ data }: Job<ISendEmail>) {
    await this.mailingService.sendUpdateEmail(data.email, data.templateName);
  }
}
