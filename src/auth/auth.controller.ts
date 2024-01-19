import { ApiResponseMeta } from '@@common/decorators/response.decorator';
import {
  Body,
  Controller,
  Post,
  ValidationPipe,
  UseGuards,
  Get,
  Patch,
  Param,
  Request,
  UsePipes,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RealIp } from 'nestjs-real-ip';
import { SendResetLinkDto } from './dto/send-reset-link.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { API_TAGS } from '@@common/interfaces/index';
import { SignupDto } from './dto/signup.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { GetUser } from '@@common/decorators/get-user.decorator';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleGuard } from '@@/common/guards/oauth.guard';
import { Response } from 'express';

@ApiTags(API_TAGS.AUTH)
@UsePipes(new ValidationPipe())
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponseMeta({ message: 'User Signed Up Successfully' })
  @Post('auth/signup')
  async signup(@Body() dto: SignupDto): Promise<any> {
    return this.authService.signup(dto);
  }

  @ApiResponseMeta({ message: 'You have logged in!' })
  @Post('auth/login')
  async login(
    @Body() dto: LoginDto,
    @RealIp() ip: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<any> {
    return this.authService.login(dto, ip.toString(), response);
  }

  @ApiBearerAuth()
  @ApiResponseMeta({ statusCode: 200 })
  @UseGuards(AuthGuard())
  @Post('auth/logout')
  async logout(@GetUser() user: any): Promise<any> {
    await this.authService.logout(user.id);
    user.res.setHeader(
      'Set-Cookie',
      'access_token=; HttpOnly; Path=/; Max-Age=0',
    );
  }

  @ApiResponseMeta({
    message:
      'We have sent an email to the email registered with this account containing further instructions to reset your password!',
  })
  @Post('auth/request-password-reset')
  async sendMail(@Body() dto: SendResetLinkDto): Promise<any> {
    return this.authService.sendMail(dto);
  }

  @ApiResponseMeta({ message: 'Password Reset Successfully' })
  @ApiBearerAuth()
  @Patch('pages/auth/reset-password/:requestId')
  async resetPassword(
    @Param('requestId') requestId: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(requestId, dto);
  }

  @ApiResponseMeta({ message: 'Password Updated Successfully' })
  @UseGuards(AuthGuard())
  @Patch('auth/change-password')
  async updatePassword(
    @Body() dto: UpdatePasswordDto,
    @GetUser() user: User,
  ): Promise<any> {
    return this.authService.updatePassword(dto, user);
  }

  @Get()
  @UseGuards(GoogleGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  async googleAuth() {}

  @Get('/google/redirect')
  @UseGuards(GoogleGuard)
  googleAuthRedirect(@Request() req: any) {
    return this.authService.googleLogin(req);
  }

  @Post('/google-auth')
  googleSignupOrLogin(
    @Body() { access_token }: { access_token: string },
    @RealIp() ip: string,
  ) {
    return this.authService.googleClientAuth(access_token, ip);
  }

  @Get('/users/all')
  async getAllUsers() {
    return this.authService.getallusers();
  }
}
