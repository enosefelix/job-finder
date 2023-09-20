import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import {
  AUTH_ERROR_MSGS,
  ROLE_TYPE,
  USER_STATUS,
} from '../common/interfaces/index';
import { SendTokenDto } from './dto/send-token.dto';
import * as moment from 'moment';
import { AppUtilities } from '../app.utilities';
import { SignupDto } from './dto/signup.dto';
import { User } from '@prisma/client';
import { MailerService } from '../mailer/mailer.service';
import { ForgotPasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { CacheService } from '../common/cache/cache.service';
import { VerifyTokenDto } from './dto/verify-token.dto';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private cacheService: CacheService,
  ) {}

  async signup(signupDto: SignupDto): Promise<any> {
    try {
      // eslint-disable-next-line prefer-const
      let { email, password, firstName, lastName, confirmPassword } = signupDto;
      email = email.toLowerCase();
      const findUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (findUser?.googleId)
        throw new ConflictException(AUTH_ERROR_MSGS.GOOGLE_ALREDY_EXISTS);

      if (findUser) {
        throw new ConflictException(AUTH_ERROR_MSGS.ALREADY_EXIST);
      }

      if (password !== confirmPassword) {
        throw new BadRequestException(AUTH_ERROR_MSGS.PASSWORD_MATCH);
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
              email,
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

      const properties = AppUtilities.extractProperties(user);

      const { rest } = properties;

      return {
        user: rest,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async login(loginDto: LoginDto, ip: string): Promise<any> {
    try {
      // eslint-disable-next-line prefer-const
      let { email, password } = loginDto;
      email = email.toLowerCase();
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
        throw new UnauthorizedException(AUTH_ERROR_MSGS.CREDENTIALS_DONT_MATCH);

      if (user.googleId)
        throw new ConflictException(AUTH_ERROR_MSGS.GOOGLE_ALREDY_EXISTS);

      if (user.status === USER_STATUS.SUSPENDED) {
        throw new UnauthorizedException(AUTH_ERROR_MSGS.SUSPENDED_ACCOUNT);
      }

      if (!(await AppUtilities.validator(password, user.password)))
        throw new UnauthorizedException(AUTH_ERROR_MSGS.INVALID_CREDENTIALS);

      const jwtPayload: JwtPayload = { email: user.email, userId: user.id };
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
        include: { profile: { select: { firstName: true, lastName: true } } },
      });

      const properties = AppUtilities.extractProperties(updatedUser);

      const { rest } = properties;

      return {
        accessToken,
        refreshToken,
        user: {
          ...rest,
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

      if (!foundUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      if (foundUser.googleId)
        throw new UnauthorizedException(AUTH_ERROR_MSGS.GOOGLE_CANNOT_RESET);

      if (foundUser.id !== foundUser.id)
        throw new ForbiddenException(AUTH_ERROR_MSGS.FORBIDDEN);

      const sendMail = await this.mailerService.sendUpdateEmail(email);

      return sendMail;
    } catch (e) {
      throw e;
    }
  }

  async verifyToken({ token }: VerifyTokenDto): Promise<string> {
    try {
      const email = await this.cacheService.get(token);

      if (!email) throw new BadRequestException(AUTH_ERROR_MSGS.INVALID_TOKEN);

      const user = await this.prisma.user.findUnique({ where: { email } });

      const storedSalt = user.token;
      const hashedProvidedTokenWithSalt = await AppUtilities.validator(
        token,
        storedSalt,
      );

      const currentDate = moment().toISOString();
      if (!hashedProvidedTokenWithSalt)
        throw new BadRequestException('Invalid Token');

      if (user.tokenExpiresIn.toISOString() < currentDate)
        throw new BadRequestException(AUTH_ERROR_MSGS.EXPIRED_TOKEN);

      return AUTH_ERROR_MSGS.VALID_TOKEN;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async resetPassword(dto: ForgotPasswordDto): Promise<any> {
    try {
      const { token, newPassword, confirmNewPassword } = dto;

      // Run the verify token function
      await this.verifyToken({ token });

      const email = await this.cacheService.get(token);

      if (!email) throw new BadRequestException(AUTH_ERROR_MSGS.INVALID_TOKEN);

      const user = await this.prisma.user.findUnique({ where: { email } });

      const currentDate = moment().toISOString();

      if (user.tokenExpiresIn.toISOString() < currentDate)
        throw new BadRequestException(AUTH_ERROR_MSGS.EXPIRED_TOKEN);

      if (!user) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      if (newPassword !== confirmNewPassword)
        throw new NotAcceptableException(AUTH_ERROR_MSGS.PASSWORD_MATCH);

      const hashedPassword = await AppUtilities.hasher(newPassword);

      const updatedPassword = await this.prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          updatedBy: user.id,
          token: null,
          tokenExpiresIn: null,
        },
      });

      await this.cacheService.remove(token);

      const properties = AppUtilities.extractProperties(updatedPassword);

      const { rest } = properties;

      return {
        user: rest,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updatePassword(dto: UpdatePasswordDto, user: User): Promise<any> {
    try {
      const { oldPassword, newPassword, confirmNewPassword } = dto;
      const foundUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (foundUser.googleId)
        throw new NotAcceptableException(
          AUTH_ERROR_MSGS.GOOGLE_CHANGE_PASS_ERROR,
        );

      if (!foundUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      if (!(await AppUtilities.validator(oldPassword, foundUser.password)))
        throw new UnauthorizedException(AUTH_ERROR_MSGS.INVALID_OLD_PASSWORD);

      if (newPassword !== confirmNewPassword)
        throw new NotAcceptableException(AUTH_ERROR_MSGS.PASSWORD_MATCH);

      if (oldPassword === newPassword)
        throw new NotAcceptableException(AUTH_ERROR_MSGS.SAME_PASSWORD_ERROR);

      const hashedPassword = await AppUtilities.hasher(newPassword);

      const updatedPassword = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          updatedBy: user.id,
        },
      });

      const properties = AppUtilities.extractProperties(updatedPassword);

      const { rest } = properties;

      return {
        user: rest,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async googleLogin(req, ip: string): Promise<any> {
    try {
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
                email,
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

        const properties = AppUtilities.extractProperties(newUser);

        const { rest } = properties;

        return {
          user: rest,
        };
      }

      const jwtPayload: JwtPayload = { email: user.email, userId: user.id };
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

      const properties = AppUtilities.extractProperties(updatedUser);

      const { rest } = properties;

      return {
        ...rest,
        accessToken: token,
        refreshToken,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async verifyUser(user: User): Promise<User> {
    const foundUser = this.prisma.user.findUnique({ where: { id: user.id } });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    return foundUser;
  }
}
