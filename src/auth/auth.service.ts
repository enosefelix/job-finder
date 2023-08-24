import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './payload/jwt.payload.interface';
import { JwtService } from '@nestjs/jwt';
import { FAILED_LOGIN_MSG, ROLE_TYPE } from '../common/interfaces/index';
import { SendTokenDto } from './dto/send-token.dto';
import * as moment from 'moment';
import { AppUtilities } from '../app.utilities';
import { SignupDto } from './dto/signup.dto';
import { User } from '@prisma/client';
import { MailerService } from '../mailer/mailer.service';
import { ForgotPasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private cacheService: CacheService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, firstName, lastName, confirmPassword } = signupDto;
    email.toLowerCase();
    const findUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (findUser?.googleId)
      throw new NotAcceptableException(
        'User already exists, login with google',
      );

    if (findUser) {
      throw new ConflictException('User already exists, login');
    }

    if (password !== confirmPassword) {
      throw new NotAcceptableException('Passwords do not match');
    }

    const hashedPassword = await AppUtilities.hasher(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: { connect: { code: ROLE_TYPE.USER } },
        profile: {
          create: {
            firstName,
            lastName,
          },
        },
      },
      include: { profile: true },
    });

    await this.prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        profileId: user.profile.id,
      },
    });

    const pwd = 'password';
    const { [pwd]: _, ...usr } = user;

    return {
      usr,
    };
  }

  async login(loginDto: LoginDto, ip: string): Promise<any> {
    try {
      const { email, password } = loginDto;
      const user = await this.prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
        include: { role: true, profile: true },
      });

      if (!user)
        throw new UnauthorizedException(
          FAILED_LOGIN_MSG.CREDENTIALS_DONT_MATCH,
        );

      if (user.googleId)
        return `'You signed up with Google. Please use Google login.'`;

      if (!(await AppUtilities.validator(password, user.password)))
        throw new UnauthorizedException(FAILED_LOGIN_MSG.INVALID_CREDENTIALS);

      const jwtPayload: JwtPayload = { email: user.email };
      const accessToken: string = await this.jwtService.sign(jwtPayload);

      const refreshToken: string = await this.jwtService.sign(jwtPayload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES'),
      });

      const currentDate = moment().toISOString();

      const updatedUser = await this.prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          lastLogin: currentDate,
          lastLoginIp: ip,
        },
      });

      const pwd = 'password';
      const { [pwd]: _, ...usr } = updatedUser;

      return {
        accessToken,
        refreshToken,
        user: {
          ...usr,
        },
      };
    } catch (e) {
      throw e;
    }
  }

  async logout(response: Response): Promise<void> {
    response.clearCookie('accessToken');
    response.clearCookie('refreshToken');
  }

  async sendMail(forgotPassDto: SendTokenDto): Promise<any> {
    try {
      const { email } = forgotPassDto;

      const foundUser = await this.prisma.user.findFirst({ where: { email } });

      if (!foundUser) throw new NotFoundException('User not found');

      if (foundUser.googleId)
        throw new UnauthorizedException(
          'Google signedup users cannot reset password',
        );

      if (foundUser.id !== foundUser.id)
        throw new UnauthorizedException(
          'You are not authorized to perform this action',
        );

      const sendMail = await this.mailerService.sendUpdateEmail(email);

      return sendMail;
    } catch (e) {
      throw e;
    }
  }

  async verifyToken(dto: VerifyTokenDto): Promise<any> {
    const { token } = dto;

    const email = await this.cacheService.get(token);

    if (!email) throw new BadRequestException('Invalid token');

    const user = await this.prisma.user.findUnique({ where: { email } });

    const currentDate = moment().toISOString();

    if (user.tokenExpiresIn.toISOString() < currentDate)
      throw new BadRequestException('Token has expired');

    return `Valid Token`;
  }

  async resetPassword(dto: ForgotPasswordDto): Promise<any> {
    const { token, newPassword, confirmNewPassword } = dto;
    const email = await this.cacheService.get(token);

    if (!email) throw new BadRequestException('Invalid Token');

    const user = await this.prisma.user.findUnique({ where: { email } });

    const currentDate = moment().toISOString();

    if (user.tokenExpiresIn.toISOString() < currentDate)
      throw new BadRequestException('Token has expired');

    if (!user) throw new NotFoundException('User not found');

    if (newPassword !== confirmNewPassword)
      throw new NotAcceptableException('Passwords do not match');

    const hashedPassword = await AppUtilities.hasher(newPassword);

    const updatedPassword = await this.prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        updatedAt: moment().toISOString(),
        updatedBy: user.id,
        token: null,
        tokenExpiresIn: null,
      },
    });

    await this.cacheService.remove(token);

    const pwd = 'password';
    const { [pwd]: _, ...usr } = updatedPassword;

    return usr;
  }

  async updatePassword(dto: UpdatePasswordDto, user: User) {
    console.log(
      '🚀 ~ file: auth.service.ts:235 ~ AuthService ~ updatePassword ~ user:',
      user.id,
    );
    const { oldPassword, newPassword, confirmNewPassword } = dto;
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (foundUser.googleId)
      throw new NotAcceptableException(
        'Signedup google users, cannot change password',
      );

    if (!foundUser) throw new NotFoundException('User not found');

    if (!(await AppUtilities.validator(oldPassword, foundUser.password)))
      throw new UnauthorizedException('Invalid old password');

    if (newPassword !== confirmNewPassword)
      throw new NotAcceptableException('Passwords do not match');

    if (oldPassword === newPassword)
      throw new NotAcceptableException(
        'New password cannot be the same as old password',
      );

    const hashedPassword = await AppUtilities.hasher(newPassword);

    const updatedPassword = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: moment().toISOString(),
        updatedBy: user.id,
      },
    });

    const pwd = 'password';
    const { [pwd]: _, ...usr } = updatedPassword;

    return usr;
  }

  async googleLogin(req, ip: string) {
    if (!req.user) {
      return 'No user from google';
    }

    const { email, firstName, lastName, accessToken } = req.user;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const newUser = await this.prisma.user.create({
        data: {
          email,
          password: '',
          role: { connect: { code: ROLE_TYPE.USER } },
          googleId: accessToken,
          profile: {
            create: {
              firstName,
              lastName,
            },
          },
        },
        include: { profile: true },
      });

      await this.prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          profileId: newUser.profile.id,
        },
      });

      const pwd = 'password';
      const { [pwd]: _, ...usr } = newUser;

      return {
        message: 'User information from google',
        user: usr,
      };
    }

    const jwtPayload: JwtPayload = { email: user.email };
    const token: string = await this.jwtService.sign(jwtPayload);

    const refreshToken: string = await this.jwtService.sign(jwtPayload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES'),
    });

    const currentDate = moment().toISOString();

    const updatedUser = await this.prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        lastLogin: currentDate,
        lastLoginIp: ip,
      },
    });

    const pwd = 'password';
    const { [pwd]: _, ...usr } = updatedUser;

    return {
      ...usr,
      accessToken: token,
      refreshToken,
    };
  }
}
