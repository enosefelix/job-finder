import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '@@common/prisma/prisma.service';
import { CreateJobListingDto } from '@@job-listings/dto/create-job-listing.dto';
import { UpdateJobListingDto } from '@@job-listings/dto/edit-job.dto';
import { JobListingsService } from '@@job-listings/job-listings.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SoftSkillDto, TechnicalSkillDto } from './dto/skill.dto';
import { EducationHistDto } from './dto/educational-history.dto';
import { WorkExperienceDto } from './dto/work-experience.dto';
import { LanguagesDto } from './dto/languages.dto';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  AUTH_ERROR_MSGS,
  DATA_NOT_FOUND,
  JOB_APPLICATION_ERORR,
  JOB_LISTING_ERROR,
  JOB_LISTING_STATUS,
  USER_STATUS,
} from '@@common/interfaces';
import { CloudinaryService } from '@@cloudinary/cloudinary.service';
import { AppUtilities } from '../app.utilities';
import { CertificationsDto } from './dto/certifications.dto';
import { UserJobListingDto } from './dto/get-user-joblisting.dto';
import * as moment from 'moment';
import { AuthService } from '@@/auth/auth.service';
import { UsersFilterDto } from '@@/admin/dto/get-users-filter.dto';
import { CrudService } from '@@/common/database/crud.service';
import { UserMapType } from './user.maptype';
import { BookmarksService } from './bookmarks/bookmarks.service';
import { UpdateProfilePictureDto } from './dto/update-profile-picture.dto';
import { GetBookmarkDto } from './bookmarks/dto/get-bookmarks.dto';

@Injectable()
export class UserService extends CrudService<
  Prisma.UserDelegate<Prisma.RejectOnNotFound>,
  UserMapType
