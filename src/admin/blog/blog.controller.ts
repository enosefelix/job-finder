import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogFilterDto } from './dto/blog-filter.dto';
import { ApiResponseMeta } from '@@/common/decorators/response.decorator';
import { ApiTags } from '@nestjs/swagger';
import { API_TAGS } from '@@/common/interfaces';
import { User } from '@prisma/client';

@ApiTags(API_TAGS.BLOGS)
@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @ApiResponseMeta({ message: 'Fetched Blogs Successfully' })
  @Get()
  async getAllBlogs(@Query() dto: BlogFilterDto) {
    return this.blogService.getAllBlogs(dto);
  }

  @ApiResponseMeta({ message: 'Fetched Blog Successfully' })
  @Get('/:id')
  async getMyBlog(@Param('id') id: string, user: User) {
    return this.blogService.getMyBlog(id, user);
  }
}
