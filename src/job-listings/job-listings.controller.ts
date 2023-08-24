import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JobListingsService } from './job-listings.service';
import { GetQuery, GetUser } from '../common/decorators/get-user.decorator';
import { CreateJobListingDto } from './dto/create-job-listing.dto';
import { User } from '@prisma/client';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { JobListingFilterDto } from './dto/job-listing-filter.dto';
import { ApplyJobListingDto } from './dto/apply-joblisting.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiResponseMeta } from '../common/decorators/response.decorator';
import { API_TAGS } from '../common/interfaces';

@ApiBearerAuth()
@ApiTags(API_TAGS.JOBS)
@Controller('job-listings')
export class JobListingsController {
  constructor(private readonly jobListingsService: JobListingsService) {}

  @Get()
  async getJobListings(@Query() dto: JobListingFilterDto) {
    return this.jobListingsService.getJobListings(dto);
  }

  @ApiResponseMeta({ message: 'Job Listing Sent for verification' })
  @Post('/create')
  @UseGuards(AuthGuard())
  async createJobListing(
    @Body() dto: CreateJobListingDto,
    @GetUser() user: User,
  ) {
    return this.jobListingsService.createJobListing(dto, user);
  }

  @ApiResponseMeta({ message: 'Job Application Successful' })
  @Post('/apply')
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
    return this.jobListingsService.apply(id, user, applyDto, files, req);
  }

  @ApiResponseMeta({ message: 'Downloaded Successfully' })
  @Get('/download')
  @UseGuards(AuthGuard())
  async downloadFile(@Query('id') id: string) {
    return this.jobListingsService.downloadFiles(id);
  }
}
