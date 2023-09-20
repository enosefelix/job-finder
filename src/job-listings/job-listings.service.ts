import {
  BadRequestException,
  ForbiddenException,
  Injectable,
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
import { CrudService } from '../common/database/crud.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { JobListingFilterDto } from './dto/job-listing-filter.dto';
import { CreateJobListingDto } from './dto/create-job-listing.dto';
import {
  AUTH_ERROR_MSGS,
  Category,
  ExperienceLevel,
  JOB_APPLICATION_ERORR,
  JOB_LISTING_ERROR,
  JOB_LISTING_STATUS,
  JobType,
  ResourceType,
} from '../common/interfaces';
import { ApplyJobListingDto } from './dto/apply-joblisting.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateJobListingDto } from './dto/edit-job.dto';
import { AppUtilities } from '../app.utilities';

@Injectable()
export class JobListingsService extends CrudService<
  Prisma.JobListingDelegate<Prisma.RejectOnNotFound>,
  JobListingMapType
> {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
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
          jobApplications: true,
          taggedUsers: { select: { taggedUser: true } },
          bookmarks: true,
        },
      };

      const jobListings = await this.findManyPaginate(args, {
        cursor,
        direction,
        orderBy: orderBy || { orderBy: dto.skills },
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
      include: { jobApplications: true },
    });

    if (!jobListing)
      throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);

    AppUtilities.addTimestampBase(jobListing);

    return jobListing;
  }

  async createJobListing(dto: CreateJobListingDto, user: User) {
    try {
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
      const { availability } = applyDto;
      const { resume, coverLetter } = files;

      const jobListing = await this.prisma.jobListing.findFirst({
        where: {
          id,
          status: JOB_LISTING_STATUS.APPROVED,
        },
      });

      if (!jobListing) throw new NotFoundException('Job Listing not found');

      if (jobListing.createdBy === user.id)
        throw new BadRequestException('Cannot apply to your Job Listing');

      const uploadResume: any = resume
        ? await this.cloudinaryService.uploadFile(resume, ResourceType.Raw, url)
        : null;
      const uploadCoverLetter: any = coverLetter
        ? await this.cloudinaryService.uploadFile(
            coverLetter,
            ResourceType.Raw,
            url,
          )
        : null;
      let [resumePubId, coverLetterPubId] = await Promise.all([
        uploadResume,
        uploadCoverLetter,
      ]);

      resumePubId = resumePubId?.public_id || '';
      coverLetterPubId = coverLetterPubId?.public_id || '';

      return await this.prisma.jobListingApplications.create({
        data: {
          resume: resumePubId,
          coverLetter: coverLetterPubId,
          availability,
          jobListing: { connect: { id: jobListing.id } },
          user: { connect: { id: user.id } },
          createdBy: user.id,
        },
      });
    } catch (error) {
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
  //     console.log(
  //       '🚀 ~ file: job-listings.service.ts:286 ~ downloadFiles ~ resume:',
  //       resume,
  //     );
  //     const coverLetter = jobListingApplication.coverLetter;
  //     console.log(
  //       '🚀 ~ file: job-listings.service.ts:288 ~ downloadFiles ~ coverLetter:',
  //       coverLetter,
  //     );

  //     promises.push(this.cloudinaryService.downloadFile(resume));
  //     promises.push(this.cloudinaryService.downloadFile(coverLetter));

  //     Promise.all(promises);

  //     return `...downloading ${resume} and ${coverLetter}`;
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

  async downloadFiles(id: string): Promise<any> {
    try {
      const jobListingApplication =
        await this.prisma.jobListingApplications.findUnique({ where: { id } });

      if (!jobListingApplication)
        throw new NotFoundException(JOB_APPLICATION_ERORR.JOB_APPLICATION);

      const resumePubId = jobListingApplication.resume;
      const coverLetterPubId = jobListingApplication.coverLetter;

      const [resume, coverLetter]: any = await Promise.all([
        await this.cloudinaryService.downloadFile(resumePubId),
        await this.cloudinaryService.downloadFile(coverLetterPubId),
      ]);
      return {
        resume: resume.secure_url,
        coverLetter: coverLetter.secure_url,
      };
    } catch (error) {
      console.log(
        '🚀 ~ file: job-listings.service.ts:353 ~ downloadFiles ~ error:',
        error,
      );
      throw new BadRequestException(error.message);
    }
  }

  // async downloadFile(url: string, response: Response) {
  //   // const axios = require('axios'); // You can use Axios for HTTP requests

  //   try {
  //     // Fetch the file content from the given URL
  //     const fileResponse = await axios.get(url, {
  //       responseType: 'arraybuffer',
  //     });

  //     // Set the appropriate headers for the response
  //     response.setHeader('Content-Type', 'application/octet-stream');
  //     response.setHeader(
  //       'Content-Disposition',
  //       'attachment; filename="downloaded-file.pdf"',
  //     ); // Set desired filename and content type

  //     // Send the file content as a response
  //     response.send(fileResponse.data);
  //   } catch (error) {
  //     console.error('Error downloading file:', error);
  //     response.status(500).send('Error downloading file');
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
        console.log(
          '🚀 ~ file: job-listings.service.ts:427 ~ awaitthis.prisma.$transaction ~ jobListingApplication:',
          jobListingApplications,
        );

        for (const jobListingApplication of jobListingApplications) {
          await this.cloudinaryService.deleteFiles([
            jobListingApplication.resume,
            jobListingApplication.coverLetter,
          ]);
        }

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
    { cursor, direction, orderBy, size, ...dto }: JobListingFilterDto,
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
        'description',
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

  async getRecentJobListing({
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
          status: JOB_LISTING_STATUS.APPROVED,
        },
        include: { jobApplications: true },
      };

      const jobListings = await this.findManyPaginate(args, {
        cursor,
        direction: 'desc',
        orderBy: 'createdAt',
        size: 10,
      });

      AppUtilities.addTimestamps(jobListings);

      return jobListings;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
