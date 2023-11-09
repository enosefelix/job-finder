import { CrudService } from '@@/common/database/crud.service';
import { Prisma, User } from '@prisma/client';
import { BlogMapType } from './blog.maptype';
import { PrismaService } from '@@/common/prisma/prisma.service';
import { BlogFilterDto } from './dto/blog-filter.dto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppUtilities } from '@@/app.utilities';
import { CreateBlogDto } from './dto/create-blog.dto';
import {
  AUTH_ERROR_MSGS,
  BLOG_ERROR_MSGS,
  BLOG_STATUS,
} from '@@/common/interfaces';
import { CloudinaryService } from '@@/cloudinary/cloudinary.service';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { UpdateBlogStatusDto } from './dto/update-blog-status.dto';
import { AuthService } from '@@/auth/auth.service';
import { AdminBlogFilterDto } from '../dto/admin-blogs.dto';
import { PrismaClientManager } from '@@/common/database/prisma-client-manager';

@Injectable()
export class BlogService extends CrudService<
  Prisma.BlogDelegate<Prisma.RejectOnNotFound>,
  BlogMapType
> {
  private prismaClient;
  private readonly logger = new Logger(BlogService.name);
  constructor(
    private prismaClientManager: PrismaClientManager,
    private prisma: PrismaService,
    private authService: AuthService,
    private cloudinaryService: CloudinaryService,
  ) {
    super(prisma.blog);
    this.prismaClient = this.prismaClientManager.getPrismaClient();
  }

  async getAllBlogs({
    cursor,
    direction,
    orderBy,
    size,
    ...dto
  }: BlogFilterDto) {
    try {
      const parsedQueryFilters = await this.parseQueryFilter(dto, [
        'title',
        'body',
        'briefDescription',
        {
          key: 'title',
          where: (title) => ({
            title: {
              contains: title,
              mode: 'insensitive',
            },
          }),
        },
      ]);

      const args: Prisma.BlogFindManyArgs = {
        where: {
          ...parsedQueryFilters,
          status: BLOG_STATUS.APPROVED,
        },
        include: { author: true },
      };

      const blogs = await this.findManyPaginate(args, {
        cursor,
        direction,
        orderBy: orderBy || { createdAt: direction },
        size,
      });

      AppUtilities.addTimestamps(blogs);

      return blogs;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async getMyBlogs(
    { cursor, direction, orderBy, size, ...dto }: AdminBlogFilterDto,
    user: User,
  ) {
    try {
      const parsedQueryFilters = await this.parseQueryFilter(dto, [
        'title',
        'body',
        'briefDescription',
        {
          key: 'title',
          where: (title) => ({
            title: {
              contains: title,
              mode: 'insensitive',
            },
          }),
        },
        {
          key: 'status',
          where: (status) => {
            return {
              status: {
                equals: status as BLOG_STATUS,
              },
            };
          },
        },
      ]);

      const args: Prisma.BlogFindManyArgs = {
        where: {
          ...parsedQueryFilters,
          author: { id: user.id },
        },
        include: { author: true },
      };

      const blogs = await this.findManyPaginate(args, {
        cursor,
        direction,
        orderBy: orderBy || { createdAt: direction },
        size,
      });

      AppUtilities.addTimestamps(blogs);

      return blogs;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async getMyBlog(id: string, user: User) {
    try {
      const blog = await this.prismaClient.blog.findFirst({
        where: { id, authorId: user.id },
        include: { author: true },
      });

      if (!blog) throw new NotFoundException(BLOG_ERROR_MSGS.BLOG_NOT_FOUND);

      return blog;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async getBlog(id: string) {
    try {
      const blog = await this.prismaClient.blog.findUnique({
        where: { id },
        include: { author: true },
      });

      if (!blog) throw new NotFoundException(BLOG_ERROR_MSGS.BLOG_NOT_FOUND);

      return blog;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async createBlog(dto: CreateBlogDto, image: Express.Multer.File, user: User) {
    try {
      const { body, ...rest } = dto;
      const findUser = await this.prismaClient.user.findUnique({
        where: { id: user.id },
      });

      if (!findUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      const readTime = await AppUtilities.calculateReadingTime(body);

      const blog = await this.prismaClient.blog.create({
        data: {
          ...rest,
          image: null,
          body,
          author: { connect: { id: user.id } },
          readTime,
          createdBy: user.id,
          status: BLOG_STATUS.PENDING,
        },
      });

      this.logger.debug('Saving blog image to cloud...');
      const uploadBlogImage: any = image
        ? await this.cloudinaryService
            .uploadBlogImage(image, blog.id)
            .catch((e) => {
              console.log(e);
              throw new BadRequestException(
                'Invalid file type, must be an image.',
                e,
              );
            })
        : null;
      this.logger.debug('Image saved to the cloud successfully');

      const profilePic = uploadBlogImage?.secure_url || '';
      const updatedBlog = await this.prismaClient.blog.update({
        where: { id: blog.id },
        data: { image: profilePic },
      });

      return updatedBlog;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async updateBlog(
    id: string,
    dto: UpdateBlogDto,
    image: Express.Multer.File,
    user: User,
  ) {
    try {
      const { body, ...rest } = dto;
      const findUser = await this.prismaClient.user.findUnique({
        where: { id: user.id },
      });

      if (!findUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      const blog = await this.prismaClient.blog.findFirst({
        where: { id, authorId: user.id },
      });

      if (!blog) throw new NotFoundException(BLOG_ERROR_MSGS.BLOG_NOT_FOUND);

      const readTime = await AppUtilities.calculateReadingTime(body);

      this.logger.debug('Saving blog image to cloud...');
      const uploadBlogImage: any = image
        ? await this.cloudinaryService.uploadBlogImage(image, id).catch((e) => {
            console.log(e);
            throw new BadRequestException(
              'Invalid file type, must be an image.',
              e,
            );
          })
        : null;
      this.logger.debug('Image saved to the cloud successfully');

      const profilePic = uploadBlogImage?.secure_url || '';
      const updatedBlog = await this.prismaClient.blog.update({
        where: { id },
        data: { image: profilePic, ...rest, body, readTime },
      });

      return updatedBlog;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async updateBlogStatus(
    id: string,
    dto: UpdateBlogStatusDto,
    user: User,
  ): Promise<any> {
    try {
      await this.authService.verifyUser(user);

      const blog = await this.prismaClient.blog.findUnique({
        where: { id },
      });

      if (!blog) throw new NotFoundException(BLOG_ERROR_MSGS.BLOG_NOT_FOUND);

      const { status } = dto;

      if (
        (status === BLOG_STATUS.APPROVED &&
          blog.status === BLOG_STATUS.PENDING) ||
        (status === BLOG_STATUS.APPROVED &&
          blog.status === BLOG_STATUS.REJECTED)
      ) {
        return await this.prismaClient.blog.update({
          where: { id },
          data: {
            status: status as BLOG_STATUS,
            approvedBy: { connect: { id: user.id } },
            updatedBy: user.id,
          },
          include: {
            approvedBy: { select: { id: true, email: true, status: true } },
          },
        });
      } else if (
        (status === BLOG_STATUS.REJECTED &&
          blog.status === BLOG_STATUS.PENDING) ||
        (status === BLOG_STATUS.REJECTED &&
          blog.status === BLOG_STATUS.APPROVED)
      ) {
        return await this.prismaClient.blog.update({
          where: { id },
          data: {
            status: status as BLOG_STATUS,
            updatedBy: user.id,
          },
        });
      } else if (
        (status === BLOG_STATUS.PENDING &&
          blog.status === BLOG_STATUS.REJECTED) ||
        (status === BLOG_STATUS.PENDING && blog.status === BLOG_STATUS.APPROVED)
      ) {
        return await this.prismaClient.blog.update({
          where: { id },
          data: {
            status: status as BLOG_STATUS,
            updatedBy: user.id,
          },
        });
      } else {
        throw new BadRequestException(`Job listing is already ${status}`);
      }
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async deleteBlog(id: string, user: User): Promise<void> {
    try {
      const foundUser = await this.prismaClient.user.findUnique({
        where: { id: user.id },
      });

      if (!foundUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      const blog = await this.prismaClient.blog.findFirst({
        where: { id, authorId: user.id },
      });

      if (!blog) throw new NotFoundException(BLOG_ERROR_MSGS.BLOG_NOT_FOUND);

      await this.prismaClient.blog.delete({ where: { id } });

      this.logger.debug('Deleting image from cloud...');
      await this.cloudinaryService.deleteBlogImage(id);
      this.logger.debug('Image deleted from cloud successfully');
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }
}
