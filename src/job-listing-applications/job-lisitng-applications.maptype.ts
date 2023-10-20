import { Prisma } from '@prisma/client';
import { CrudMapType } from '@@common/database/crud.service';

export class JobListingApplicationsMapType implements CrudMapType {
  aggregate: Prisma.JobListingApplicationsAggregateArgs;
  count: Prisma.JobListingApplicationsCountArgs;
  create: Prisma.JobListingApplicationsCreateArgs;
  delete: Prisma.JobListingApplicationsDeleteArgs;
  deleteMany: Prisma.JobListingApplicationsDeleteManyArgs;
  findFirst: Prisma.JobListingApplicationsFindFirstArgs;
  findMany: Prisma.JobListingApplicationsFindManyArgs;
  findUnique: Prisma.JobListingApplicationsFindUniqueArgs;
  update: Prisma.JobListingApplicationsUpdateArgs;
  updateMany: Prisma.JobListingApplicationsUpdateManyArgs;
  upsert: Prisma.JobListingApplicationsUpsertArgs;
}
