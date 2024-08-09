import { CacheKeysEnums } from '@@/common/cache/cache.enums';
import { TEMPLATE } from '@@/mailer/interfaces';
import { MessagingService } from '@@/messaging/messaging.service';
import { MessagingQueueProducer } from '@@/messaging/queue/producer';
import { CacheService } from '@@common/cache/cache.service';
import {
  AUTH_ERROR_MSGS,
  ROLE_TYPE,
  USER_STATUS,
} from '@@common/interfaces/index';
import { PrismaService } from '@@common/prisma/prisma.service';
import { MailerService } from '@@mailer/mailer.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { CookieOptions, Response } from 'express';
import moment from 'moment';
import { AppUtilities } from '../app.utilities';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendResetLinkDto } from './dto/send-reset-link.dto';
import { SignupDto } from './dto/signup.dto';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { GoogleStrategy } from './google.strategy';
import { JwtPayload } from './payload/jwt.payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private cacheService: CacheService,
    private googleStrategy: GoogleStrategy,
    private messagingService: MessagingService,
    private messagingQueueProducer: MessagingQueueProducer,
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

      const role = await this.prisma.role.findFirst({
        where: { code: ROLE_TYPE.USER },
      });

      if (!role) throw new NotFoundException('Roles not setup');

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
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async login(
    loginDto: LoginDto,
    ip: string,
    response: Response,
    roleType: ROLE_TYPE,
  ): Promise<any> {
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
        include: {
          role: {
            select: {
              code: true,
            },
          },
          profile: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!user || user.role.code !== roleType)
        throw new UnauthorizedException(AUTH_ERROR_MSGS.CREDENTIALS_DONT_MATCH);
      if (user.googleId)
        throw new ConflictException(AUTH_ERROR_MSGS.GOOGLE_ALREDY_EXISTS);
      if (user.status === USER_STATUS.SUSPENDED) {
        throw new UnauthorizedException(AUTH_ERROR_MSGS.SUSPENDED_ACCOUNT_USER);
      }

      if (!(await AppUtilities.validator(password, user.password)))
        throw new UnauthorizedException(AUTH_ERROR_MSGS.INVALID_CREDENTIALS);

      const jwtPayload: JwtPayload = {
        email,
        userId: user.id,
        role: user.role.code,
      };

      const accessToken: string = this.jwtService.sign(jwtPayload);
      const refreshToken: string = this.jwtService.sign(jwtPayload, {
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
        include: {
          profile: { select: { firstName: true, lastName: true } },
          role: true,
        },
      });

      await this.cacheService.set(
        `${CacheKeysEnums.TOKENS}:${user.id}`,
        jwtPayload,
        parseInt(process.env.JWT_EXPIRES),
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [, , sessionId] = accessToken.split('.');
      this.setCookies(accessToken, response);

      // strip out the password before returning the user
      const pwd = 'password';
      // eslint-disable-next-line
      const { [pwd]: _, ...usr } = updatedUser;

      return {
        token: accessToken,
        refreshToken,
        user: {
          ...usr,
          role: { ...usr.role },
        },
      };
    } catch (e) {
      console.log(e);
      throw new BadRequestException(e.message);
    }
  }

  async adminLogin(
    loginDto: LoginDto,
    ip: string,
    response: Response,
  ): Promise<any> {
    return await this.login(loginDto, ip, response, ROLE_TYPE.ADMIN);
  }

  async userLogin(
    loginDto: LoginDto,
    ip: string,
    response: Response,
  ): Promise<any> {
    return await this.login(loginDto, ip, response, ROLE_TYPE.USER);
  }

  async logout(userId: string) {
    await this.cacheService.get(`${CacheKeysEnums.TOKENS}:${userId}`);
    await this.cacheService.remove(`${CacheKeysEnums.TOKENS}:${userId}`);
  }

  async sendMail(
    forgotPassDto: SendResetLinkDto,
    roleType: ROLE_TYPE,
  ): Promise<any> {
    try {
      const { email } = forgotPassDto;

      const foundUser = await this.prisma.user.findFirst({
        where: { email },
        include: { profile: true, role: true },
      });

      if (!foundUser || foundUser.role.code !== roleType)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      if (foundUser.googleId)
        throw new UnauthorizedException(AUTH_ERROR_MSGS.GOOGLE_CANNOT_RESET);

      if (foundUser.status === USER_STATUS.SUSPENDED)
        throw new UnauthorizedException(
          AUTH_ERROR_MSGS.SUSPENDED_ACCOUNT_RESET_USER,
        );

      let template;
      switch (roleType) {
        case ROLE_TYPE.ADMIN:
          template = TEMPLATE.RESET_MAIL_ADMIN;
          break;
        case ROLE_TYPE.USER:
          template = TEMPLATE.RESET_MAIL_USER;
          break;
        // Add more cases if there are more role types
        default:
          throw new BadRequestException('Invalid role type');
      }

      const sendMail = await this.messagingQueueProducer.queueResetTokenEmail({
        user: foundUser,
        templateName: template,
      });

      return sendMail;
    } catch (e) {
      console.log(e);
      throw new BadRequestException(e.message);
    }
  }

  async resetPassword(
    requestId: string,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<any> {
    const tokenData = await this.cacheService.get(
      CacheKeysEnums.REQUESTS + requestId,
    );

    if (!tokenData) {
      throw new BadRequestException(AUTH_ERROR_MSGS.EXPIRED_LINK);
    }

    const { newPassword, confirmNewPassword } = resetPasswordDto;

    const hashedPassword = await AppUtilities.hasher(newPassword);

    if (newPassword !== confirmNewPassword)
      throw new NotAcceptableException(AUTH_ERROR_MSGS.PASSWORD_MATCH);

    const dto: Prisma.UserUpdateArgs = {
      where: { email: tokenData.email },
      data: {
        password: hashedPassword,
        updatedBy: tokenData.userId,
      },
    };

    const updatedUser = await this.prisma.user.update(dto);

    await this.cacheService.remove(CacheKeysEnums.REQUESTS + requestId);
    return updatedUser;
  }

  async updatePassword(dto: UpdatePasswordDto, user: User): Promise<any> {
    try {
      const { oldPassword, newPassword, confirmNewPassword } = dto;

      if (user.googleId)
        throw new NotAcceptableException(
          AUTH_ERROR_MSGS.GOOGLE_CHANGE_PASS_ERROR,
        );

      if (!user) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      if (!(await AppUtilities.validator(oldPassword, user.password)))
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
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async findOrCreateUser(dto: GoogleAuthDto, accessToken: string) {
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });

    const role = await this.prisma.role.findUnique({
      where: {
        code: ROLE_TYPE.USER,
      },
    });

    if (!role) throw new NotFoundException('Roles not setup');

    let password = await AppUtilities.generateShortCode(10);

    password = await AppUtilities.hasher(password);

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password,
          role: { connect: { code: ROLE_TYPE.USER } },
          googleId: accessToken,
          profile: {
            create: {
              firstName: dto.firstName,
              lastName: dto.lastName,
              email: dto.email,
              profilePic: dto.picture,
            },
          },
        },
        include: { profile: true },
      });
    }
    delete user.password;
    return user;
  }

  async googleLogin(req: any): Promise<any> {
    try {
      if (!req.user) {
        return 'No user from google';
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, firstName, lastName, accessToken } = req.user;

      const user = await this.findOrCreateUser(req.user, accessToken);

      const access_token: string = await this.generateAccessToken(user);
      const refreshToken: string = await this.generateRefreshToken(user);

      return { user, accessToken: access_token, refreshToken };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async googleLoginCallback(user: User, email: string, ip: string) {
    const token: string = await this.generateAccessToken(user);
    const refreshToken: string = await this.generateRefreshToken(user);

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
  }

  async googleClientAuth(accessToken: string, ip: string): Promise<any> {
    try {
      const googleUser = await this.googleStrategy.clientValidate(accessToken);
      const user = await this.findOrCreateUser(googleUser, accessToken);

      const token: string = await this.generateAccessToken(user);
      const refreshToken: string = await this.generateRefreshToken(user);

      const currentDate = moment().toISOString();

      const updatedUser = await this.prisma.user.update({
        where: { googleId: user.googleId },
        data: {
          lastLogin: currentDate,
          lastLoginIp: ip,
        },
      });

      return { updatedUser, accessToken: token, refreshToken };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async verifyUser(user: User): Promise<User> {
    const foundUser = this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    return foundUser;
  }

  async generateAccessToken(user: any) {
    const jwtPayload: JwtPayload = {
      email: user.email,
      userId: user.id,
      role: user.role.code,
    };
    return await this.jwtService.signAsync(jwtPayload);
  }

  async generateRefreshToken(user: any) {
    const jwtPayload: JwtPayload = {
      email: user.email,
      userId: user.id,
      role: user.role.code,
    };
    return await this.jwtService.sign(jwtPayload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES'),
    });
  }

  private setCookies(token: string, response: Response) {
    const maxAge = parseInt(process.env.JWT_EXPIRES);
    const expires = new Date(new Date().getTime() + maxAge);
    const cookieOptions: CookieOptions = { maxAge, expires, httpOnly: true };
    if (['remote', 'prod'].includes(this.configService.get('app.stage'))) {
      cookieOptions.sameSite = 'none';
      cookieOptions.secure = true;
    }
    response.cookie('access_token', token, cookieOptions);
  }
}
