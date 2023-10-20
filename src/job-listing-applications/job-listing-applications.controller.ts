import { Controller } from '@nestjs/common';
import { JobListingApplicationsService } from './job-listing-applications.service';

@Controller('job-listing-applications')
export class JobListingApplicationsController {
  constructor(
    private readonly jobListingApplicationsService: JobListingApplicationsService,
  ) {}
}
