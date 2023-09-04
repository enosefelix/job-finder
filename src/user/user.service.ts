import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateJobListingDto } from 'src/job-listings/dto/create-job-listing.dto';
import { UpdateJobListingDto } from 'src/job-listings/dto/edit-job.dto';
import { JobListingFilterDto } from 'src/job-listings/dto/job-listing-filter.dto';
import { JobListingsService } from 'src/job-listings/job-listings.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SkillDto } from './dto/skill.dto';
import * as moment from 'moment';
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
} from 'src/common/interfaces';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { AppUtilities } from 'src/app.utilities';

@Injectable()
export class UserService {
  constructor(
    private jobListingService: JobListingsService,
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async createJobListing(dto: CreateJobListingDto, user: User) {
    return await this.jobListingService.createJobListing(false, dto, user);
  }

  async viewMyJobListings(dto: JobListingFilterDto, user: User) {
    return await this.jobListingService.getAllUserJobListings(
      'false',
      dto,
      user,
    );
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
    return await this.jobListingService.updateJobListing(false, id, dto, user);
  }

  async deleteJobListing(id: string, user: User) {
    return await this.jobListingService.deleteJobListing(id, user);
  }

  async getMyApplications(user: User) {
    const jobApplication = await this.prisma.jobListingApplications.findMany({
      where: { createdBy: user.id },
      include: { jobListing: true },
    });

    if (jobApplication.length < 1)
      throw new NotFoundException(JOB_APPLICATION_ERORR.NO_JOBS_FOUND);

    AppUtilities.addTimestamps(jobApplication);

    return jobApplication;
  }

  async getMySingleApplication(id: string, user: User) {
    const jobApplication = await this.prisma.jobListingApplications.findFirst({
      where: { id, createdBy: user.id },
      // include: { jobListing: true },
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

  async viewProfile(user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        profile: {
          include: {
            skills: true,
            educationalHistory: true,
            languages: true,
            workExperiences: true,
          },
        },
      },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    return foundUser;
  }

  async updateProfile(
    dto: UpdateProfileDto,
    profilePic: Express.Multer.File,
    user: User,
  ) {
    try {
      const uploadProfilePic: any = profilePic
        ? await this.cloudinaryService.uploadImage(profilePic).catch(() => {
            throw new BadRequestException('Invalid file type.');
          })
        : null;
      const profilePicUrl = uploadProfilePic?.secure_url || '';

      const foundUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!foundUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      const updateProfile = await this.prisma.profile.update({
        where: { userId: user.id },
        data: {
          ...dto,
          profilePicUrl,
          updatedAt: moment().toISOString(),
          updatedBy: user.id,
        },
      });

      return updateProfile;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async addSkill(dto: SkillDto, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { profile: true },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    return await this.prisma.skill.create({
      data: {
        ...dto,
        Profile: { connect: { userId: user.id } },
        createdBy: user.id,
      },
    });
  }

  async editSkill(id: string, dto: SkillDto, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    const skill = await this.prisma.skill.findFirst({
      where: { id, createdBy: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    if (!skill) throw new NotFoundException(DATA_NOT_FOUND.NOT_FOUND);

    if (user.id !== skill.createdBy)
      throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

    return await this.prisma.skill.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: moment().toISOString(),
        updatedBy: user.id,
      },
    });
  }

  async deleteSkill(id: string, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const skill = await this.prisma.skill.findFirst({
      where: {
        id,
        createdBy: user.id,
      },
    });

    if (!skill) throw new NotFoundException(DATA_NOT_FOUND.NOT_FOUND);

    if (skill.createdBy !== user.id)
      throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

    await this.prisma.skill.delete({
      where: { id },
    });
  }

  async addEducationHistory(user: User, dto: EducationHistDto) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const educationHistory = await this.prisma.educationalHistory.create({
      data: {
        ...dto,
        createdBy: user.id,
        Profile: { connect: { userId: user.id } },
      },
    });

    return educationHistory;
  }

  async editEducationHistory(id: string, dto: EducationHistDto, user: User) {
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

    return await this.prisma.educationalHistory.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: moment().toISOString(),
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

  async addWorkExperiences(id: string, dto: WorkExperienceDto, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const workExperience = await this.prisma.workExperience.create({
      data: {
        ...dto,
        createdBy: user.id,
        Profile: { connect: { userId: user.id } },
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

    return await this.prisma.workExperience.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: moment().toISOString(),
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
        updatedAt: moment().toISOString(),
        updatedBy: user.id,
      },
    });
  }

  async deleteLanguages(id, user: User) {
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

  async bookmarkJobListing(jobListingId: string, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const jobListing = await this.prisma.jobListing.findFirst({
      where: { id: jobListingId, status: JOB_LISTING_STATUS.APPROVED },
    });

    // if (jobListing && jobListing.createdBy === foundUser.id)
    //   throw new BadRequestException('Cannot Bookmark your jobListing');

    if (!jobListing)
      throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);

    const isBookmarked = await this.prisma.bookmark.findFirst({
      where: { userId: user.id, jobListingId: jobListing.id },
    });

    if (isBookmarked)
      throw new ForbiddenException('Job Listing is already bookmarked');

    await this.prisma.bookmark.create({
      data: {
        jobListing: { connect: { id: jobListing.id } },
        user: { connect: { id: user.id } },
        createdBy: user.id,
      },
    });
  }

  async unbookmarkJobListing(jobListingId: string, user: User) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    const jobListing = await this.prisma.jobListing.findFirst({
      where: { id: jobListingId, status: JOB_LISTING_STATUS.APPROVED },
    });

    if (!jobListing)
      throw new NotFoundException(JOB_LISTING_ERROR.JOB_NOT_FOUND);

    const bookmark = await this.prisma.bookmark.findFirst({
      where: { userId: user.id, jobListingId: jobListing.id },
    });

    if (!bookmark)
      throw new ForbiddenException('Job Listing is not bookmarked');

    await this.prisma.bookmark.delete({
      where: {
        id: bookmark.id,
      },
    });
  }

  async getMyBookmarks(user: User) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId: user.id },
      include: { jobListing: true },
    });

    if (bookmarks.length < 1) throw new NotFoundException('No Bookmarks found');

    return bookmarks;
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
