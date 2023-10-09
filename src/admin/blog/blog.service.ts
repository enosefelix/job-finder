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
import { AUTH_ERROR_MSGS, BLOG_ERROR_MSGS } from '@@/common/interfaces';
import { CloudinaryService } from '@@/cloudinary/cloudinary.service';

@Injectable()
export class BlogService extends CrudService<
  Prisma.BlogDelegate<Prisma.RejectOnNotFound>,
  BlogMapType
> {
  private readonly logger = new Logger(BlogService.name);
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {
    super(prisma.blog);
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
      throw new BadRequestException(error.message);
    }
  }

  async getMyBlogs(
    { cursor, direction, orderBy, size, ...dto }: BlogFilterDto,
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
      throw new BadRequestException(error.message);
    }
  }

  async getMyBlog(id: string, user: User) {
    try {
      const blog = await this.prisma.blog.findFirst({
        where: { id, authorId: user.id },
        include: { author: true },
      });

      if (!blog) throw new NotFoundException(BLOG_ERROR_MSGS.BLOG_NOT_FOUND);

      return blog;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getBlog(id: string) {
    try {
      const blog = await this.prisma.blog.findUnique({
        where: { id },
        include: { author: true },
      });

      if (!blog) throw new NotFoundException(BLOG_ERROR_MSGS.BLOG_NOT_FOUND);

      return blog;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createBlog(dto: CreateBlogDto, image: Express.Multer.File, user: User) {
    try {
      const { body, ...rest } = dto;
      const findUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!findUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      const readTime = await AppUtilities.calculateReadingTime(body);

      const blog = await this.prisma.blog.create({
        data: {
          ...rest,
          image: null,
          body,
          author: { connect: { id: user.id } },
          readTime,
          createdBy: user.id,
        },
      });

      this.logger.debug('Saving blog image to cloud...');
      const uploadBlogImage: any = image
        ? await this.cloudinaryService
            .uploadBlogImage(image, blog.id)
            .catch((e) => {
              throw new BadRequestException('Invalid file type.', e);
            })
        : null;
      this.logger.debug('Image saved to the cloud successfully');

      const profilePic = uploadBlogImage?.secure_url || '';
      const updatedBlog = await this.prisma.blog.update({
        where: { id: blog.id },
        data: { image: profilePic },
      });

      return updatedBlog;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateBlog(
    id: string,
    dto: CreateBlogDto,
    image: Express.Multer.File,
    user: User,
  ) {
    try {
      const { body, ...rest } = dto;
      const findUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!findUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      const blog = await this.prisma.blog.findFirst({
        where: { id, authorId: user.id },
      });

      if (!blog) throw new NotFoundException(BLOG_ERROR_MSGS.BLOG_NOT_FOUND);

      const readTime = await AppUtilities.calculateReadingTime(body);

      this.logger.debug('Saving blog image to cloud...');
      const uploadBlogImage: any = image
        ? await this.cloudinaryService.uploadBlogImage(image, id).catch((e) => {
            throw new BadRequestException('Invalid file type.', e);
          })
        : null;
      this.logger.debug('Image saved to the cloud successfully');

      const profilePic = uploadBlogImage?.secure_url || '';
      const updatedBlog = await this.prisma.blog.update({
        where: { id },
        data: { image: profilePic, ...rest, body, readTime },
      });

      return updatedBlog;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteBlog(id: string, user: User): Promise<void> {
    try {
      const foundUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!foundUser)
        throw new NotFoundException(AUTH_ERROR_MSGS.USER_NOT_FOUND);

      const blog = await this.prisma.blog.findFirst({
        where: { id, authorId: user.id },
      });

      if (!blog) throw new NotFoundException(BLOG_ERROR_MSGS.BLOG_NOT_FOUND);

      await this.prisma.blog.delete({ where: { id } });

      this.logger.debug('Deleting image from cloud...');
      await this.cloudinaryService.deleteBlogImage(id);
      this.logger.debug('Image deleted from cloud successfully');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
