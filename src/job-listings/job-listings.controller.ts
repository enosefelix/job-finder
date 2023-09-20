import { Controller, Get, Query } from '@nestjs/common';
import { JobListingsService } from './job-listings.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JobListingFilterDto } from './dto/job-listing-filter.dto';
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

  @Get('/:id')
  async getJobListingById(@Query('id') id: string) {
    return this.jobListingsService.getJobListingById(id);
  }

  @Get('recents')
  async getRecentJobListing(@Query() dto: JobListingFilterDto) {
    return this.jobListingsService.getRecentJobListing(dto);
  }

  @Get('jobListingApplication/download/:id')
  async downloadJobListingApplication(@Query('id') id: string) {
    return this.jobListingsService.downloadFiles(id);
  }
}
