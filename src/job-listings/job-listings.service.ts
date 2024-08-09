/* eslint-disable @typescript-eslint/no-unused-vars */
import { AdminJobListingFilterDto } from '@@/admin/dto/admin-job-listing.dto';
import { AuthService } from '@@/auth/auth.service';
import { UserJobListingDto } from '@@/user/dto/get-user-joblisting.dto';
import { CloudinaryService } from '@@cloudinary/cloudinary.service';
import { CrudService } from '@@common/database/crud.service';
import {
  AUTH_ERROR_MSGS,
  Category,
  ExperienceLevel,
  JOB_LISTING_ERROR,
  JOB_LISTING_STATUS,
  JobType,
  ResourceType,
} from '@@common/interfaces';
import { PrismaService } from '@@common/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  JobListing,
  JobListingApplications,
  Prisma,
  PrismaClient,
  User,
} from '@prisma/client';
import { AppUtilities } from '../app.utilities';
import { ApplyJobListingDto } from './dto/apply-joblisting.dto';
import { CreateJobListingDto } from './dto/create-job-listing.dto';
import { UpdateJobListingDto } from './dto/edit-job.dto';
import { JobListingFilterDto } from './dto/job-listing-filter.dto';
import { JobListingMapType } from './job-listing-maptype';

@Injectable()
export class JobListingsService extends CrudService<
  Prisma.JobListingDelegate<Prisma.RejectOnNotFound>,
  JobListingMapType
