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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { API_TAGS } from '../common/interfaces';
import { AdminAuthGuard } from '../common/guards/auth.guard.guards';
import { UsersFilterDto } from './dto/get-users-filter.dto';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '@prisma/client';

@ApiBearerAuth()
@ApiTags(API_TAGS.ADMIN)
@UsePipes(new ValidationPipe())
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/users')
  @UseGuards(AdminAuthGuard)
  async getAllUsers(@Query() dto: UsersFilterDto) {
    return this.adminService.getAllUsers(dto);
  }

  @Get('/user/:id')
  @UseGuards(AdminAuthGuard)
  async getUser(@Query() id: string) {
    return this.adminService.getUserById(id);
  }

  @Delete('/user/:id')
  @UseGuards(AdminAuthGuard)
  async deleteUser(@Query() id: string) {
    return this.adminService.deleteUser(id);
  }

  @Get('/job-listings')
  @UseGuards(AdminAuthGuard)
  async getJobListings(@Query() dto: UsersFilterDto) {
    return this.adminService.getJobListings(dto);
  }

  @Get('/job-listing/:id')
  @UseGuards(AdminAuthGuard)
  async getJobListing(@Query() id: string) {
    return this.adminService.getJobListingById(id);
  }

  @Patch('/job-listing/:id')
  @UseGuards(AdminAuthGuard)
  async approveJobListing(@Query() id: string, @GetUser() user: User) {
    return this.adminService.approveJobListing(id, user);
  }

  @Delete('/job-listing/:id')
  @UseGuards(AdminAuthGuard)
  async deleteJobListing(@Query() id: string) {
    return this.adminService.deleteJobListing(id);
  }
}
