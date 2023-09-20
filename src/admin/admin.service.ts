import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JobListing, Prisma, PrismaClient, User } from '@prisma/client';
import {
  AUTH_ERROR_MSGS,
  Category,
  ExperienceLevel,
  JOB_LISTING_ERROR,
  JOB_LISTING_STATUS,
  JobType,
  USER_STATUS,
} from '../common/interfaces/index';
import { PrismaService } from '../common/prisma/prisma.service';
import { UsersFilterDto } from './dto/get-users-filter.dto';
import { CrudService } from '../common/database/crud.service';
import { ProfileMapType } from './profile.maptype';
import { AdminJobListingFilterDto } from './dto/admin-job-listing.dto';
import { JobListingsService } from '../job-listings/job-listings.service';
import { AuthService } from '../auth/auth.service';
import { AppUtilities } from '../app.utilities';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import { JwtPayload } from 'src/auth/payload/jwt.payload.interface';
import { LoginDto } from 'src/auth/dto/login.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreateJobListingDto } from 'src/job-listings/dto/create-job-listing.dto';
import { UpdateJobListingDto } from 'src/job-listings/dto/edit-job.dto';

@Injectable()
export class AdminService extends CrudService<
  Prisma.ProfileDelegate<Prisma.RejectOnNotFound>,
  ProfileMapType
> {
  constructor(
    private prisma: PrismaService,
    private jobListingService: JobListingsService,
    private authService: AuthService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
  ) {
    super(prisma.profile);
  }

  async login(loginDto: LoginDto, ip: string): Promise<any> {
    try {
      // eslint-disable-next-line prefer-const
      let { email, password } = loginDto;
      email = email.toLowerCase();
      const user = await this.prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
        include: { role: true, profile: true },
      });

      if (!user)
        throw new UnauthorizedException(AUTH_ERROR_MSGS.CREDENTIALS_DONT_MATCH);

      if (user.googleId)
        throw new ConflictException(AUTH_ERROR_MSGS.GOOGLE_ALREDY_EXISTS);

      if (user.status === USER_STATUS.SUSPENDED) {
        throw new UnauthorizedException(AUTH_ERROR_MSGS.SUSPENDED_ACCOUNT);
      }

      if (!(await AppUtilities.validator(password, user.password)))
        throw new UnauthorizedException(AUTH_ERROR_MSGS.INVALID_CREDENTIALS);

      const jwtPayload: JwtPayload = { email: user.email, userId: user.id };
      const accessToken: string = await this.jwtService.sign(jwtPayload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES'),
      });

      const refreshToken: string = await this.jwtService.sign(jwtPayload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES'),
      });

      const currentDate = moment().toISOString();

      const updatedUser = await this.prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          lastLogin: currentDate,
          lastLoginIp: ip,
        },
        include: { profile: { select: { firstName: true, lastName: true } } },
      });

      const properties = AppUtilities.extractProperties(updatedUser);

      const { rest } = properties;

      return {
        accessToken,
        refreshToken,
        user: {
          ...rest,
        },
      };
    } catch (e) {
      throw e;
    }
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

      const properties = AppUtilities.extractProperties(user);

      const { rest } = properties;

      return {
        user: rest,
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

      AppUtilities.addTimestampBase(user);
      const properties = AppUtilities.extractProperties(user);

      const { rest } = properties;

      return { user: { ...rest }, jobListings: userJobListings };
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
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) {
      throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);
    }

    const jobListing = await this.prisma.jobListing.findFirst({
      where: { id },
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

  async getJobListings(
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
        where: { ...parsedQueryFilters },
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

  async updateJobListing(
    id: string,
    dto: UpdateJobListingDto,
    user: User,
  ): Promise<JobListing> {
    try {
      await this.authService.verifyUser(user);

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

      // if (foundUser.id !== jobListing.createdBy)
      //   throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

      const updateJobListing = await this.prisma.jobListing.update({
        where: { id },
        data: {
          title,
          jobResponsibilities,
          ...rest,
          category: category as Category,
          updatedBy: foundUser.id,
          status: JOB_LISTING_STATUS.APPROVED,
        },
      });

      return updateJobListing;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createJobListing(dto: CreateJobListingDto, user: User) {
    await this.authService.verifyUser(user);
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
        status: JOB_LISTING_STATUS.APPROVED,
        approvedBy: { connect: { id: user.id } },
      },
    });

    return createJobListing;
  }
}
