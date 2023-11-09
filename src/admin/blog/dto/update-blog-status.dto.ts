import { BLOG_STATUS } from '@@/common/interfaces';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateBlogStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(BLOG_STATUS)
  status: BLOG_STATUS;
}
