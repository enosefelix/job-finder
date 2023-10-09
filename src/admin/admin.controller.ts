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
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags, ApiBody } from '@nestjs/swagger';
import { API_TAGS, VALIDATION_ERROR_MSG } from '@@common/interfaces';
import { AdminAuthGuard } from '@@common/guards/auth.guard.guards';
import { UsersFilterDto } from './dto/get-users-filter.dto';
import { GetUser } from '@@common/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { AdminJobListingFilterDto } from './dto/admin-job-listing.dto';
import { ApiResponseMeta } from '@@common/decorators/response.decorator';
import { UpdateJobListingDto } from '@@job-listings/dto/edit-job.dto';
import { CreateJobListingDto } from '@@job-listings/dto/create-job-listing.dto';
import { AuthService } from '@@auth/auth.service';
import { RealIP } from 'nestjs-real-ip';
import { LoginDto } from '@@auth/dto/login.dto';
import { BlogService } from './blog/blog.service';
import { CreateBlogDto } from './blog/dto/create-blog.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { BlogFilterDto } from './blog/dto/blog-filter.dto';

@ApiBearerAuth()
@ApiTags(API_TAGS.ADMIN)
@UsePipes(new ValidationPipe())
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly blogService: BlogService,
  ) {}

  @ApiResponseMeta({ message: 'Login successful' })
  // @ApiOperation({ summary: 'Deprecated Route', deprecated: true })
  @Post('/login')
  async adminSignup(@Body() dto: LoginDto, @RealIP() ip: string) {
    return this.adminService.login(dto, ip);
  }

  @Get('/users')
  @UseGuards(AdminAuthGuard)
  async getAllUsers(@Query() dto: UsersFilterDto, @GetUser() user: User) {
    return this.adminService.getAllUsers(dto, user);
  }

  @Get('/user/:id')
  @UseGuards(AdminAuthGuard)
  async getUser(@Param('id') id: string, @GetUser() user: User) {
    return this.adminService.getUserById(id, user);
  }

  @Get('/user/:id/job-listing')
  @UseGuards(AdminAuthGuard)
  async getUserJobListings(@Param('id') id: string, @GetUser() user: User) {
    return this.adminService.getUserJobListing(id, user);
  }

  @ApiResponseMeta({ message: 'User Suspended Successfully' })
  @Patch('/user/:id/suspend')
  @UseGuards(AdminAuthGuard)
  async suspendUser(@Param('id') id: string, @GetUser() user: User) {
    return this.adminService.suspendUser(id, user);
  }

  @ApiResponseMeta({ message: 'User Deleted Successfully' })
  @Delete('/user/:id/delete')
  @UseGuards(AdminAuthGuard)
  async deleteUser(@Param('id') id: string, @GetUser() user: User) {
    return this.adminService.deleteUser(id, user);
  }

  @Get('/job-listings')
  @UseGuards(AdminAuthGuard)
  async getJobListings(
    @Query() dto: AdminJobListingFilterDto,
    @GetUser() user: User,
  ) {
    return this.adminService.getJobListings(dto, user);
  }

  @Get('/job-listings/:id')
  @UseGuards(AdminAuthGuard)
  async getJobListing(@Param('id') id: string, @GetUser() user: User) {
    return this.adminService.getJobListingById(id, user);
  }

  @Post('/job-listings/create')
  @UseGuards(AdminAuthGuard)
  async createJobListing(
    @Body() dto: CreateJobListingDto,
    @GetUser() user: User,
  ) {
    return this.adminService.createJobListing(dto, user);
  }

  @ApiResponseMeta({ message: 'Job Listing Approved Successfully' })
  @Patch('/approve/:id/job-listings')
  @UseGuards(AdminAuthGuard)
  async approveJobListing(@Param('id') id: string, @GetUser() user: User) {
    return this.adminService.approveJobListing(id, user);
  }

  @ApiResponseMeta({ message: 'Job Listing Denied Successfully' })
  @Patch('/reject/:id/job-listings')
  @UseGuards(AdminAuthGuard)
  async rejectJobListing(@Param('id') id: string, @GetUser() user: User) {
    return this.adminService.rejectJobListing(id, user);
  }

  @ApiResponseMeta({ message: 'Job Listing Deleted Successfully' })
  @Delete('/job-listings/:id/delete')
  @UseGuards(AdminAuthGuard)
  async deleteJobListing(@Param('id') id: string, @GetUser() user: User) {
    return this.adminService.deleteJobListing(id, user);
  }

  @ApiResponseMeta({ message: 'Job Listing Approved Successfully' })
  @Patch('/job-listings/:id/update')
  @UseGuards(AdminAuthGuard)
  async updateJobListing(
    @Param('id') id: string,
    @Body() dto: UpdateJobListingDto,
    @GetUser() user: User,
  ) {
    return this.adminService.updateJobListing(id, dto, user);
  }

  @ApiResponseMeta({ message: 'Fetched Summary Data Successfully' })
  @Get('/all/summary')
  @UseGuards(AdminAuthGuard)
  async getSummary(@GetUser() user: User) {
    return this.adminService.adminDataAggregation(user);
  }

  @ApiResponseMeta({ message: 'Fetched All Job Applications Successfully' })
  @Get('/job-applications')
  @UseGuards(AdminAuthGuard)
  async getAllJobApplications(@GetUser() user: User) {
    return this.adminService.allJobApplications(user);
  }

  @Get('/my-blogs')
  @UseGuards(AdminAuthGuard)
  async getMyBlogs(@Query() dto: BlogFilterDto, @GetUser() user: User) {
    return this.blogService.getMyBlogs(dto, user);
  }

  @Get('/my-blog/:id')
  @UseGuards(AdminAuthGuard)
  async getMyBlog(@Param('id') id: string, @GetUser() user: User) {
    return this.blogService.getMyBlog(id, user);
  }

  @ApiResponseMeta({ message: 'Blog Created Successfully' })
  @Post('/blogs/create')
  @UseInterceptors(FileInterceptor('image'))
  @UseGuards(AdminAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateBlogDto })
  async createBlog(
    @UploadedFile() image: Express.Multer.File,
    @Body() dto: CreateBlogDto,
    @GetUser() user: User,
  ) {
    if (!image || Object.keys(image).every((key) => !image[key])) {
      // Handle validation error
      throw new BadRequestException(VALIDATION_ERROR_MSG.UPLOAD_BLOG_IMAGE);
    }
    return this.blogService.createBlog(dto, image, user);
  }

  @ApiResponseMeta({ message: 'Blog Updated Successfully' })
  @Patch('blogs/:id/update')
  @UseInterceptors(FileInterceptor('image'))
  @UseGuards(AuthGuard())
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateBlogDto })
  async updateBlog(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Body() dto: CreateBlogDto,
    @GetUser() user: User,
  ) {
    if (!image || Object.keys(image).every((key) => !image[key])) {
      // Handle validation error
      throw new BadRequestException(VALIDATION_ERROR_MSG.UPLOAD_BLOG_IMAGE);
    }
    return this.blogService.updateBlog(id, dto, image, user);
  }

  @ApiResponseMeta({ message: 'Blog Deleted Successfully' })
  @Delete('/blogs/:id/delete')
  @UseGuards(AdminAuthGuard)
  async deleteBlog(@Param('id') id: string, @GetUser() user: User) {
    return this.blogService.deleteBlog(id, user);
  }
}
