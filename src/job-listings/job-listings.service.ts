import { Injectable, NotFoundException } from '@nestjs/common';
import { JobListingMapType } from './job-listing-maptype';
import { Prisma, User } from '@prisma/client';
import { CrudService } from '../common/database/crud.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { JobListingFilterDto } from './dto/job-listing-filter.dto';
import { CreateJobListingDto } from './dto/create-job-listing.dto';
import { Category, ResourceType } from '../common/interfaces';
import { ApplyJobListingDto } from './dto/apply-joblisting.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

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
  }: JobListingFilterDto) {
    const parsedQueryFilters = await this.parseQueryFilter(dto, [
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
        isApproved: true,
      },
      include: { jobApplications: true },
    };

    return await this.findManyPaginate(args, {
      cursor,
      direction,
      orderBy: orderBy || { createdAt: direction },
      size,
    });
  }

  async createJobListing(dto: CreateJobListingDto, user: User) {
    const { title, description, category, ...rest } = dto;

    const createJobListing = await this.prisma.jobListing.create({
      data: {
        title,
        description,
        ...rest,
        category: category as Category,
        createdBy: user.id,
      },
    });

    return createJobListing;
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
  ) {
    const url = req.url;
    const { availability } = applyDto;
    const { resume, coverLetter } = files;

    const jobListing = await this.prisma.jobListing.findUnique({
      where: { id },
    });

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
    let [resumeUrl, coverLetterUrl] = await Promise.all([
      uploadResume,
      uploadCoverLetter,
    ]);

    resumeUrl = resumeUrl?.public_id;
    coverLetterUrl = coverLetterUrl?.public_id;

    const applyJobListing = await this.prisma.jobListingApplications.create({
      data: {
        resume: resumeUrl,
        coverLetter: coverLetterUrl,
        availability,
        jobListing: { connect: { id: jobListing.id } },
        user: { connect: { id: user.id } },
        createdBy: user.id,
      },
    });

    return { resumeUrl, coverLetterUrl };
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async downloadFiles(id: string) {
    const jobListingApplication =
      await this.prisma.jobListingApplications.findUnique({ where: { id } });

    if (!jobListingApplication)
      throw new NotFoundException('Job Listing Application not found');

    const resume = jobListingApplication.resume;
    const coverLetter = jobListingApplication.coverLetter;

    await this.cloudinaryService.downloadFile(resume);
    await this.cloudinaryService.downloadFile(coverLetter);

    await Promise.all([resume, coverLetter]);

    return `...downloading ${resume} and ${coverLetter}`;
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
}
