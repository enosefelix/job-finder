import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JobListing, PrismaClient, User } from '@prisma/client';
import {
  AUTH_ERROR_MSGS,
  Category,
  ExperienceLevel,
  JOB_APPLICATION_ERORR,
  JOB_LISTING_ERROR,
  JOB_LISTING_STATUS,
  JobType,
  USER_STATUS,
} from '@@common/interfaces/index';
import { PrismaService } from '@@common/prisma/prisma.service';
import { UsersFilterDto } from './dto/get-users-filter.dto';
import { AdminJobListingFilterDto } from '@@admin/dto/admin-job-listing.dto';
import { JobListingsService } from '@@job-listings/job-listings.service';
import { AuthService } from '@@auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import { JwtPayload } from '@@auth/payload/jwt.payload.interface';
import { LoginDto } from '@@auth/dto/login.dto';
import { CloudinaryService } from '@@cloudinary/cloudinary.service';
import { CreateJobListingDto } from '@@job-listings/dto/create-job-listing.dto';
import { UpdateJobListingDto } from '@@job-listings/dto/edit-job.dto';
import { AppUtilities } from '../app.utilities';
import { UserService } from '@@/user/user.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(JobListingsService.name);
  constructor(
    private prisma: PrismaService,
    private jobListingService: JobListingsService,
    private authService: AuthService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
    private userService: UserService,
  ) {}

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

    await AppUtilities.addTimestampBase(jobListing);

    return jobListing;
  }

  async getAllUsers(dto: UsersFilterDto, user: User): Promise<User[]> {
    try {
      return this.userService.getAllUsers(dto, user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getUserById(id: string, adminUser: User): Promise<any> {
    try {
      await this.authService.verifyUser(adminUser);
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          profile: {
            include: {
              technicalSkills: true,
              languages: true,
              educationalHistory: true,
              workExperiences: true,
              certifications: true,
              softSkills: true,
            },
          },
          jobListing: true,
          jobListingApplications: true,
          bookmarks: true,
        },
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

      if (!userJobListings)
        throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);

      AppUtilities.addTimestampBase(user);
      const properties = AppUtilities.extractProperties(user);

      const { rest } = properties;

      return { user: { ...rest }, jobListings: userJobListings };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async suspendUser(
    dto: UpdateUserStatusDto,
    id: string,
    adminUser: User,
  ): Promise<any> {
    try {
      await this.authService.verifyUser(adminUser);
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      const { status } = dto;

      if (!user) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      if (
        status === USER_STATUS.ACTIVE &&
        user.status === USER_STATUS.SUSPENDED
      ) {
        await this.prisma.user.update({
          where: {
            id,
          },
          data: {
            status: status as USER_STATUS,
            updatedBy: adminUser.id,
          },
        });

        return { message: 'User Activated Successfully' };
      } else if (
        status === USER_STATUS.SUSPENDED &&
        user.status === USER_STATUS.ACTIVE
      ) {
        await this.prisma.user.update({
          where: { id },
          data: {
            status: status as USER_STATUS,
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

        return { message: 'User Suspended Successfully' };
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // async unsuspendUser(id: string, adminUser: User): Promise<void> {
  //   try {
  //     await this.authService.verifyUser(adminUser);
  //     const user = await this.prisma.user.findUnique({
  //       where: { id },
  //     });

  //     if (!user) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

  //     await this.prisma.user.update({
  //       where: { id },
  //       data: {
  //         status: USER_STATUS.ACTIVE,
  //         updatedBy: adminUser.id,
  //       },
  //     });
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

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
        },
        include: {
          approvedBy: { select: { id: true, email: true, status: true } },
          postedBy: { select: { id: true, email: true, status: true } },
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

  async getJobListings(
    { cursor, direction, orderBy, size, ...dto }: AdminJobListingFilterDto,
    user: User,
  ): Promise<JobListing[]> {
    try {
      return this.jobListingService.getJobListingsAdmin(
        { cursor, direction, orderBy, size, ...dto },
        user,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getJobListingById(id: string, user: User) {
    try {
      await this.authService.verifyUser(user);
      const jobListing = await this.prisma.jobListing.findUnique({
        where: { id },
        include: {
          jobApplications: {
            include: {
              user: {
                select: { profile: true },
              },
            },
          },
          approvedBy: { select: { id: true, email: true, status: true } },
          postedBy: { select: { id: true, email: true, status: true } },
        },
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
        postedBy: { connect: { email: user.email } },
        skills,
        languages,
        status: JOB_LISTING_STATUS.APPROVED,
        approvedBy: { connect: { id: user.id } },
      },
    });

    return createJobListing;
  }

  async adminDataAggregation(user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) {
      throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);
    }

    const [
      totalNumOfUsers,
      totalNumberOfApprovedJobListings,
      totalNumberOfPendingJobListings,
    ] = await Promise.all([
      this.totalNumberOfUsers(),
      this.totalNumberOfApprovedJobListings(),
      this.totalNumberOfPendingJobListings(),
    ]);

    return {
      totalNumOfUsers,
      totalNumberOfApprovedJobListings,
      totalNumberOfPendingJobListings,
    };
  }

  async totalNumberOfUsers() {
    let numberOfUsers = 0;
    const data = await this.prisma.user.aggregate({
      _count: true,
    });

    numberOfUsers += data._count;

    return numberOfUsers;
  }

  async totalNumberOfApprovedJobListings() {
    let numberOfApprovedJobListings = 0;
    const data = await this.prisma.jobListing.aggregate({
      where: { status: JOB_LISTING_STATUS.APPROVED },
      _count: true,
    });

    numberOfApprovedJobListings += data._count;

    return numberOfApprovedJobListings;
  }

  async totalNumberOfPendingJobListings() {
    let numberOfPendingJobListings = 0;
    const data = await this.prisma.jobListing.aggregate({
      where: { status: JOB_LISTING_STATUS.PENDING },
      _count: true,
    });

    numberOfPendingJobListings += data._count;

    return numberOfPendingJobListings;
  }

  async allJobApplications(user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) {
      throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);
    }

    const jobApplications = await this.prisma.jobListingApplications.findMany({
      include: {
        jobListing: true,
        user: {
          select: { profile: true },
        },
      },
    });

    if (jobApplications.length < 1)
      throw new NotFoundException(JOB_APPLICATION_ERORR.NO_JOBS_FOUND);

    AppUtilities.addTimestamps(jobApplications);

    return jobApplications;
  }
}
