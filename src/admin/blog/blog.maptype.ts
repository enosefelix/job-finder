import { Prisma } from '@prisma/client';
import { CrudMapType } from '@@common/database/crud.service';

export class BlogMapType implements CrudMapType {
  aggregate: Prisma.BlogAggregateArgs;
  count: Prisma.BlogCountArgs;
  create: Prisma.BlogCreateArgs;
  delete: Prisma.BlogDeleteArgs;
  deleteMany: Prisma.BlogDeleteManyArgs;
  findFirst: Prisma.BlogFindFirstArgs;
  findMany: Prisma.BlogFindManyArgs;
  findUnique: Prisma.BlogFindUniqueArgs;
  update: Prisma.BlogUpdateArgs;
  updateMany: Prisma.BlogUpdateManyArgs;
  upsert: Prisma.BlogUpsertArgs;
}
