import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JobListingsService } from './job-listings.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JobListingFilterDto } from './dto/job-listing-filter.dto';
import { API_TAGS, VALIDATION_ERROR_MSG } from '@@common/interfaces';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ApplyJobListingDto } from './dto/apply-joblisting.dto';
import { GetQuery, GetUser } from '@@/common/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { ApiResponseMeta } from '@@/common/decorators/response.decorator';

@ApiBearerAuth()
@ApiTags(API_TAGS.JOBS)
@UsePipes(new ValidationPipe())
@Controller('job-listings')
export class JobListingsController {
  constructor(private readonly jobListingsService: JobListingsService) {}

  @ApiResponseMeta({ message: 'Fetched JobListing Successfully' })
  @Get()
  async getJobListings(@Query() dto: JobListingFilterDto) {
    return this.jobListingsService.getJobListings(dto);
  }

  @ApiResponseMeta({ message: 'Fetched JobListing Successfully' })
  @Get('/:id')
  async getJobListingById(@Param('id') id: string) {
    return this.jobListingsService.getJobListingById(id);
  }

  @Throttle({ default: { limit: 5, ttl: 30000 } })
  @Post('/:id/apply')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'resume', maxCount: 1 },
      { name: 'coverLetter', maxCount: 1 },
    ]),
  )
  @UseGuards(AuthGuard())
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ApplyJobListingDto })
  @ApiResponseMeta({ message: 'Applied JobListing Successfully' })
  async applyJobListing(
    @UploadedFiles()
    files: {
      resume?: Express.Multer.File[];
      coverLetter?: Express.Multer.File[];
    },
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() applyDto: ApplyJobListingDto,
    @GetQuery() req: any,
  ) {
    if (!files || Object.keys(files).every((key) => !files[key])) {
      // Handle validation error
      throw new BadRequestException(VALIDATION_ERROR_MSG.UPLOAD_ONE_FILE);
    }

    return this.jobListingsService.apply(id, user, applyDto, files, req);
  }
}
