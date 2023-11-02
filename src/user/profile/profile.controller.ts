import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiConsumes, ApiTags, ApiBody } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { GetUser } from '@@common/decorators/get-user.decorator';
import { ApiResponseMeta } from '@@common/decorators/response.decorator';
import { API_TAGS } from '@@common/interfaces';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { SoftSkillDto, TechnicalSkillDto } from '../dto/skill.dto';
import { EducationHistDto } from '../dto/educational-history.dto';
import { LanguagesDto } from '../dto/languages.dto';
import { UserService } from '../user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkExperienceDto } from '../dto/work-experience.dto';
import { CertificationsDto } from '../dto/certifications.dto';
import { GetBookmarkDto } from '../bookmarks/dto/get-bookmarks.dto';
import { UpdateProfilePictureDto } from '../dto/update-profile-picture.dto';

@ApiTags(API_TAGS.PROFILE)
@ApiBearerAuth()
@UsePipes(new ValidationPipe())
@Controller('user/profile')
export class ProfileController {
  constructor(private userService: UserService) {}
  @Get('/')
  @UseGuards(AuthGuard())
  async viewProfile(@GetUser() user: User) {
    return this.userService.viewProfile(user);
  }

  @ApiResponseMeta({ message: 'Profile Updated Successfully' })
  @UseGuards(AuthGuard())
  @Patch('/update')
  async updateProfile(@Body() dto: UpdateProfileDto, @GetUser() user: User) {
    return this.userService.updateProfile(dto, user);
  }

  @ApiResponseMeta({ message: 'Profile Picture Updated Successfully' })
  @UseGuards(AuthGuard())
  @Patch('/update-profile-picture')
  @UseInterceptors(FileInterceptor('profilePic'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProfilePictureDto })
  async updateProfilePicture(
    @UploadedFile() profilePic: Express.Multer.File,
    @Body() dto: UpdateProfilePictureDto,
    @GetUser() user: User,
  ) {
    return this.userService.uploadProfilePicture(profilePic, dto, user);
  }

  @ApiResponseMeta({ message: 'Technical Skill Added Successfully' })
  @Post('/technical-skill/create')
  @UseGuards(AuthGuard())
  async addTechnicalSkill(
    @Body() dto: TechnicalSkillDto,
    @GetUser() user: User,
  ) {
    return this.userService.addTechnicalSkill(dto, user);
  }

  @ApiResponseMeta({ message: 'Technical Skill Updated Successfully' })
  @Patch('/technical-skill/:id/edit')
  @UseGuards(AuthGuard())
  async editTechnicalSkill(
    @Param('id') id: string,
    @Body() dto: TechnicalSkillDto,
    @GetUser() user: User,
  ) {
    return this.userService.editTechnicalSkill(id, dto, user);
  }

  @ApiResponseMeta({ message: 'Technical Skill Deleted Successfully' })
  @Delete('/technical-skill/:id/delete')
  @UseGuards(AuthGuard())
  async deleteTechnicalSkill(@Param('id') id: string, @GetUser() user: User) {
    return this.userService.deleteTechnicalSkill(id, user);
  }

  @ApiResponseMeta({ message: 'Soft Skill Added Successfully' })
  @Post('/soft-skill/create')
  @UseGuards(AuthGuard())
  async addSoftSkill(@Body() dto: SoftSkillDto, @GetUser() user: User) {
    return this.userService.addSoftSkill(dto, user);
  }

  @ApiResponseMeta({ message: 'Soft Skill Updated Successfully' })
  @Patch('/soft-skill/:id/edit')
  @UseGuards(AuthGuard())
  async editSoftSkill(
    @Param('id') id: string,
    @Body() dto: SoftSkillDto,
    @GetUser() user: User,
  ) {
    return this.userService.editSoftSkill(id, dto, user);
  }

  @ApiResponseMeta({ message: 'Soft Skill Deleted Successfully' })
  @Delete('/soft-skill/:id/delete')
  @UseGuards(AuthGuard())
  async deleteSoftSkill(@Param('id') id: string, @GetUser() user: User) {
    return this.userService.deleteSoftSkill(id, user);
  }

