import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobListing, Prisma, User } from '@prisma/client';
import {
  AUTH_ERROR_MSGS,
  Category,
  JOB_LISTING_ERROR,
  JOB_LISTING_STATUS,
  USER_STATUS,
} from '../common/interfaces/index';
import { PrismaService } from '../common/prisma/prisma.service';
import { UsersFilterDto } from './dto/get-users-filter.dto';
import { CrudService } from '../common/database/crud.service';
import { ProfileMapType } from './profile.maptype';
import * as moment from 'moment';
import { AdminJobListingFilterDto } from './dto/admin-job-listing.dto';
import { JobListingsService } from 'src/job-listings/job-listings.service';
import { AuthService } from 'src/auth/auth.service';
import { AppUtilities } from 'src/app.utilities';

@Injectable()
export class AdminService extends CrudService<
  Prisma.ProfileDelegate<Prisma.RejectOnNotFound>,
  ProfileMapType
> {
  constructor(
    private prisma: PrismaService,
    private jobListingService: JobListingsService,
    private authService: AuthService,
  ) {
    super(prisma.profile);
  }

  public async getJobListing(id: string): Promise<any> {
    const jobListing = await this.jobListingService.findUnique({
      where: { id },
    });

    if (!jobListing)
      throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);

    await AppUtilities.addTimestamps(jobListing);

    return jobListing;
  }

  async getAllUsers(
    { cursor, direction, orderBy, size, ...dto }: UsersFilterDto,
    user: User,
  ): Promise<User[]> {
    try {
      await this.authService.verifyUser(user);
      const parsedQueryFilters = await this.parseQueryFilter(dto, [
        'email',
        'firstName',
        'lastName',
        {
          key: 'status',
          where: (status) => {
            return {
              status: {
                equals: status as USER_STATUS,
              },
            };
          },
        },
      ]);

      const args: Prisma.ProfileFindManyArgs = {
        where: {
          ...parsedQueryFilters,
          email: { not: user.email },
        },
        select: { User: { include: { profile: true } } },
      };

      const dataMapperFn = (profile: any) => {
        if (profile?.User?.email) {
          delete profile?.User?.password;
          delete profile?.User?.token;
          delete profile?.User?.roleId;
          delete profile?.User?.lastLoginIp;
          delete profile?.User?.googleId;
        }
        return profile;
      };

      const data = await this.findManyPaginate(
        args,
        {
          cursor,
          direction,
          orderBy: orderBy || { createdAt: direction },
          size,
        },
        dataMapperFn,
      );
      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getUserById(id: string, adminUser: User): Promise<any> {
    try {
      await this.authService.verifyUser(adminUser);
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: { profile: true },
      });

      if (!user) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      const pwd = 'password';
      const tkn = 'token';
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [pwd]: _, [tkn]: __, ...usr } = user;

      return {
        ...usr,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getUserJobListing(id: string, adminUser: User) {
    try {
      await this.authService.verifyUser(adminUser);
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      const userJobListings = await this.prisma.jobListing.findMany({
        where: { createdBy: id },
        include: { jobApplications: true },
      });

      const pwd = 'password';
      const gId = 'googleId';
      const tkn = 'token';

      const { [pwd]: _, [gId]: __, [tkn]: ___, ...usr } = user;

      await AppUtilities.addTimestampBase(userJobListings);

      return { usr, jobListings: userJobListings };
    } catch (error) {
      console.log(error);
      console.log(error.message);
      throw new BadRequestException('An error occurred', error);
    }
  }

  async suspendUser(id: string, adminUser: User): Promise<void> {
    try {
      await this.authService.verifyUser(adminUser);
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      await this.prisma.user.update({
        where: { id },
        data: {
          status: USER_STATUS.SUSPENDED,
          updatedAt: moment().toISOString(),
          updatedBy: adminUser.id,
        },
      });
      await this.prisma.jobListing.updateMany({
        where: { createdBy: user.id, status: JOB_LISTING_STATUS.APPROVED },
        data: {
          status: JOB_LISTING_STATUS.PENDING,
          updatedBy: adminUser.id,
        },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteUser(id: string, adminUser: User): Promise<void> {
    try {
      await this.authService.verifyUser(adminUser);
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) throw new Error(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      await this.prisma.jobListingApplications.deleteMany({
        where: { createdBy: user.id },
      });

      await this.prisma.tags.deleteMany({ where: { createdBy: user.id } });

      await this.prisma.bookmark.deleteMany({ where: { createdBy: user.id } });

      await this.prisma.jobListing.deleteMany({
        where: { createdBy: user.id },
      });

      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async approveJobListing(id: string, user: User): Promise<JobListing> {
    try {
      await this.authService.verifyUser(user);
      await this.getJobListing(id);

      const approvedJob = await this.prisma.jobListing.update({
        where: { id },
        data: {
          status: JOB_LISTING_STATUS.APPROVED,
          updatedAt: moment().toISOString(),
          approvedBy: { connect: { id: user.id } },
          updatedBy: user.id,
          isClosed: false,
        },
      });

      return approvedJob;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async rejectJobListing(id: string, user: User): Promise<JobListing> {
    try {
      await this.authService.verifyUser(user);
      const userId = user.id;

      await this.getJobListing(id);

      const approvedJob = await this.prisma.jobListing.update({
        where: { id },
        data: {
          status: JOB_LISTING_STATUS.REJECTED,
          updatedAt: moment().toISOString(),
          updatedBy: userId,
          isClosed: true,
        },
      });

      return approvedJob;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteJobListing(id: string, user: User): Promise<void> {
    try {
      await this.authService.verifyUser(user);

      const jobListing = await this.getJobListingById(id, user);
      if (!jobListing)
        throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);

      await this.prisma.jobListing.delete({
        where: { id },
        include: { jobApplications: true },
      });

      return;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getJobListings(
    { ...dto }: AdminJobListingFilterDto,
    user: User,
  ): Promise<JobListing[]> {
    try {
      await this.authService.verifyUser(user);
      const jobListings = await this.jobListingService.getAllUserJobListings(
        'true',
        dto,
        user,
      );

      AppUtilities.addTimestamps(jobListings);

      return jobListings;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getJobListingById(id: string, user: User) {
    try {
      await this.authService.verifyUser(user);
      const jobListing = await this.prisma.jobListing.findUnique({
        where: { id },
      });

      if (!jobListing)
        throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);

      await AppUtilities.addTimestampBase(jobListing);

      return jobListing;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateJobListing(id: string, dto: any, user: User): Promise<void> {
    try {
      await this.authService.verifyUser(user);
      await this.jobListingService.updateJobListing(true, id, dto, user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createJobListing(dto: any, user: User) {
    await this.authService.verifyUser(user);
    return await this.jobListingService.createJobListing(true, dto, user);
  }
}
