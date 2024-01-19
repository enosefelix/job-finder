import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaClientManager implements OnModuleDestroy {
  private prismaClient: PrismaClient;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  getPrismaClient(poolSize = 5): PrismaClient {
    if (!this.prismaClient) {
      this.prismaClient = new PrismaClient({
        log: ['error'],
        datasources: {
          db: {
            url: `${process.env.DATABASEURL}&connection_limit=${poolSize}`,
          },
        },
      });
    }

    return this.prismaClient;
  }

  async onModuleDestroy() {
    if (this.prismaClient) {
      await this.prismaClient.$disconnect();
    }
  }
}
