import { Prisma } from '@prisma/client';
import { CrudMapType } from '../common/database/crud.service';

export class JobListingMapType implements CrudMapType {
  aggregate: Prisma.JobListingAggregateArgs;
  count: Prisma.JobListingCountArgs;
  create: Prisma.JobListingCreateArgs;
  delete: Prisma.JobListingDeleteArgs;
  deleteMany: Prisma.JobListingDeleteManyArgs;
  findFirst: Prisma.JobListingFindFirstArgs;
  findMany: Prisma.JobListingFindManyArgs;
  findUnique: Prisma.JobListingFindUniqueArgs;
  update: Prisma.JobListingUpdateArgs;
  updateMany: Prisma.JobListingUpdateManyArgs;
  upsert: Prisma.JobListingUpsertArgs;
}
