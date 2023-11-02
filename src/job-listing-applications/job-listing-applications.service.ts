import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { JobListingApplicationsMapType } from './job-lisitng-applications.maptype';
import { PrismaService } from '@@/common/prisma/prisma.service';
import { UserJobListingApplicationDto } from './dto/get-user-joblisting-applications.dto';
import { AUTH_ERROR_MSGS } from '@@/common/interfaces';
import { CrudService } from '@@/common/database/crud.service';
import { AppUtilities } from '@@/app.utilities';

@Injectable()
export class JobListingApplicationsService extends CrudService<
  Prisma.JobListingApplicationsDelegate<Prisma.RejectOnNotFound>,
  JobListingApplicationsMapType
> {
  constructor(private prisma: PrismaService) {
    super(prisma.jobListingApplications);
  }
  async getMyApplications(
    { cursor, direction, orderBy, size, ...dto }: UserJobListingApplicationDto,
    user: User,
  ) {
    try {
      const foundUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!foundUser) {
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);
      }

      const parsedQueryFilters = await this.parseQueryFilter(dto, [
        'jobListing.title',
        'jobListing.industry',
        'jobListing.companyName',
      ]);

      const args: Prisma.JobListingApplicationsFindManyArgs = {
        where: {
          ...parsedQueryFilters,
          userId: user.id,
        },
        include: {
          jobListing: true,
        },
      };

      const jobApplication = await this.findManyPaginate(args, {
        cursor,
        direction,
        orderBy: orderBy || { createdAt: direction },
        size,
      });

      AppUtilities.addTimestamps(jobApplication);

      return jobApplication;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }
}
