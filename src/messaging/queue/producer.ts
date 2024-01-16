import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ISendEmail, JOBS, QUEUE } from '../interfaces';
import { JobOptions, Queue } from 'bull';

@Injectable()
export class MessagingQueueProducer {
  constructor(
    @InjectQueue(QUEUE)
    private readonly messagingQueue: Queue,
  ) {}

  async queueResetTokenEmail(data: ISendEmail) {
    await this.addToQueue(JOBS.QUEUE_RESET_TOKEN_EMAIL, data, {
      removeOnComplete: true,
    });
  }

  private async addToQueue(jobName: JOBS, data: any, opts?: JobOptions) {
    return this.messagingQueue.add(jobName, data, opts);
  }
}
