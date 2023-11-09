import { FactoryProvider, Module, Scope } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { PrismaClientManager } from './prisma-client-manager';
import { PrismaService } from '../prisma/prisma.service';
import { RequestWithUser } from '../interfaces';

const tenantPrismaClientProvider: FactoryProvider<Promise<PrismaClient>> = {
  provide: PrismaClient,
  scope: Scope.REQUEST,
  inject: [REQUEST, PrismaClientManager],
  useFactory: async (
    request: RequestWithUser,
    manager: PrismaClientManager,
  ) => {
    const user = request.user?.userId;
    if (!user) {
      throw new Error('User not found');
    }
    const prismaClient = manager.getPrismaClient();
    await prismaClient.$connect();
    return prismaClient;
  },
};

@Module({
  imports: [ConfigModule],
  providers: [
    PrismaClient,
    PrismaClientManager,
    PrismaService,
    tenantPrismaClientProvider,
  ],
  exports: [
    PrismaClient,
    PrismaClientManager,
    PrismaService,
    tenantPrismaClientProvider,
  ],
})
export class DatabaseModule {}
