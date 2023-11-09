import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaClientManager implements OnModuleDestroy {
  private static prismaClient: PrismaClient;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  getPrismaClient(poolSize = 2): PrismaClient {
    if (!PrismaClientManager.prismaClient) {
      PrismaClientManager.prismaClient = new PrismaClient({
        log: ['error'],
        datasources: {
          db: {
            url: `${process.env.DATABASEURL}&connection_limit=${poolSize}`,
          },
        },
      });
    }

    return PrismaClientManager.prismaClient;
  }

  async onModuleDestroy() {
    PrismaClientManager.prismaClient.$disconnect();
  }
}
