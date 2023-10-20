import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { JobListingFilterDto } from '@@job-listings/dto/job-listing-filter.dto';
import { GetUser } from '@@common/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { CreateJobListingDto } from '@@job-listings/dto/create-job-listing.dto';
import { ApiResponseMeta } from '@@common/decorators/response.decorator';
import { UpdateJobListingDto } from '@@job-listings/dto/edit-job.dto';
import { API_TAGS } from '@@common/interfaces';
import { Throttle } from '@nestjs/throttler';
import { JobListingApplicationsService } from '@@/job-listing-applications/job-listing-applications.service';
import { UserJobListingApplicationDto } from '@@/job-listing-applications/dto/get-user-joblisting-applications.dto';

@ApiTags(API_TAGS.USER)
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jobListingApplicationService: JobListingApplicationsService,
  ) {}

  @Get('/my-job-listings')
  @UseGuards(AuthGuard())
  async viewMyJobListings(
    @Query() dto: JobListingFilterDto,
    @GetUser() user: User,
  ) {
    return this.userService.viewMyJobListings(dto, user);
  }

  @Get('/job-listings/:id')
  @UseGuards(AuthGuard())
  async viewJobListing(@Param('id') id: string, @GetUser() user: User) {
    return this.userService.viewJobListing(id, user);
  }

  @Post('/job-listings/:id/bookmark')
  @UseGuards(AuthGuard())
  async bookmarkJobListing(@Param('id') id: string, @GetUser() user: User) {
    return this.userService.bookmarkJobListing(id, user);
  }

  // @ApiResponseMeta({ message: 'Job Listing Unbookmarked Successfully' })
  // @Delete('/job-listings/:id/unbookmark')
  // @UseGuards(AuthGuard())
  // async unbookmarkJobListing(@Param('id') id: string, @GetUser() user: User) {
  //   return this.userService.unbookmarkJobListing(id, user);
  // }

  @Throttle({ default: { limit: 5, ttl: 30000 } })
  @Post('/job-listings/create')
  @UseGuards(AuthGuard())
  async createJobListing(
    @Body() dto: CreateJobListingDto,
    @GetUser() user: User,
  ) {
    return this.userService.createJobListing(dto, user);
  }

  @ApiResponseMeta({ message: 'Job Listing Updated Successful' })
  @Patch('/job-listings/:id/edit')
  @UseGuards(AuthGuard())
  async editJobListing(
    @Param('id') id: string,
    @Body() dto: UpdateJobListingDto,
    @GetUser() user: User,
  ) {
    return this.userService.editJobListing(id, dto, user);
  }

  @ApiResponseMeta({ message: 'Job Listing Deleted Successfully' })
  @Delete('/job-listings/:id/delete')
  @UseGuards(AuthGuard())
  async deleteJobListing(@Param('id') id: string, @GetUser() user: User) {
    return this.userService.deleteJobListing(id, user);
  }

  @Get('/job-applications')
  @UseGuards(AuthGuard())
  async getMyApplications(
    @Query() dto: UserJobListingApplicationDto,
    @GetUser() user: User,
  ) {
    return this.jobListingApplicationService.getMyApplications(dto, user);
  }

  @Get('/job-applications/:id')
  @UseGuards(AuthGuard())
  async getMyApplication(@Param('id') id: string, @GetUser() user: User) {
    return this.userService.getMySingleApplication(id, user);
  }

  @ApiResponseMeta({ message: 'User Tagged Successfully' })
  @Post('/job-listing/:jobListingId/:userId/tag')
  @UseGuards(AuthGuard())
  async tagUser(
    @Param('userId') userId: string,
    @Param('jobListingId') jobListingId: string,
    @GetUser() user: User,
  ) {
    return this.userService.tagUsers(userId, jobListingId, user);
  }

  @ApiResponseMeta({ message: 'Tag Removed Successfully' })
  @Delete('/job-listing/:jobListingId/:userId/untag')
  @UseGuards(AuthGuard())
  async removeTag(
    @Param('userId') userId: string,
    @Param('jobListingId') jobListingId: string,
    @GetUser() user: User,
  ) {
    return this.userService.removeTag(userId, jobListingId, user);
  }
}
