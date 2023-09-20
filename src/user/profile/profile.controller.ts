import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiConsumes, ApiTags, ApiBody } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { ApiResponseMeta } from '../../common/decorators/response.decorator';
import { API_TAGS } from '../../common/interfaces';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { SkillDto } from '../dto/skill.dto';
import { EducationHistDto } from '../dto/educational-history.dto';
import { LanguagesDto } from '../dto/languages.dto';
import { UserService } from '../user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkExperienceDto } from '../dto/work-experience.dto';

@ApiTags(API_TAGS.PROFILE)
@ApiBearerAuth()
@Controller('user/profile')
export class ProfileController {
  constructor(private userService: UserService) {}
  @Get('/')
  @UseGuards(AuthGuard())
  async viewProfile(@GetUser() user: User) {
    return this.userService.viewProfile(user);
  }

  @ApiResponseMeta({ message: 'Profile Updated Successfully' })
  @Post('/update')
  @UseInterceptors(FileInterceptor('profilePicUrl'))
  @UseGuards(AuthGuard())
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProfileDto })
  async updateProfile(
    @UploadedFile() profilePicUrl: Express.Multer.File,
    @Body() dto: UpdateProfileDto,
    @GetUser() user: User,
  ) {
    return this.userService.updateProfile(dto, profilePicUrl, user);
  }

  @ApiResponseMeta({ message: 'Skill Added Successfully' })
  @Post('/skill/create')
  @UseGuards(AuthGuard())
  async addSkill(@Body() dto: SkillDto, @GetUser() user: User) {
    return this.userService.addSkill(dto, user);
  }

  @ApiResponseMeta({ message: 'Skill Updated Successfully' })
  @Patch('/skill/:id/edit')
  @UseGuards(AuthGuard())
  async editSkill(
    @Query('id') id: string,
    @Body() dto: SkillDto,
    @GetUser() user: User,
  ) {
    return this.userService.editSkill(id, dto, user);
  }

  @ApiResponseMeta({ message: 'Skill Deleted Successfully' })
  @Delete('/skill/:id/delete')
  @UseGuards(AuthGuard())
  async deleteSkill(@Query('id') id: string, @GetUser() user: User) {
    return this.userService.deleteSkill(id, user);
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
    @Query('id') id: string,
    @Body() dto: WorkExperienceDto,
    @GetUser() user: User,
  ) {
    return this.userService.editWorkExperiences(id, dto, user);
  }

  @ApiResponseMeta({ message: 'Work Experience Deleted Successfully' })
  @Delete('/work-experience/:id/delete')
  @UseGuards(AuthGuard())
  async deleteWorkExperience(@Query('id') id: string, @GetUser() user: User) {
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
    @Query('id') id: string,
    @Body() dto: EducationHistDto,
    @GetUser() user: User,
  ) {
    return this.userService.editEducationHistory(id, dto, user);
  }

  @ApiResponseMeta({ message: 'Education Deleted Successfully' })
  @Delete('/education/:id/delete')
  @UseGuards(AuthGuard())
  async deleteEeducationHistory(
    @Query('id') id: string,
    @GetUser() user: User,
  ) {
    return this.userService.deleteEducationHistory(id, user);
  }

  @ApiResponseMeta({ message: 'Language Added Successfully' })
  @Post('/languages/create')
  @UseGuards(AuthGuard())
  async addLanguage(@Body() dto: LanguagesDto, @GetUser() user: User) {
    return this.userService.addLanguages(dto, user);
  }

  @ApiResponseMeta({ message: 'Languages Updated Successfully' })
  @Patch('/languages/:id/edit')
  @UseGuards(AuthGuard())
  async editLanguage(
    @Query('id') id: string,
    @Body() dto: LanguagesDto,
    @GetUser() user: User,
  ) {
    return this.userService.editLanguages(id, dto, user);
  }

  @ApiResponseMeta({ message: 'Languages Deleted Successfully' })
  @Delete('/languages/:id/delete')
  @UseGuards(AuthGuard())
  async deleteLanguage(@Query('id') id: string, @GetUser() user: User) {
    return this.userService.deleteLanguages(id, user);
  }

  @Get('/mybookmarks')
  @UseGuards(AuthGuard())
  async getMyBookmarks(@GetUser() user: User) {
    return this.userService.getMyBookmarks(user);
  }
}
