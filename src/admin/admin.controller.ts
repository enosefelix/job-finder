import { AdminService } from './admin.service';
import {
  Controller,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Get,
  Query,
  Delete,
  Patch,
  Post,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { API_TAGS } from '../common/interfaces';
import { AdminAuthGuard } from '../common/guards/auth.guard.guards';
import { UsersFilterDto } from './dto/get-users-filter.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { AdminJobListingFilterDto } from './dto/admin-job-listing.dto';
import { ApiResponseMeta } from 'src/common/decorators/response.decorator';
import { UpdateJobListingDto } from 'src/job-listings/dto/edit-job.dto';
import { CreateJobListingDto } from 'src/job-listings/dto/create-job-listing.dto';

@ApiBearerAuth()
@ApiTags(API_TAGS.ADMIN)
@UsePipes(new ValidationPipe())
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/users')
  @UseGuards(AdminAuthGuard)
  async getAllUsers(@Query() dto: UsersFilterDto, @GetUser() user: User) {
    return this.adminService.getAllUsers(dto, user);
  }

  @Get('/user/:id')
  @UseGuards(AdminAuthGuard)
  async getUser(@Query('id') id: string, @GetUser() user: User) {
    return this.adminService.getUserById(id, user);
  }

  @Get('/user/:id/job-listing')
  @UseGuards(AdminAuthGuard)
  async getUserJobListings(@Query('id') id: string, @GetUser() user: User) {
    return this.adminService.getUserJobListing(id, user);
  }

  @ApiResponseMeta({ message: 'User Suspended Successfully' })
  @Patch('/user/:id/suspend')
  @UseGuards(AdminAuthGuard)
  async suspendUser(@Query('id') id: string, @GetUser() user: User) {
    return this.adminService.suspendUser(id, user);
  }

  @ApiResponseMeta({ message: 'User Deleted Successfully' })
  @Delete('/user/:id')
  @UseGuards(AdminAuthGuard)
  async deleteUser(@Query('id') id: string, @GetUser() user: User) {
    return this.adminService.deleteUser(id, user);
  }

  @Get('/job-listing')
  @UseGuards(AdminAuthGuard)
  async getJobListings(
    @Query() dto: AdminJobListingFilterDto,
    @GetUser() user: User,
  ) {
    return this.adminService.getJobListings(dto, user);
  }

  @Get('/job-listing/:id')
  @UseGuards(AdminAuthGuard)
  async getJobListing(@Query('id') id: string, @GetUser() user: User) {
    return this.adminService.getJobListingById(id, user);
  }

  @Post('/job-listing/create')
  @UseGuards(AdminAuthGuard)
  async createJobListing(
    @Body() dto: CreateJobListingDto,
    @GetUser() user: User,
  ) {
    return this.adminService.createJobListing(dto, user);
  }

  @ApiResponseMeta({ message: 'Job Listing Approved Successfully' })
  @Patch('/approve/:id/job-listing')
  @UseGuards(AdminAuthGuard)
  async approveJobListing(@Query('id') id: string, @GetUser() user: User) {
    return this.adminService.approveJobListing(id, user);
  }

  @ApiResponseMeta({ message: 'Job Listing Denied Successfully' })
  @Patch('/reject/:id/job-listing')
  @UseGuards(AdminAuthGuard)
  async rejectJobListing(@Query('id') id: string, @GetUser() user: User) {
    return this.adminService.rejectJobListing(id, user);
  }

  @ApiResponseMeta({ message: 'Job Listing Approved Successfully' })
  @Patch('/job-listing/:id/update')
  @UseGuards(AdminAuthGuard)
  async updateJobListing(
    @Query('id') id: string,
    @Body() dto: UpdateJobListingDto,
    @GetUser() user: User,
  ) {
    return this.adminService.updateJobListing(id, dto, user);
  }

  // @ApiResponseMeta({ message: 'Job Listing Deleted Successfully' })
  // @Delete('/job-listing/:id/delete')
  // @UseGuards(AdminAuthGuard)
  // async deleteJobListing(@Query('id') id: string, @GetUser() user: User) {
  //   return this.adminService.deleteJobListing(id, user);
  // }
}
