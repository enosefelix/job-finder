import { AdminService } from './admin.service';
import {
  Controller,
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
  Res,
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
import { RealIP } from 'nestjs-real-ip';
import { LoginDto } from '@@auth/dto/login.dto';
import { BlogService } from './blog/blog.service';
import { CreateBlogDto } from './blog/dto/create-blog.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { SendResetLinkDto } from '@@/auth/dto/send-reset-link.dto';
import { AuthService } from '@@/auth/auth.service';
import { ResetPasswordDto } from '@@/auth/dto/reset-password.dto';
import { UpdateBlogDto } from './blog/dto/update-blog.dto';
import { UpdatePasswordDto } from '@@/auth/dto/updatePassword.dto';
import { UpdateJobListingStatusDto } from './dto/approve-jobListing.dto';
import { UpdateBlogStatusDto } from './blog/dto/update-blog-status.dto';
import { AdminBlogFilterDto } from './dto/admin-blogs.dto';
import { Response } from 'express';

@ApiBearerAuth()
@ApiTags(API_TAGS.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly blogService: BlogService,
    private readonly authService: AuthService,
  ) {}

  @ApiResponseMeta({ message: 'Login successful' })
  @Post('/login')
  async adminSignup(
    @Body() dto: LoginDto,
    @RealIP() ip: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.adminService.login(dto, ip.toString(), response);
  }

  @ApiResponseMeta({
    message:
      'We have sent an email to the email registered to this Admin account containing further instructions to reset your password!',
  })
  @Post('auth/request-password-reset')
  async sendMail(@Body() dto: SendResetLinkDto): Promise<any> {
    return this.adminService.sendResetMail(dto);
  }

  @ApiResponseMeta({ message: 'Password Reset Successfully' })
  @Patch('pages/auth/reset-password/:requestId')
  async resetPassword(
    @Param('requestId') requestId: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.adminService.resetPassword(requestId, dto);
  }

  @ApiResponseMeta({ message: 'Password Updated Successfully' })
  @UseGuards(AuthGuard())
  @Patch('auth/change-password')
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @GetUser() user: User,
  ): Promise<any> {
    return this.adminService.updatePassword(dto, user);
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

  @Patch('/user/:id/update-user-status')
  @UseGuards(AdminAuthGuard)
  async suspendUser(
    @Body() dto: UpdateUserStatusDto,
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    return this.adminService.suspendUser(dto, id, user);
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
  @Patch('/job-listings/:id/approve')
  @UseGuards(AdminAuthGuard)
  async updateJoblistingStatus(
    @Body() dto: UpdateJobListingStatusDto,
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    return this.adminService.updateJobListingStatus(dto, id, user);
  }

  @ApiResponseMeta({ message: 'Job Listing Deleted Successfully' })
  @Delete('/job-listings/:id/delete')
  @UseGuards(AdminAuthGuard)
  async deleteJobListing(@Param('id') id: string, @GetUser() user: User) {
    return this.adminService.deleteJobListing(id, user);
  }

  @ApiResponseMeta({ message: 'Job Listing Updated Successfully' })
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
  async getMyBlogs(@Query() dto: AdminBlogFilterDto, @GetUser() user: User) {
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
  @UseGuards(AdminAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateBlogDto })
  async updateBlog(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Body() dto: UpdateBlogDto,
    @GetUser() user: User,
  ) {
    return this.blogService.updateBlog(id, dto, image, user);
  }

  @ApiResponseMeta({ message: 'Blog Updated Successfully' })
  @UseGuards(AdminAuthGuard)
  @Patch('/blogs/:id/approve')
  async updateBlogStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBlogStatusDto,
    @GetUser() user: User,
  ) {
    return this.blogService.updateBlogStatus(id, dto, user);
  }

  @ApiResponseMeta({ message: 'Blog Deleted Successfully' })
  @Delete('/blogs/:id/delete')
  @UseGuards(AdminAuthGuard)
  async deleteBlog(@Param('id') id: string, @GetUser() user: User) {
    return this.blogService.deleteBlog(id, user);
  }
}