  @ApiResponseMeta({ message: 'Work Experience Added Successfully' })
  @Post('/work-experience/create')
  @UseGuards(AuthGuard())
  async addWorkExperience(
    @Body() dto: WorkExperienceDto,
    @GetUser() user: User,
  ) {
    return this.userService.addWorkExperiences(dto, user);
  }

  @ApiResponseMeta({ message: 'Work Experience Updated Successfully' })
  @Patch('/work-experience/:id/edit')
  @UseGuards(AuthGuard())
  async editWorkExperience(
    @Param('id') id: string,
    @Body() dto: WorkExperienceDto,
    @GetUser() user: User,
  ) {
    return this.userService.editWorkExperiences(id, dto, user);
  }

  @ApiResponseMeta({ message: 'Work Experience Deleted Successfully' })
  @Delete('/work-experience/:id/delete')
  @UseGuards(AuthGuard())
  async deleteWorkExperience(@Param('id') id: string, @GetUser() user: User) {
    return this.userService.deleteWorkExperiences(id, user);
  }

  @ApiResponseMeta({ message: 'Education Added Successfully' })
  @Post('/education/create')
  @UseGuards(AuthGuard())
  async addEducationalHistory(
    @Body() dto: EducationHistDto,
    @GetUser() user: User,
  ) {
    return this.userService.addEducationHistory(user, dto);
  }

  @ApiResponseMeta({ message: 'Education Updated Successfully' })
  @Patch('/education/:id/edit')
  @UseGuards(AuthGuard())
  async editEducation(
    @Param('id') id: string,
    @Body() dto: EducationHistDto,
    @GetUser() user: User,
  ) {
    return this.userService.editEducationHistory(id, dto, user);
  }

  @ApiResponseMeta({ message: 'Education Deleted Successfully' })
  @Delete('/education/:id/delete')
  @UseGuards(AuthGuard())
  async deleteEeducationHistory(
    @Param('id') id: string,
    @GetUser() user: User,
  ) {
    return this.userService.deleteEducationHistory(id, user);
  }

  @ApiResponseMeta({ message: 'Certification Added Successfully' })
  @Post('/certification/create')
  @UseGuards(AuthGuard())
  async addCertification(
    @Body() dto: CertificationsDto,
    @GetUser() user: User,
  ) {
    return this.userService.addCertifications(dto, user);
  }

  @ApiResponseMeta({ message: 'Certification Updated Successfully' })
  @Patch('/certification/:id/edit')
  @UseGuards(AuthGuard())
  async editCertification(
    @Param('id') id: string,
    @Body() dto: CertificationsDto,
    @GetUser() user: User,
  ) {
    return this.userService.editCertification(id, dto, user);
  }

  @ApiResponseMeta({ message: 'Certification Deleted Successfully' })
  @Delete('/certification/:id/delete')
  @UseGuards(AuthGuard())
  async deleteCertification(@Param('id') id: string, @GetUser() user: User) {
    return this.userService.deleteCertification(id, user);
  }

  @ApiResponseMeta({ message: 'Language Added Successfully' })
  @Post('/languages/create')
  @UseGuards(AuthGuard())
  async addLanguage(@Body() dto: LanguagesDto, @GetUser() user: User) {
    return this.userService.addLanguages(dto, user);
  }

  @ApiResponseMeta({ message: 'Language Updated Successfully' })
  @Patch('/languages/:id/edit')
  @UseGuards(AuthGuard())
  async editLanguage(
    @Param('id') id: string,
    @Body() dto: LanguagesDto,
    @GetUser() user: User,
  ) {
    return this.userService.editLanguages(id, dto, user);
  }

  @ApiResponseMeta({ message: 'Language Deleted Successfully' })
  @Delete('/languages/:id/delete')
  @UseGuards(AuthGuard())
  async deleteLanguage(@Param('id') id: string, @GetUser() user: User) {
    return this.userService.deleteLanguages(id, user);
  }

  @Get('/mybookmarks')
  @UseGuards(AuthGuard())
  async getMyBookmarks(@Query() dto: GetBookmarkDto, @GetUser() user: User) {
    return this.userService.getMyBookmarks(dto, user);
  }
}
