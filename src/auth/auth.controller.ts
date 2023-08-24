import { ApiResponseMeta } from '../common/decorators/response.decorator';
import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Get,
  Req,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RealIp } from 'nestjs-real-ip';
import { SendTokenDto } from './dto/send-token.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { API_TAGS } from '../common/interfaces/index';
import { SignupDto } from './dto/signup.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { GetUser } from '../common/decorators/get-user.decorator';
import { ForgotPasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags(API_TAGS.AUTH)
@UsePipes(new ValidationPipe())
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponseMeta({ message: 'User Signed Up Successfully' })
  @Post('auth/signup')
  async signup(@Body(ValidationPipe) dto: SignupDto): Promise<any> {
    return this.authService.signup(dto);
  }

  @ApiResponseMeta({ message: 'You have logged in!' })
  @Post('auth/login')
  async login(
    @Body(ValidationPipe) dto: LoginDto,
    @RealIp() ip: string,
  ): Promise<any> {
    return this.authService.login(dto, ip);
  }

  @ApiResponseMeta({ message: 'Email sent successfully, check mail for otp' })
  @Post('auth/forgot-password')
  async sendMail(@Body(ValidationPipe) dto: SendTokenDto): Promise<any> {
    return this.authService.sendMail(dto);
  }

  @Post('auth/verify-token')
  async verifyToken(@Body(ValidationPipe) token: VerifyTokenDto): Promise<any> {
    return this.authService.verifyToken(token);
  }

  @ApiResponseMeta({ message: 'Password Reset Successfully' })
  @Post('auth/reset-password')
  async resetPasword(
    @Body(ValidationPipe) dto: ForgotPasswordDto,
  ): Promise<any> {
    return this.authService.resetPassword(dto);
  }

  @ApiResponseMeta({ message: 'Password Updated Successfully' })
  @UseGuards(AuthGuard())
  @Patch('auth/change-password')
  async updatesPassword(
    @Body() dto: UpdatePasswordDto,
    @GetUser() user: User,
  ): Promise<any> {
    return this.authService.updatePassword(dto, user);
  }

  @Get()
  @UseGuards(AuthGuard('google'))
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async googleAuth(@Req() req) {}

  @Get('/google/redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req, @RealIp() ip: string) {
    return this.authService.googleLogin(req, ip);
  }
}
