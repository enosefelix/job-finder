import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JobListing, Prisma, PrismaClient, User } from '@prisma/client';
import {
  AUTH_ERROR_MSGS,
  BLOG_STATUS,
  Category,
  ExperienceLevel,
  JOB_APPLICATION_ERORR,
  JOB_LISTING_ERROR,
  JOB_LISTING_STATUS,
  JobType,
  ROLE_TYPE,
  USER_STATUS,
} from '@@common/interfaces/index';
import { PrismaService } from '@@common/prisma/prisma.service';
import { UsersFilterDto } from './dto/get-users-filter.dto';
import { AdminJobListingFilterDto } from '@@admin/dto/admin-job-listing.dto';
import { JobListingsService } from '@@job-listings/job-listings.service';
import { AuthService } from '@@auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from '@@auth/dto/login.dto';
import { CloudinaryService } from '@@cloudinary/cloudinary.service';
import { CreateJobListingDto } from '@@job-listings/dto/create-job-listing.dto';
import { UpdateJobListingDto } from '@@job-listings/dto/edit-job.dto';
import { AppUtilities } from '../app.utilities';
import { UserService } from '@@/user/user.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { SendResetLinkDto } from '@@/auth/dto/send-reset-link.dto';
import { MailerService } from '@@/mailer/mailer.service';
import { CacheService } from '@@/common/cache/cache.service';
import { CacheKeysEnums } from '@@/common/cache/cache.enums';
import { ResetPasswordDto } from '@@/auth/dto/reset-password.dto';
import { TEMPLATE } from '@@/mailer/interfaces';
import { UpdatePasswordDto } from '@@/auth/dto/updatePassword.dto';
import { UpdateJobListingStatusDto } from './dto/approve-jobListing.dto';
import { PrismaClientManager } from '@@/common/database/prisma-client-manager';
import { Response } from 'express';

@Injectable()
export class AdminService {
  private prismaClient;
  private readonly logger = new Logger(JobListingsService.name);
  constructor(
    private prisma: PrismaService,
    private jobListingService: JobListingsService,
    private authService: AuthService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
    private userService: UserService,
    private mailerService: MailerService,
    private cacheService: CacheService,
    private prismaClientManager: PrismaClientManager,
  ) {
    this.prismaClient = this.prismaClientManager.getPrismaClient();
  }

  async login(
    loginDto: LoginDto,
    ip: string,
    response: Response,
  ): Promise<any> {
    return this.authService.adminLogin(loginDto, ip, response);
  }

