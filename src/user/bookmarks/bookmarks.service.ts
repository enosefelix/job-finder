import { CrudService } from '@@/common/database/crud.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { BookmarksMapType } from './bookmarks.maptype';
import { PrismaService } from '@@/common/prisma/prisma.service';
import { AppUtilities } from '@@/app.utilities';
import { GetBookmarkDto } from './dto/get-bookmarks.dto';

@Injectable()
export class BookmarksService extends CrudService<
  Prisma.BookmarkDelegate<Prisma.RejectOnNotFound>,
  BookmarksMapType
> {
  constructor(private prisma: PrismaService) {
    super(prisma.bookmark);
  }

  async getMyBookmarks(
    { cursor, direction, size, orderBy, ...dto }: GetBookmarkDto,
    user: User,
  ) {
    try {
      const parsedQueryFilters = await this.parseQueryFilter(dto, [
        'jobListing.title',
        'jobListing.industry',
        'jobListing.companyName',
      ]);
      const args: Prisma.BookmarkFindManyArgs = {
        where: { ...parsedQueryFilters, userId: user.id },
        include: { jobListing: true },
      };

      const bookmarks = await this.findManyPaginate(args, {
        cursor,
        direction,
        orderBy: orderBy || { createdAt: direction },
        size,
      });

      AppUtilities.addTimestamps(bookmarks);
      return bookmarks;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }
}
