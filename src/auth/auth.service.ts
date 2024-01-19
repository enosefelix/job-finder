import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './payload/jwt.payload.interface';
import { JwtService } from '@nestjs/jwt';
import {
  AUTH_ERROR_MSGS,
  ROLE_TYPE,
  USER_STATUS,
} from '@@common/interfaces/index';
import { SendResetLinkDto } from './dto/send-reset-link.dto';
import moment from 'moment';
import { AppUtilities } from '../app.utilities';
import { SignupDto } from './dto/signup.dto';
import { Prisma, User } from '@prisma/client';
import { UpdatePasswordDto } from './dto/updatePassword.dto';
import { CacheService } from '@@common/cache/cache.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CacheKeysEnums } from '@@/common/cache/cache.enums';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { GoogleStrategy } from './google.strategy';
import { PrismaClientManager } from '@@/common/database/prisma-client-manager';
import { CookieOptions, Response } from 'express';
import { MessagingQueueProducer } from '@@/messaging/queue/producer';
import { TEMPLATE } from '@@/messaging/interfaces';

@Injectable()
export class AuthService {
  private prismaClient;
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private cacheService: CacheService,
    private googleStrategy: GoogleStrategy,
    private prismaClientManager: PrismaClientManager,
    private messagingQueue: MessagingQueueProducer,
  ) {
    this.prismaClient = this.prismaClientManager.getPrismaClient();
  }

  async signup(signupDto: SignupDto): Promise<any> {
    try {
      // eslint-disable-next-line prefer-const
      let { email, password, firstName, lastName, confirmPassword } = signupDto;
      email = email.toLowerCase();

      const findUser = await this.prismaClient.user.findUnique({
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

      const role = await this.prismaClient.role.findFirst({
        where: { code: ROLE_TYPE.USER },
      });

      if (!role) throw new NotFoundException('Roles not setup');

      const user = await this.prismaClient.user.create({
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

      await this.prismaClient.user.update({
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
  ): Promise<any> {
    try {
      // eslint-disable-next-line prefer-const
      let { email, password } = loginDto;
      email = email.toLowerCase();
      const user = await this.prismaClient.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
        include: { role: true, profile: true },
      });

      if (!user || user.role.code !== ROLE_TYPE.USER)
        throw new UnauthorizedException(AUTH_ERROR_MSGS.CREDENTIALS_DONT_MATCH);

      if (user.googleId)
        throw new ConflictException(AUTH_ERROR_MSGS.GOOGLE_ALREDY_EXISTS);

      if (user.status === USER_STATUS.SUSPENDED) {
        throw new UnauthorizedException(AUTH_ERROR_MSGS.SUSPENDED_ACCOUNT_USER);
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

      const updatedUser = await this.prismaClient.user.update({
        where: { email: email.toLowerCase() },
        data: {
          lastLogin: currentDate,
          lastLoginIp: ip,
        },
        include: { profile: { select: { firstName: true, lastName: true } } },
      });

      await this.cacheService.set(
        `${CacheKeysEnums.TOKENS}:${user.id}`,
        jwtPayload,
        parseInt(process.env.JWT_EXPIRES),
      );

      const properties = AppUtilities.extractProperties(updatedUser);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [, , sessionId] = accessToken.split('.');
      this.setCookies(accessToken, response);

      const { rest } = properties;

      return {
        accessToken,
        refreshToken,
        user: {
          ...rest,
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
    try {
      // eslint-disable-next-line prefer-const
      let { email, password } = loginDto;
      email = email.toLowerCase();
      const user = await this.prismaClient.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
        include: { role: true, profile: true },
      });

      if (user?.role?.code !== ROLE_TYPE.ADMIN) {
        throw new UnauthorizedException(
          `You do not have the necessary permissions to perform this action. Only administrators are allowed to access this feature.`,
        );
      }

      if (user.status === USER_STATUS.SUSPENDED) {
        throw new UnauthorizedException(AUTH_ERROR_MSGS.SUSPENDED_ACCOUNT_USER);
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

      const updatedUser = await this.prismaClient.user.update({
        where: { email: email.toLowerCase() },
        data: {
          lastLogin: currentDate,
          lastLoginIp: ip,
        },
        include: { profile: { select: { firstName: true, lastName: true } } },
      });

      await this.cacheService.set(
        `${CacheKeysEnums.TOKENS}:${user.id}`,
        jwtPayload,
        parseInt(process.env.JWT_EXPIRES),
      );

      const properties = AppUtilities.extractProperties(updatedUser);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [, , sessionId] = accessToken.split('.');
      this.setCookies(accessToken, response);

      const { rest } = properties;

      return {
        accessToken,
        refreshToken,
        user: {
          ...rest,
        },
      };
    } catch (e) {
      console.log(e);
      throw new BadRequestException(e.message);
    }
  }

  async logout(userId: string) {
    await this.cacheService.get(`${CacheKeysEnums.TOKENS}:${userId}`);
    await this.cacheService.remove(`${CacheKeysEnums.TOKENS}:${userId}`);
  }

  async sendMail(forgotPassDto: SendResetLinkDto): Promise<any> {
    try {
      const { email } = forgotPassDto;

      const foundUser = await this.prismaClient.user.findFirst({
        where: { email },
        include: { role: true },
      });

      if (!foundUser || foundUser.role.code !== ROLE_TYPE.USER)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      if (foundUser.googleId)
        throw new UnauthorizedException(AUTH_ERROR_MSGS.GOOGLE_CANNOT_RESET);

      if (foundUser.status === USER_STATUS.SUSPENDED)
        throw new UnauthorizedException(
          AUTH_ERROR_MSGS.SUSPENDED_ACCOUNT_RESET_USER,
        );

      const sendMail = await this.messagingQueue.queueResetTokenEmail({
        email,
        templateName: TEMPLATE.RESET_MAIL_USER,
      });

      return sendMail;
    } catch (e) {
      console.log(e);
      throw new BadRequestException(e.message);
    }
  }

  async resetPassword(requestId: string, resetPasswordDto: ResetPasswordDto) {
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

    const updatedUser = await this.prismaClient.user.update(dto);

    await this.cacheService.remove(CacheKeysEnums.REQUESTS + requestId);
    return updatedUser;
  }

  async updatePassword(dto: UpdatePasswordDto, user: User): Promise<any> {
    try {
      const { oldPassword, newPassword, confirmNewPassword } = dto;
      const foundUser = await this.prismaClient.user.findUnique({
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

      const updatedPassword = await this.prismaClient.user.update({
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
    let user = await this.prismaClient.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });

    const role = await this.prismaClient.role.findUnique({
      where: {
        code: ROLE_TYPE.USER,
      },
    });

    if (!role) throw new NotFoundException('Roles not setup');

    let password = await AppUtilities.generateShortCode(10);

    password = await AppUtilities.hasher(password);

    if (!user) {
      user = await this.prismaClient.user.create({
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

    const updatedUser = await this.prismaClient.user.update({
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

      const updatedUser = await this.prismaClient.user.update({
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
    const foundUser = this.prismaClient.user.findUnique({
      where: { id: user.id },
    });

    if (!foundUser) throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

    return foundUser;
  }

  async generateAccessToken(user: User) {
    const jwtPayload: JwtPayload = { email: user.email, userId: user.id };
    return await this.jwtService.signAsync(jwtPayload);
  }

  async generateRefreshToken(user: User) {
    const jwtPayload: JwtPayload = { email: user.email, userId: user.id };
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

  async getallusers() {
    return await this.prismaClient.user.findMany({ include: { role: true } });
  }
}