  async sendResetMail(forgotPassDto: SendResetLinkDto): Promise<any> {
    try {
      const { email } = forgotPassDto;

      const foundUser = await this.prismaClient.user.findFirst({
        where: { email },
        include: { role: true },
      });

      if (!foundUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      if (foundUser.status === USER_STATUS.SUSPENDED)
        throw new UnauthorizedException(
          AUTH_ERROR_MSGS.SUSPENDED_ACCOUNT_RESET_ADMIN,
        );

      if (foundUser?.role?.code !== ROLE_TYPE.ADMIN)
        throw new UnauthorizedException(
          'You do not have the necessary permissions to perform this action. Only administrators are allowed to access this feature.',
        );

      if (foundUser.googleId)
        throw new UnauthorizedException(AUTH_ERROR_MSGS.GOOGLE_CANNOT_RESET);

      const sendMail = await this.mailerService.sendUpdateEmail(
        email,
        TEMPLATE.RESET_MAIL_ADMIN,
      );

      return sendMail;
    } catch (e) {
      console.log(e);
      throw new BadRequestException(e.message);
    }
  }

  async resetPassword(requestId: string, resetPasswordDto: ResetPasswordDto) {
    const tokenData = await this.cacheService.get(
      CacheKeysEnums.REQUESTS + requestId,
    );

    if (!tokenData) {
      throw new BadRequestException(AUTH_ERROR_MSGS.EXPIRED_LINK);
    }

    if (tokenData.role !== ROLE_TYPE.ADMIN)
      throw new BadRequestException(
        'You do not have the necessary permissions to perform this action. Only administrators are allowed to access this feature.',
      );

    const { newPassword, confirmNewPassword } = resetPasswordDto;

    const hashedPassword = await AppUtilities.hasher(newPassword);

    if (newPassword !== confirmNewPassword)
      throw new NotAcceptableException(AUTH_ERROR_MSGS.PASSWORD_MATCH);

    const dto: Prisma.UserUpdateArgs = {
      where: { email: tokenData.email },
      data: {
        password: hashedPassword,
        updatedBy: tokenData.userId,
      },
    };

    const updatedUser = await this.prismaClient.user.update(dto);

    await this.cacheService.remove(CacheKeysEnums.REQUESTS + requestId);
    return updatedUser;
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

  async updatePassword(dto: UpdatePasswordDto, user: User): Promise<any> {
    try {
      const { oldPassword, newPassword, confirmNewPassword } = dto;
      const foundUser = await this.prismaClient.user.findUnique({
        where: { id: user.id },
        include: { role: true },
      });

      if (foundUser?.role?.code !== ROLE_TYPE.ADMIN)
        throw new UnauthorizedException(
          'You do not have the necessary permissions to perform this action. Only administrators are allowed to access this feature.',
        );
      if (foundUser.googleId)
        throw new NotAcceptableException(
          AUTH_ERROR_MSGS.GOOGLE_CHANGE_PASS_ERROR,
        );

      if (!foundUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      if (!(await AppUtilities.validator(oldPassword, foundUser.password)))
        throw new UnauthorizedException(AUTH_ERROR_MSGS.INVALID_OLD_PASSWORD);

      if (newPassword !== confirmNewPassword)
        throw new NotAcceptableException(AUTH_ERROR_MSGS.PASSWORD_MATCH);

      if (oldPassword === newPassword)
        throw new NotAcceptableException(AUTH_ERROR_MSGS.SAME_PASSWORD_ERROR);

      const hashedPassword = await AppUtilities.hasher(newPassword);

      const updatedPassword = await this.prismaClient.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          updatedBy: user.id,
        },
      });

      const properties = AppUtilities.extractProperties(updatedPassword);

      const { rest } = properties;

      return {
        user: rest,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async getAllUsers(dto: UsersFilterDto, user: User): Promise<User[]> {
    try {
      return this.userService.getAllUsers(dto, user);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async getUserById(id: string, adminUser: User): Promise<any> {
    try {
      await this.authService.verifyUser(adminUser);
      const user = await this.prismaClient.user.findUnique({
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
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async getUserJobListing(id: string, adminUser: User) {
    try {
      await this.authService.verifyUser(adminUser);
      const user = await this.prismaClient.user.findUnique({
        where: { id },
      });
      if (!user) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      const userJobListings = await this.prismaClient.jobListing.findMany({
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
      console.log(error);
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
      const user = await this.prismaClient.user.findUnique({
        where: { id },
      });

      const { status } = dto;

      if (!user) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      if (
        status === USER_STATUS.ACTIVE &&
        user.status === USER_STATUS.SUSPENDED
      ) {
        await this.prismaClient.user.update({
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
        await this.prismaClient.user.update({
          where: { id },
          data: {
            status: status as USER_STATUS,
            updatedBy: adminUser.id,
          },
        });

        await this.prismaClient.jobListing.updateMany({
          where: { createdBy: user.id, status: JOB_LISTING_STATUS.APPROVED },
          data: {
            status: JOB_LISTING_STATUS.PENDING,
            updatedBy: adminUser.id,
          },
        });

        return { message: 'User Suspended Successfully' };
      } else {
        throw new BadRequestException(`User is already ${status}`);
      }
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async deleteUser(id: string, adminUser: User): Promise<void> {
    try {
      await this.authService.verifyUser(adminUser);
      const user = await this.prismaClient.user.findUnique({
        where: { id },
      });

      if (!user) throw new Error(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      await this.prismaClient.jobListingApplications.deleteMany({
        where: { createdBy: user.id },
      });

      await this.prismaClient.tags.deleteMany({
        where: { createdBy: user.id },
      });

      await this.prismaClient.bookmark.deleteMany({
        where: { createdBy: user.id },
      });

      await this.prismaClient.jobListing.deleteMany({
        where: { createdBy: user.id },
      });

      await this.prismaClient.user.delete({
        where: { id },
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async updateJobListingStatus(
    dto: UpdateJobListingStatusDto,
    id: string,
    user: User,
  ): Promise<JobListing> {
    try {
      await this.authService.verifyUser(user);

      const jobListing = await this.prismaClient.jobListing.findUnique({
        where: { id },
      });

      const { status } = dto;

      if (
        (status === JOB_LISTING_STATUS.APPROVED &&
          jobListing.status === JOB_LISTING_STATUS.PENDING) ||
        (status === JOB_LISTING_STATUS.APPROVED &&
          jobListing.status === JOB_LISTING_STATUS.REJECTED)
      ) {
        return await this.prismaClient.jobListing.update({
          where: { id },
          data: {
            status: status as JOB_LISTING_STATUS,
            approvedBy: { connect: { id: user.id } },
            updatedBy: user.id,
          },
          include: {
            approvedBy: { select: { id: true, email: true, status: true } },
            postedBy: { select: { id: true, email: true, status: true } },
          },
        });
      } else if (
        (status === JOB_LISTING_STATUS.REJECTED &&
          jobListing.status === JOB_LISTING_STATUS.PENDING) ||
        (status === JOB_LISTING_STATUS.REJECTED &&
          jobListing.status === JOB_LISTING_STATUS.APPROVED)
      ) {
        return await this.prismaClient.jobListing.update({
          where: { id },
          data: {
            status: status as JOB_LISTING_STATUS,
            updatedBy: user.id,
          },
          include: {
            postedBy: { select: { id: true, email: true, status: true } },
          },
        });
      } else if (
        (status === JOB_LISTING_STATUS.PENDING &&
          jobListing.status === JOB_LISTING_STATUS.REJECTED) ||
        (status === JOB_LISTING_STATUS.PENDING &&
          jobListing.status === JOB_LISTING_STATUS.APPROVED)
      ) {
        return await this.prismaClient.jobListing.update({
          where: { id },
          data: {
            status: status as JOB_LISTING_STATUS,
            updatedBy: user.id,
          },
          include: {
            postedBy: { select: { id: true, email: true, status: true } },
          },
        });
      } else {
        throw new BadRequestException(`Job listing is already ${status}`);
      }
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async deleteJobListing(id: string, user: User): Promise<void> {
    const foundUser = await this.prismaClient.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) {
      throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);
    }

    const jobListing = await this.prismaClient.jobListing.findFirst({
      where: { id },
    });

    if (!jobListing) {
      throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);
    }

    try {
      await this.prismaClient.$transaction(
        async (prismaClient: PrismaClient) => {
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
        },
      );
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
      return this.jobListingService.getJobListingsAdmin(
        { cursor, direction, orderBy, size, ...dto },
        user,
      );
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async getJobListingById(id: string, user: User) {
    try {
      await this.authService.verifyUser(user);
      const jobListing = await this.prismaClient.jobListing.findUnique({
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
      console.log(error);
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

      const {
        title,
        jobResponsibilities,
        category,
        jobType,
        experienceLevel,
        ...rest
      } = dto;

      const foundUser = await this.prismaClient.user.findUnique({
        where: { id: user.id },
      });

      if (!foundUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      const jobListing = await this.prismaClient.jobListing.findUnique({
        where: { id },
      });

      if (!jobListing)
        throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);

      // if (foundUser.id !== jobListing.createdBy)
      //   throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

      const updateJobListing = await this.prismaClient.jobListing.update({
        where: { id },
        data: {
          title,
          jobResponsibilities,
          ...rest,
          category: category as Category,
          jobType: jobType as JobType,
          experienceLevel: experienceLevel as ExperienceLevel,
          updatedBy: foundUser.id,
        },
      });

      return updateJobListing;
    } catch (error) {
      console.log(error);
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

    const createJobListing = await this.prismaClient.jobListing.create({
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
        approvedBy: { connect: { id: user.id } },
      },
    });

    return createJobListing;
  }

  async adminDataAggregation(user: User) {
    const prisma = this.prismaClient;
    const foundUser = await this.prismaClient.user.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!foundUser) {
      throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);
    }

    if (foundUser?.role?.code !== ROLE_TYPE.ADMIN)
      throw new ForbiddenException(
        'You are not permitted to access this resource',
      );

    const [
      totalNumOfUsers,
      totalNumberOfActiveUsers,
      totalNumberOfInactiveUsers,
      totalNumberOfSuspendedUsers,
      totalNumberOfJoblistings,
      totalNumberOfApprovedJobListings,
      totalNumberOfPendingJobListings,
      totalNumberOfRejectedJobListings,
      totalNumberOfBlogs,
      totalNumberOfApprovedBlogs,
      totalNumberOfPendingBlogs,
      totalNumberOfRejectedBlogs,
    ] = await Promise.all([
      this.totalNumberOfUsers(prisma, user),
      this.totalNumberOfActiveUsers(prisma, user),
      this.totalNumberOfInactiveUsers(prisma, user),
      this.totalNumberOfSuspendedUsers(prisma, user),
      this.totalNumberOfJoblistings(prisma),
      this.totalNumberOfApprovedJobListings(prisma),
      this.totalNumberOfPendingJobListings(prisma),
      this.totalNumberOfRejectedJobListings(prisma),
      this.totalNumberOfBlogs(prisma),
      this.totalNumberOfApprovedBlogs(prisma),
      this.totalNumberOfPendingBlogs(prisma),
      this.totalNumberOfRejectedBlogs(prisma),
    ]);

    return {
      totalNumOfUsers,
      totalNumberOfActiveUsers,
      totalNumberOfInactiveUsers,
      totalNumberOfSuspendedUsers,
      totalNumberOfJoblistings,
      totalNumberOfApprovedJobListings,
      totalNumberOfPendingJobListings,
      totalNumberOfRejectedJobListings,
      totalNumberOfBlogs,
      totalNumberOfApprovedBlogs,
      totalNumberOfPendingBlogs,
      totalNumberOfRejectedBlogs,
    };
  }

  async totalNumberOfUsers(prisma: PrismaClient, user: User) {
    const data = await prisma.user.count({
      where: { id: { not: user.id } },
      select: { id: true },
    });

    return data?.id;
  }

  async totalNumberOfActiveUsers(prisma: PrismaClient, user: User) {
    const data = await prisma.user.aggregate({
      where: { status: USER_STATUS.ACTIVE, id: { not: user.id } },
      _count: true,
    });

    return data._count;
  }

  async totalNumberOfInactiveUsers(prisma: PrismaClient, user: User) {
    const data = await prisma.user.aggregate({
      where: {
        status: USER_STATUS.INACTIVE,
        id: { not: user.id },
      },
      _count: true,
    });

    return data._count;
  }

  async totalNumberOfSuspendedUsers(prisma: PrismaClient, user: User) {
    const rejectedJobListing = await prisma.user.aggregate({
      where: {
        status: USER_STATUS.SUSPENDED,
        id: { not: user.id },
      },
      _count: true,
    });

    return rejectedJobListing._count;
  }

  async totalNumberOfJoblistings(prisma: PrismaClient) {
    const data = await prisma.jobListing.count({
      select: { id: true },
    });

    return data?.id;
  }

  async totalNumberOfApprovedJobListings(prisma: PrismaClient) {
    const data = await prisma.jobListing.aggregate({
      where: { status: JOB_LISTING_STATUS.APPROVED },
      _count: true,
    });

    return data._count;
  }

  async totalNumberOfPendingJobListings(prisma: PrismaClient) {
    const data = await prisma.jobListing.aggregate({
      where: {
        status: JOB_LISTING_STATUS.PENDING,
      },
      _count: true,
    });

    return data._count;
  }

  async totalNumberOfRejectedJobListings(prisma: PrismaClient) {
    const data = await prisma.jobListing.aggregate({
      where: {
        status: JOB_LISTING_STATUS.REJECTED,
      },
      _count: true,
    });

    return data._count;
  }

  async totalNumberOfBlogs(prisma: PrismaClient) {
    const data = await prisma.blog.count({
      select: { id: true },
    });

    return data?.id;
  }

  async totalNumberOfApprovedBlogs(prisma: PrismaClient) {
    const data = await prisma.blog.aggregate({
      where: { status: BLOG_STATUS.APPROVED },
      _count: true,
    });

    return data._count;
  }

  async totalNumberOfPendingBlogs(prisma: PrismaClient) {
    const data = await prisma.blog.aggregate({
      where: {
        status: BLOG_STATUS.PENDING,
      },
      _count: true,
    });
    return data._count;
  }

  async totalNumberOfRejectedBlogs(prisma: PrismaClient) {
    const data = await prisma.blog.aggregate({
      where: {
        status: BLOG_STATUS.REJECTED,
      },
      _count: true,
    });

    return data._count;
  }

  async allJobApplications(user: User) {
    const foundUser = await this.prismaClient.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) {
      throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);
    }

    const jobApplications =
      await this.prismaClient.jobListingApplications.findMany({
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
