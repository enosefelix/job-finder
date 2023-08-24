import { Injectable } from '@nestjs/common';
import { Category, Prisma, User } from '@prisma/client';
import { ROLE_TYPE } from '../common/interfaces/index';
import { PrismaService } from '../common/prisma/prisma.service';
import { UsersFilterDto } from './dto/get-users-filter.dto';
import { CrudService } from '../common/database/crud.service';
import { ProfileMapType } from './profile.maptype';
import * as moment from 'moment';
import { JobListingFilterDto } from 'src/job-listings/dto/job-listing-filter.dto';

@Injectable()
export class AdminService extends CrudService<
  Prisma.ProfileDelegate<Prisma.RejectOnNotFound>,
  ProfileMapType
> {
  constructor(private prisma: PrismaService) {
    super(prisma.profile);
  }

  async getAllUsers({
    cursor,
    direction,
    orderBy,
    size,
    ...dto
  }: UsersFilterDto): Promise<User[]> {
    const parsedQueryFilters = await this.parseQueryFilter(dto, [
      'email',
      'firstName',
      'lastName',
    ]);

    const args: Prisma.ProfileFindManyArgs = {
      where: {
        ...parsedQueryFilters,
        User: { role: { code: { not: ROLE_TYPE.ADMIN } } },
      },
      include: { User: true },
    };

    const data = await this.findManyPaginate(args, {
      cursor,
      direction,
      orderBy: orderBy || { createdAt: direction },
      size,
    });
    console.log('🚀 ~ file: admin.service.ts:47 ~ data:', data);
    return data;
  }

  async getUserById(id: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    const pwd = 'password';
    const { [pwd]: _, ...usr } = user;

    return {
      ...usr,
    };
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new Error('User not found');

    await this.prisma.user.delete({
      where: { id },
      include: { profile: true },
    });
  }

  async approveJobListing(id: string, user: User): Promise<void> {
    const userId = user.id;
    const jobListing = await this.getJobListingById(id);
    console.log(
      '🚀 ~ file: admin.service.ts:78 ~ approveJobListing ~ jobListing:',
      jobListing,
    );

    if (!jobListing) throw new Error('Job Listing not found');

    await this.prisma.jobListing.update({
      where: { id },
      data: {
        isApproved: true,
        updatedAt: moment().toISOString(),
        updatedBy: userId,
      },
    });
  }

  // async rejectJobListing(id: string): Promise<void> {}

  async deleteJobListing(id: string): Promise<void> {
    const jobListing = await this.getJobListingById(id);

    if (!jobListing) throw new Error('Job Listing not found');

    await this.prisma.jobListing.delete({
      where: { id },
      include: { jobApplications: true },
    });
  }

  async getJobListings({
    cursor,
    direction,
    orderBy,
    size,
    ...dto
  }: JobListingFilterDto) {
    const parsedQueryFilters = this.parseQueryFilter(dto, [
      'title',
      'industry',
      {
        key: 'location',
        where: (location) => ({
          location: {
            equals: location,
          },
        }),
      },
      {
        key: 'category',
        where: (category) => {
          return {
            category: {
              equals: category as Category,
            },
          };
        },
      },
    ]);

    const args: Prisma.JobListingFindManyArgs = {
      where: {
        ...parsedQueryFilters,
      },
      include: { jobApplications: true },
    };

    return this.findManyPaginate(args, {
      cursor,
      direction,
      orderBy: orderBy || { createdAt: direction },
      size,
    });
  }

  async getJobListingById(id: string): Promise<any> {
    const jobListing = await this.prisma.jobListing.findUnique({
      where: { id },
    });

    if (!jobListing) throw new Error('Job Listing not found');

    return jobListing;
  }
}
