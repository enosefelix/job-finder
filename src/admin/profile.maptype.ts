import { Prisma } from '@prisma/client';
import { CrudMapType } from '@@common/database/crud.service';

export class ProfileMapType implements CrudMapType {
  aggregate: Prisma.ProfileAggregateArgs;
  count: Prisma.ProfileCountArgs;
  create: Prisma.ProfileCreateArgs;
  delete: Prisma.ProfileDeleteArgs;
  deleteMany: Prisma.ProfileDeleteManyArgs;
  findFirst: Prisma.ProfileFindFirstArgs;
  findMany: Prisma.ProfileFindManyArgs;
  findUnique: Prisma.ProfileFindUniqueArgs;
  update: Prisma.ProfileUpdateArgs;
  updateMany: Prisma.ProfileUpdateManyArgs;
  upsert: Prisma.ProfileUpsertArgs;
}
