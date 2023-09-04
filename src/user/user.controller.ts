import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Patch,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { JobListingFilterDto } from 'src/job-listings/dto/job-listing-filter.dto';
import { GetQuery, GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { CreateJobListingDto } from 'src/job-listings/dto/create-job-listing.dto';
import { ApiResponseMeta } from 'src/common/decorators/response.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApplyJobListingDto } from 'src/job-listings/dto/apply-joblisting.dto';
import { UpdateJobListingDto } from 'src/job-listings/dto/edit-job.dto';
import { API_TAGS } from 'src/common/interfaces';
import { JobListingsService } from 'src/job-listings/job-listings.service';

@ApiTags(API_TAGS.USER)
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jobListingService: JobListingsService,
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
  async viewJobListing(@Query('id') id: string, @GetUser() user: User) {
    return this.userService.viewJobListing(id, user);
  }

  @ApiResponseMeta({ message: 'Job Listing Bookmarked Successfully' })
  @Post('/job-listings/:id/bookmark')
  @UseGuards(AuthGuard())
  async bookmarkJobListing(@Query('id') id: string, @GetUser() user: User) {
    return this.userService.bookmarkJobListing(id, user);
  }

  @ApiResponseMeta({ message: 'Job Listing Unbookmarked Successfully' })
  @Delete('/job-listings/:id/unbookmark')
  @UseGuards(AuthGuard())
  async unbookmarkJobListing(@Query('id') id: string, @GetUser() user: User) {
    return this.userService.unbookmarkJobListing(id, user);
  }

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
    @Query('id') id: string,
    @Body() dto: UpdateJobListingDto,
    @GetUser() user: User,
  ) {
    return this.userService.editJobListing(id, dto, user);
  }

  @ApiResponseMeta({ message: 'Job Listing Deleted Successfully' })
  @Delete('/job-listings/:id/delete')
  @UseGuards(AuthGuard())
  async deleteJobListing(@Query('id') id: string, @GetUser() user: User) {
    return this.userService.deleteJobListing(id, user);
  }

  @ApiResponseMeta({ message: 'Job Application Successful' })
  @Post('/job-listings/:id/apply')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'resume', maxCount: 1 },
      { name: 'coverLetter', maxCount: 1 },
    ]),
  )
  @UseGuards(AuthGuard())
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ApplyJobListingDto })
  async applyJobListing(
    @UploadedFiles()
    files: {
      resume?: Express.Multer.File[];
      coverLetter?: Express.Multer.File[];
    },
    @Query('id') id: string,
    @GetUser() user: User,
    @Body() applyDto: ApplyJobListingDto,
    @GetQuery() req: any,
  ) {
    return this.jobListingService.apply(id, user, applyDto, files, req);
  }

  @Get('/job/applications')
  @UseGuards(AuthGuard())
  async getMyApplications(@GetUser() user: User) {
    return this.userService.getMyApplications(user);
  }

  @Get('/job/applications/:id')
  @UseGuards(AuthGuard())
  async getMyApplication(@Query('id') id: string, @GetUser() user: User) {
    return this.userService.getMySingleApplication(id, user);
  }

  @ApiResponseMeta({ message: 'User Tagged Successfully' })
  @Post('/job-listing/:jobListingId/tag/:userId')
  @UseGuards(AuthGuard())
  async tagUser(
    @Query('userId') userId: string,
    @Query('jobListingId') jobListingId: string,
    @GetUser() user: User,
  ) {
    return this.userService.tagUsers(userId, jobListingId, user);
  }

  @ApiResponseMeta({ message: 'Tag Removed Successfully' })
  @Delete('/job-listing/:jobListingId/tag/:userId')
  @UseGuards(AuthGuard())
  async removeTag(
    @Query('userId') userId: string,
    @Query('jobListingId') jobListingId: string,
    @GetUser() user: User,
  ) {
    return this.userService.removeTag(userId, jobListingId, user);
  }
}
