import { Prisma } from '@prisma/client';
import { CrudMapType } from '@@common/database/crud.service';

export class BookmarksMapType implements CrudMapType {
  aggregate: Prisma.BookmarkAggregateArgs;
  count: Prisma.BookmarkCountArgs;
  create: Prisma.BookmarkCreateArgs;
  delete: Prisma.BookmarkDeleteArgs;
  deleteMany: Prisma.BookmarkDeleteManyArgs;
  findFirst: Prisma.BookmarkFindFirstArgs;
  findMany: Prisma.BookmarkFindManyArgs;
  findUnique: Prisma.BookmarkFindUniqueArgs;
  update: Prisma.BookmarkUpdateArgs;
  updateMany: Prisma.BookmarkUpdateManyArgs;
  upsert: Prisma.BookmarkUpsertArgs;
}
