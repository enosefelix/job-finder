/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JobListingMapType } from './job-listing-maptype';
import {
  JobListing,
  JobListingApplications,
  Prisma,
  PrismaClient,
  User,
} from '@prisma/client';
import { CrudService } from '@@common/database/crud.service';
import { PrismaService } from '@@common/prisma/prisma.service';
import { JobListingFilterDto } from './dto/job-listing-filter.dto';
import { CreateJobListingDto } from './dto/create-job-listing.dto';
import {
  AUTH_ERROR_MSGS,
  Category,
  ExperienceLevel,
  JOB_LISTING_ERROR,
  JOB_LISTING_STATUS,
  JobType,
  ResourceType,
} from '@@common/interfaces';
import { ApplyJobListingDto } from './dto/apply-joblisting.dto';
import { CloudinaryService } from '@@cloudinary/cloudinary.service';
import { UpdateJobListingDto } from './dto/edit-job.dto';
import { AppUtilities } from '../app.utilities';
import { AdminJobListingFilterDto } from '@@/admin/dto/admin-job-listing.dto';
import { AuthService } from '@@/auth/auth.service';
import { UserJobListingDto } from '@@/user/dto/get-user-joblisting.dto';

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
          status: JOB_LISTING_STATUS.PENDING,
        },
      });

      return createJobListing;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
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
    try {
      const url = req.url;
      const { possibleStartDate } = applyDto;
      const { resume, coverLetter } = files;

      const jobListing = await this.prisma.jobListing.findFirst({
        where: {
          id,
          status: JOB_LISTING_STATUS.APPROVED,
        },
      });

      if (!jobListing) throw new NotFoundException('Job Listing not found');

      this.logger.debug('Saving resume and cover letter to cloud...');
      const uploadResume: any = resume
        ? await this.cloudinaryService.uploadResume(
            resume,
            ResourceType.Raw,
            url,
            user.id,
          )
        : null;
      const uploadCoverLetter: any = coverLetter
        ? await this.cloudinaryService.uploadCoverLetter(
            coverLetter,
            ResourceType.Raw,
            url,
            user.id,
          )
        : null;
      let [resumeUrl, coverLetterUrl] = await Promise.all([
        uploadResume,
        uploadCoverLetter,
      ]);

      resumeUrl = resumeUrl?.public_id || '';
      coverLetterUrl = coverLetterUrl?.public_id || '';

      this.logger.debug('Files saved to the cloud successfully');

      const jobApplication = await this.prisma.jobListingApplications.create({
        data: {
          resume: resumeUrl,
          coverLetter: coverLetterUrl,
          possibleStartDate,
          jobListing: { connect: { id: jobListing.id } },
          user: { connect: { id: user.id } },
          createdBy: user.id,
        },
        include: {
          user: {
            select: { profile: true },
          },
          jobListing: true,
        },
      });

      return {
        message: 'Job Listing applied successfully!',
        jobApplication,
      };
    } catch (error) {
      return error.message;
      throw new BadRequestException(error.message);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  // async downloadFiles(id: string): Promise<string> {
  //   try {
  //     const promises = [];
  //     const jobListingApplication =
  //       await this.prisma.jobListingApplications.findUnique({ where: { id } });

  //     if (!jobListingApplication)
  //       throw new NotFoundException(JOB_APPLICATION_ERORR.JOB_APPLICATION);

  //     const resume = jobListingApplication.resume;
  //     const coverLetter = jobListingApplication.coverLetter;

  //     promises.push(this.cloudinaryService.downloadFile(resume));
  //     promises.push(this.cloudinaryService.downloadFile(coverLetter));

  //     Promise.all(promises);

  //     return `...downloading ${resume} and ${coverLetter}`;
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  // async downloadFiles(id: string): Promise<any> {
  //   try {
  //     const jobListingApplication =
  //       await this.prisma.jobListingApplications.findUnique({ where: { id } });

  //     if (!jobListingApplication)
  //       throw new NotFoundException(JOB_APPLICATION_ERORR.JOB_APPLICATION);

  //     const resumeUrl = jobListingApplication.resume;
  //     const coverLetterUrl = jobListingApplication.coverLetter;

  //     const [resume, coverLetter]: any = await Promise.all([
  //       await this.cloudinaryService.downloadFile(resumeUrl),
  //       await this.cloudinaryService.downloadFile(coverLetterUrl),
  //     ]);
  //     return {
  //       resume: resume.secure_url,
  //       coverLetter: coverLetter.secure_url,
  //     };
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async updateJobListing(
    id: string,
    dto: UpdateJobListingDto,
    user: User,
  ): Promise<JobListing> {
    try {
      const { title, jobResponsibilities, category, ...rest } = dto;

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
          updatedBy: foundUser.id,
          status: JOB_LISTING_STATUS.PENDING,
        },
      });

      return updateJobListing;
    } catch (error) {
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
        orderBy: orderBy || { createdAt: direction },
        size,
      });

      AppUtilities.addTimestamps(jobListings);

      return jobListings;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