> {
  private readonly logger = new Logger(JobListingsService.name);
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private authService: AuthService,
  ) {
    super(prisma.jobListing);
  }

  async getJobListings({
    cursor,
    direction,
    orderBy,
    size,
    ...dto
  }: JobListingFilterDto): Promise<JobListing[]> {
    try {
      const parsedQueryFilters = await this.parseQueryFilter(dto, [
        'title',
        'industry',
        'companyName',
        {
          key: 'location',
          where: (location) => ({
            location: {
              contains: location,
              mode: 'insensitive',
            },
          }),
        },
        {
          key: 'industry',
          where: (industry) => ({
            industry: {
              contains: industry,
              mode: 'insensitive',
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
        {
          key: 'skills',
          where: (skills) => {
            return {
              skills: {
                has: skills,
              },
            };
          },
        },
      ]);

      const args: Prisma.JobListingFindManyArgs = {
        where: {
          ...parsedQueryFilters,
          status: JOB_LISTING_STATUS.APPROVED,
        },
        include: {
          jobApplications: {
            select: {
              userId: true,
              jobListingId: true,
              createdAt: true,
              createdBy: true,
              updatedAt: true,
              updatedBy: true,
            },
          },
          taggedUsers: { select: { taggedUser: true } },
          bookmarks: true,
          postedBy: { select: { id: true, email: true, status: true } },
          approvedBy: { select: { id: true, email: true, status: true } },
        },
      };

      const jobListings = await this.findManyPaginate(args, {
        cursor,
        direction,
        orderBy: orderBy || { createdAt: direction },
        size,
      });

      AppUtilities.addTimestamps(jobListings);

      return jobListings;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async getJobListingById(id: string): Promise<JobListing> {
    const jobListing = await this.prisma.jobListing.findFirst({
      where: { id, status: JOB_LISTING_STATUS.APPROVED },
      include: {
        jobApplications: {
          select: {
            user: {
              select: { profile: true },
            },
          },
        },
        taggedUsers: true,
        bookmarks: true,
        postedBy: { select: { id: true, email: true, status: true } },
        approvedBy: { select: { id: true, email: true, status: true } },
      },
    });

    if (!jobListing)
      throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);

    AppUtilities.addTimestampBase(jobListing);

    return jobListing;
  }

  async createJobListing(dto: CreateJobListingDto, user: User) {
    try {
      const foundUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!foundUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      const {
        title,
        jobResponsibilities,
        category,
        jobType,
        experienceLevel,
        skills,
        languages,
        ...rest
      } = dto;

      const createJobListing = await this.prisma.jobListing.create({
        data: {
          title,
          jobResponsibilities,
          ...rest,
          salary: rest.salary || '0',
          category: category as Category,
          jobType: jobType as JobType,
          experienceLevel: experienceLevel as ExperienceLevel,
          createdBy: user.id,
          postedBy: { connect: { email: user.email } },
          skills,
          languages,
          status: JOB_LISTING_STATUS.APPROVED,
        },
      });

      return createJobListing;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async uploadToCloud(resume: any, coverLetter: any, user: User, url: any) {
    let uploadResume = null;
    let uploadCoverLetter = null;
    if (resume) {
      uploadResume = this.cloudinaryService.uploadResume(
        resume,
        ResourceType.Raw,
        url,
        user.id,
      );
    }

    if (coverLetter) {
      uploadCoverLetter = this.cloudinaryService.uploadCoverLetter(
        coverLetter,
        ResourceType.Raw,
        url,
        user.id,
      );
    }

    let [resumeUrl, coverLetterUrl] = await Promise.all([
      uploadResume,
      uploadCoverLetter,
    ]);

    resumeUrl = resumeUrl?.secure_url || '';
    coverLetterUrl = coverLetterUrl?.secure_url || '';
    return { resumeUrl, coverLetterUrl };
  }

  async uploadOrCreateJobListing(
    resumeUrl: string,
    coverLetterUrl: string,
    possibleStartDate: any,
    jobListing: JobListing,
    user: User,
    id: string,
  ) {
    const findJobApplication =
      await this.prisma.jobListingApplications.findFirst({
        where: { userId: user.id, jobListingId: id },
      });

    const jobApplicationData = {
      resume: resumeUrl,
      coverLetter: coverLetterUrl,
      possibleStartDate,
      jobListing: { connect: { id: jobListing.id } },
      user: { connect: { id: user.id } },
      createdBy: user.id,
    };

    if (!findJobApplication) {
      return await this.prisma.jobListingApplications.create({
        data: jobApplicationData,
        include: {
          user: {
            select: { profile: true },
          },
          jobListing: true,
        },
      });
    }
    return await this.prisma.jobListingApplications.update({
      where: { id: findJobApplication.id },
      data: jobApplicationData,
      include: {
        user: {
          select: { profile: true },
        },
        jobListing: true,
      },
    });
  }

  async apply(
    id: string,
    user: User,
    applyDto: ApplyJobListingDto,
    files: {
      resume?: Express.Multer.File[];
      coverLetter?: Express.Multer.File[];
    },
    req: any,
  ): Promise<JobListingApplications | any> {
    return this.prisma.$transaction(async (prismaClient: PrismaClient) => {
      try {
        const url = req.url;
        const { possibleStartDate } = applyDto;
        const { resume, coverLetter } = files;

        const jobListing = await prismaClient.jobListing.findFirst({
          where: {
            id,
            status: JOB_LISTING_STATUS.APPROVED,
          },
        });

        if (!jobListing) throw new NotFoundException('Job Listing not found');

        this.logger.debug('Saving resume and cover letter to cloud...');
        const { resumeUrl, coverLetterUrl } = await this.uploadToCloud(
          resume,
          coverLetter,
          user,
          url,
        );
        this.logger.debug('Files saved to cloud successfully');

        const apply = await this.uploadOrCreateJobListing(
          resumeUrl,
          coverLetterUrl,
          possibleStartDate,
          jobListing,
          user,
          id,
        );

        return apply;
      } catch (error) {
        console.log(error);
        return error.message;
      }
    });
  }

  async updateJobListing(
    id: string,
    dto: UpdateJobListingDto,
    user: User,
  ): Promise<JobListing> {
    try {
      const {
        title,
        jobResponsibilities,
        category,
        jobType,
        experienceLevel,
        ...rest
      } = dto;

      const foundUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!foundUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      const jobListing = await this.prisma.jobListing.findUnique({
        where: { id },
      });

      if (!jobListing)
        throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);

      if (jobListing.status === JOB_LISTING_STATUS.APPROVED)
        throw new BadRequestException('Cannot edit an approved job listing');

      if (foundUser.id !== jobListing.createdBy)
        throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

      const updateJobListing = await this.prisma.jobListing.update({
        where: { id },
        data: {
          title,
          jobResponsibilities,
          ...rest,
          category: category as Category,
          jobType: jobType as JobType,
          experienceLevel: experienceLevel as ExperienceLevel,
          updatedBy: foundUser.id,
          status: JOB_LISTING_STATUS.PENDING,
        },
      });

      return updateJobListing;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async deleteJobListing(id: string, user: User): Promise<void> {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) {
      throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);
    }

    const jobListing = await this.prisma.jobListing.findFirst({
      where: { id, createdBy: user.id },
    });

    if (!jobListing) {
      throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);
    }

    try {
      await this.prisma.$transaction(async (prismaClient: PrismaClient) => {
        const prismaDeletePromises = [];

        // Delete related data in a single transaction
        prismaDeletePromises.push(
          prismaClient.jobListingApplications.deleteMany({
            where: { jobListingId: id },
          }),
          prismaClient.tags.deleteMany({
            where: { jobListingId: id },
          }),
          prismaClient.bookmark.deleteMany({
            where: { jobListingId: id },
          }),
        );

        const jobListingApplications =
          await prismaClient.jobListingApplications.findMany({
            where: { jobListingId: id },
          });

        this.logger.debug('Deleting files from cloud...');
        for (const jobListingApplication of jobListingApplications) {
          await this.cloudinaryService.deleteFiles([
            jobListingApplication.resume,
            jobListingApplication.coverLetter,
          ]);
        }
        this.logger.debug('Files deleted from cloud successfully');

        prismaDeletePromises.push(
          prismaClient.jobListing.delete({
            where: { id },
          }),
        );

        // Wait for all delete operations to complete
        await Promise.all(prismaDeletePromises);
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }
  async getAllUserJobListings(
    { cursor, direction, orderBy, size, ...dto }: UserJobListingDto,
    user: User,
  ): Promise<JobListing[]> {
    try {
      const foundUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!foundUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      const parsedQueryFilters = this.parseQueryFilter(dto, [
        'title',
        'industry',
        {
          key: 'industry',
          where: (industry) => ({
            industry: {
              contains: industry,
              mode: 'insensitive',
            },
          }),
        },
        {
          key: 'location',
          where: (location) => {
            return {
              location: {
                contains: location,
                mode: 'insensitive',
              },
            };
          },
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
        {
          key: 'status',
          where: (status) => {
            return {
              status: {
                equals: status as JOB_LISTING_STATUS,
              },
            };
          },
        },
        {
          key: 'skills',
          where: (skills) => {
            return {
              skills: {
                has: skills,
              },
            };
          },
        },
      ]);

      const args: Prisma.JobListingFindManyArgs = {
        where: { ...parsedQueryFilters, createdBy: user.id },
        include: { jobApplications: true, bookmarks: true, taggedUsers: true },
      };

      const jobListings = this.findManyPaginate(args, {
        cursor,
        direction,
        orderBy: orderBy || { createdAt: direction },
        size,
      });

      AppUtilities.addTimestamps(jobListings);

      return jobListings;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async getJobListingsAdmin(
    { cursor, direction, orderBy, size, ...dto }: AdminJobListingFilterDto,
    user: User,
  ): Promise<JobListing[]> {
    try {
      await this.authService.verifyUser(user);
      const foundUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!foundUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      const parsedQueryFilters = this.parseQueryFilter(dto, [
        'title',
        'industry',
        'companyName',
        {
          key: 'industry',
          where: (industry) => ({
            industry: {
              contains: industry,
              mode: 'insensitive',
            },
          }),
        },
        {
          key: 'location',
          where: (location) => {
            return {
              location: {
                contains: location,
                mode: 'insensitive',
              },
            };
          },
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
        {
          key: 'status',
          where: (status) => {
            return {
              status: {
                equals: status as JOB_LISTING_STATUS,
              },
            };
          },
        },
        {
          key: 'myJobListings',
          where: (myJobListings) => {
            return myJobListings === 'true' ? { createdBy: user.id } : null;
          },
        },
        {
          key: 'skills',
          where: (skills) => {
            return {
              skills: {
                has: skills,
              },
            };
          },
        },
      ]);

      const args: Prisma.JobListingFindManyArgs = {
        where: { ...parsedQueryFilters },
        include: {
          jobApplications: true,
          bookmarks: true,
          taggedUsers: true,
          postedBy: { select: { id: true, email: true, status: true } },
          approvedBy: { select: { id: true, email: true, status: true } },
        },
      };

      const jobListings = await this.findManyPaginate(args, {
        cursor,
        direction,
        orderBy: orderBy || { updatedAt: direction },
        size,
      });

      AppUtilities.addTimestamps(jobListings);

      return jobListings;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }
}