> {
  constructor(
    private jobListingService: JobListingsService,
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private authService: AuthService,
    private bookmarkService: BookmarksService,
  ) {
    super(prisma.user);
  }

  async createJobListing(dto: CreateJobListingDto, user: User) {
    return await this.jobListingService.createJobListing(dto, user);
  }

  async viewMyJobListings(dto: UserJobListingDto, user: User) {
    return await this.jobListingService.getAllUserJobListings(dto, user);
  }

  async viewJobListing(id: string, user: User) {
    const jobListing = await this.prisma.jobListing.findFirst({
      where: { id, createdBy: user.id },
      include: { jobApplications: true },
    });

    if (!jobListing)
      throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);

    AppUtilities.addTimestampBase(jobListing);

    return jobListing;
  }

  async editJobListing(id: string, dto: UpdateJobListingDto, user: User) {
    return await this.jobListingService.updateJobListing(id, dto, user);
  }

  async deleteJobListing(id: string, user: User) {
    return await this.jobListingService.deleteJobListing(id, user);
  }

  async getMySingleApplication(id: string, user: User) {
    const jobApplication = await this.prisma.jobListingApplications.findFirst({
      where: { id, createdBy: user.id },
      include: { jobListing: true },
    });
    if (!jobApplication)
      throw new NotFoundException(JOB_APPLICATION_ERORR.JOB_APPLICATION);

    const jobListing = await this.prisma.jobListing.findFirst({
      where: { jobApplications: { some: { id: jobApplication.id } } },
    });

    if (!jobListing)
      throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);

    AppUtilities.addTimestampBase(jobListing);

    return { jobApplication, jobListing };
  }

  async getAllUsers(
    { cursor, direction, orderBy, size, ...dto }: UsersFilterDto,
    user: User,
  ) {
    try {
      await this.authService.verifyUser(user);
      const parsedQueryFilters = await this.parseQueryFilter(dto, [
        'email',
        'profile.firstName',
        'profile.lastName',
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

      const args: Prisma.UserFindManyArgs = {
        where: {
          ...parsedQueryFilters,
          email: { not: user.email },
        },
        include: { profile: true },
      };

      const dataMapperFn = (user: any) => {
        if (user?.email) {
          delete user?.password;
          delete user?.roleId;
          delete user?.lastLoginIp;
          delete user?.googleId;
        }
        return user;
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
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async viewProfile(user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        profile: {
          include: {
            technicalSkills: true,
            softSkills: true,
            educationalHistory: true,
            languages: true,
            workExperiences: true,
            certifications: true,
          },
        },
      },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    return foundUser;
  }

  async updateProfile(dto: UpdateProfileDto, user: User) {
    try {
      const foundUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!foundUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);
      const updateProfile = await this.prisma.profile.update({
        where: { userId: user.id },
        data: {
          ...dto,
          updatedBy: user.id,
        },
      });
      return updateProfile;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async uploadProfilePicture(
    profilePic: Express.Multer.File,
    dto: UpdateProfilePictureDto,
    user: User,
  ) {
    const uploadProfilePic: any = profilePic
      ? await this.cloudinaryService
          .uploadProfilePic(profilePic, user.id)
          .catch(() => {
            throw new BadRequestException(
              'Invalid file type, must be an image.',
            );
          })
      : null;
    const profilePicture = uploadProfilePic?.secure_url || '';

    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    await this.prisma.profile.update({
      where: { userId: user.id },
      data: {
        profilePic: profilePicture,
        updatedBy: user.id,
      },
    });
  }

  async addTechnicalSkill(dto: TechnicalSkillDto, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { profile: true },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    return await this.prisma.technicalSkill.create({
      data: {
        ...dto,
        profile: { connect: { userId: user.id } },
        createdBy: user.id,
      },
    });
  }

  async editTechnicalSkill(id: string, dto: TechnicalSkillDto, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    const skill = await this.prisma.technicalSkill.findFirst({
      where: { id, createdBy: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    if (!skill) throw new NotFoundException(DATA_NOT_FOUND.NOT_FOUND);

    if (user.id !== skill.createdBy)
      throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

    return await this.prisma.technicalSkill.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: user.id,
      },
    });
  }

  async deleteTechnicalSkill(id: string, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const skill = await this.prisma.technicalSkill.findFirst({
      where: {
        id,
        createdBy: user.id,
      },
    });

    if (!skill) throw new NotFoundException(DATA_NOT_FOUND.NOT_FOUND);

    if (skill.createdBy !== user.id)
      throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

    await this.prisma.technicalSkill.delete({
      where: { id },
    });
  }

  async addSoftSkill(dto: SoftSkillDto, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { profile: true },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    return await this.prisma.softSkill.create({
      data: {
        ...dto,
        profile: { connect: { userId: user.id } },
        createdBy: user.id,
      },
    });
  }

  async editSoftSkill(id: string, dto: SoftSkillDto, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    const skill = await this.prisma.softSkill.findFirst({
      where: { id, createdBy: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    if (!skill) throw new NotFoundException(DATA_NOT_FOUND.NOT_FOUND);

    if (user.id !== skill.createdBy)
      throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

    return await this.prisma.softSkill.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: user.id,
      },
    });
  }

  async deleteSoftSkill(id: string, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const skill = await this.prisma.softSkill.findFirst({
      where: {
        id,
        createdBy: user.id,
      },
    });

    if (!skill) throw new NotFoundException(DATA_NOT_FOUND.NOT_FOUND);

    if (skill.createdBy !== user.id)
      throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

    await this.prisma.softSkill.delete({
      where: { id },
    });
  }

  async addEducationHistory(user: User, dto: EducationHistDto) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    // eslint-disable-next-line prefer-const
    let { endDate, startDate, ...rest } = dto;

    if (endDate && (endDate as any) instanceof Date) {
      endDate = moment(endDate as unknown as Date).toISOString();
    } else if (typeof endDate === 'string') {
      endDate;
    }

    moment(startDate).toISOString();

    const educationHistory = await this.prisma.educationalHistory.create({
      data: {
        startDate,
        endDate,
        ...rest,
        createdBy: user.id,
        profile: { connect: { userId: user.id } },
      },
    });

    return educationHistory;
  }

  async editEducationHistory(id: string, dto: EducationHistDto, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    // eslint-disable-next-line prefer-const
    let { endDate, startDate, ...rest } = dto;

    if (endDate && (endDate as any) instanceof Date) {
      endDate = moment(endDate as unknown as Date).toISOString();
    } else if (typeof endDate === 'string') {
      endDate;
    }

    moment(startDate).toISOString();

    const educationHist = await this.prisma.educationalHistory.findFirst({
      where: { id, createdBy: user.id },
    });

    if (!educationHist) throw new NotFoundException(DATA_NOT_FOUND.NOT_FOUND);

    if (educationHist.createdBy !== user.id)
      throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

    return await this.prisma.educationalHistory.update({
      where: { id },
      data: {
        startDate,
        endDate,
        ...rest,
        updatedBy: user.id,
      },
    });
  }

  async deleteEducationHistory(id: string, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const educationHist = await this.prisma.educationalHistory.findFirst({
      where: { id, createdBy: user.id },
    });

    if (!educationHist) throw new NotFoundException(DATA_NOT_FOUND.NOT_FOUND);

    if (educationHist.createdBy !== user.id)
      throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

    return await this.prisma.educationalHistory.delete({
      where: { id },
    });
  }

  async addWorkExperiences(dto: WorkExperienceDto, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    // eslint-disable-next-line prefer-const
    let { endDate, startDate, ...rest } = dto;

    if (endDate && (endDate as any) instanceof Date) {
      endDate = moment(endDate as unknown as Date).toISOString();
    } else if (typeof endDate === 'string') {
      endDate;
    }

    moment(startDate).toISOString();

    const workExperience = await this.prisma.workExperience.create({
      data: {
        endDate,
        startDate,
        ...rest,
        createdBy: user.id,
        profile: { connect: { userId: user.id } },
      },
    });

    return workExperience;
  }

  async editWorkExperiences(id: string, dto: WorkExperienceDto, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const workExperience = await this.prisma.workExperience.findFirst({
      where: { id, createdBy: user.id },
    });

    if (!workExperience) throw new NotFoundException(DATA_NOT_FOUND.NOT_FOUND);

    if (workExperience.createdBy !== user.id)
      throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

    // eslint-disable-next-line prefer-const
    let { endDate, startDate, ...rest } = dto;

    if (endDate && (endDate as any) instanceof Date) {
      endDate = moment(endDate as unknown as Date).toISOString();
    } else if (typeof endDate === 'string') {
      endDate;
    }

    moment(startDate).toISOString();

    return await this.prisma.workExperience.update({
      where: { id },
      data: {
        startDate,
        endDate,
        ...rest,
        updatedBy: user.id,
      },
    });
  }

  async deleteWorkExperiences(id: string, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const workExperience = await this.prisma.workExperience.findFirst({
      where: { id, createdBy: user.id },
    });

    if (!workExperience) throw new NotFoundException(DATA_NOT_FOUND.NOT_FOUND);

    if (workExperience.createdBy !== user.id)
      throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

    return await this.prisma.workExperience.delete({
      where: { id },
    });
  }

  async addLanguages(dto: LanguagesDto, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    return await this.prisma.languages.create({
      data: {
        ...dto,
        createdBy: user.id,
        profile: { connect: { userId: user.id } },
      },
    });
  }

  async editLanguages(id: string, dto: LanguagesDto, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const languages = await this.prisma.languages.findFirst({
      where: { id, createdBy: user.id },
    });

    if (!languages) throw new NotFoundException(DATA_NOT_FOUND.NOT_FOUND);

    if (languages.createdBy !== user.id)
      throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

    return await this.prisma.languages.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: user.id,
      },
    });
  }

  async deleteLanguages(id: string, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const language = await this.prisma.languages.findFirst({
      where: { id, createdBy: user.id },
    });

    if (!language) throw new NotFoundException(DATA_NOT_FOUND.NOT_FOUND);

    if (language.createdBy !== user.id)
      throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

    return await this.prisma.languages.delete({
      where: { id },
    });
  }

  async addCertifications(dto: CertificationsDto, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    return await this.prisma.certification.create({
      data: {
        ...dto,
        createdBy: user.id,
        profile: { connect: { userId: user.id } },
      },
    });
  }

  async editCertification(id: string, dto: CertificationsDto, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const certification = await this.prisma.certification.findFirst({
      where: { id, createdBy: user.id },
    });

    if (!certification) throw new NotFoundException(DATA_NOT_FOUND.NOT_FOUND);

    if (certification.createdBy !== user.id)
      throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

    return await this.prisma.certification.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: user.id,
      },
    });
  }

  async deleteCertification(id: string, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const certification = await this.prisma.certification.findFirst({
      where: { id, createdBy: user.id },
    });

    if (!certification) throw new NotFoundException(DATA_NOT_FOUND.NOT_FOUND);

    if (certification.createdBy !== user.id)
      throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

    return await this.prisma.certification.delete({
      where: { id },
    });
  }

  async bookmarkJobListing(jobListingId: string, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const jobListing = await this.prisma.jobListing.findFirst({
      where: { id: jobListingId, status: JOB_LISTING_STATUS.APPROVED },
    });

    if (!jobListing)
      throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);

    const isBookmarked = await this.prisma.bookmark.findFirst({
      where: { userId: user.id, jobListingId: jobListing.id },
    });

    if (isBookmarked) {
      await this.prisma.bookmark.delete({
        where: {
          id: isBookmarked.id,
        },
      });

      return { message: 'JobListing Unbookmarked Successfully' };
    } else {
      const bookmark = await this.prisma.bookmark.create({
        data: {
          jobListing: { connect: { id: jobListing.id } },
          user: { connect: { id: user.id } },
          createdBy: user.id,
        },
        include: { jobListing: true },
      });

      AppUtilities.addTimestampBase(bookmark);

      return { message: 'JobListing Bookmarked Successfully', bookmark };
    }
  }

  // async unbookmarkJobListing(jobListingId: string, user: User) {
  //   const foundUser = await this.prisma.user.findUnique({
  //     where: { id: user.id },
  //   });

  //   if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

  //   const jobListing = await this.prisma.jobListing.findFirst({
  //     where: { id: jobListingId, status: JOB_LISTING_STATUS.APPROVED },
  //   });

  //   if (!jobListing)
  //     throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);

  //   const bookmark = await this.prisma.bookmark.findFirst({
  //     where: { userId: user.id, jobListingId: jobListing.id },
  //     include: { jobListing: true },
  //   });

  //   if (!bookmark)
  //     throw new ForbiddenException('Job Listing is not bookmarked');

  //   await this.prisma.bookmark.delete({
  //     where: {
  //       id: bookmark.id,
  //     },
  //   });

  //   return bookmark;
  // }

  async getMyBookmarks(dto: GetBookmarkDto, user: User) {
    return this.bookmarkService.getMyBookmarks(dto, user);
  }

  async tagUsers(userId: string, jobListingId: string, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const userToTag = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToTag) throw new NotFoundException('User to tag not found');

    const isTagged = await this.prisma.tags.findFirst({
      where: { taggedUserId: userId, taggedByUserId: user.id },
    });

    if (isTagged)
      throw new ForbiddenException('User is already tagged in this post');

    const jobListing = await this.prisma.jobListing.findFirst({
      where: { id: jobListingId },
    });

    await this.prisma.tags.create({
      data: {
        taggedUser: { connect: { id: userId } },
        taggedBy: { connect: { id: user.id } },
        jobListing: { connect: { id: jobListing.id } },
        createdBy: user.id,
      },
    });
  }

  async removeTag(userId: string, jobListingId: string, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const tagToDelete = await this.prisma.tags.findFirst({
      where: {
        taggedUserId: userId,
        taggedByUserId: user.id,
        jobListingId: jobListingId,
      },
    });

    if (!tagToDelete)
      throw new NotFoundException(
        'Tag not found for this user and job listing',
      );

    await this.prisma.tags.delete({
      where: { id: tagToDelete.id },
    });
  }
}
