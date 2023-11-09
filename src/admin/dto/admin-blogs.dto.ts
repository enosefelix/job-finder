import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationSearchOptionsDto } from '@@common/interfaces/pagination-search-options.dto';
import { BLOG_STATUS } from '@@/common/interfaces';

export class AdminBlogFilterDto extends PaginationSearchOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  briefDescription?: string;

  @ApiPropertyOptional({
    enum: BLOG_STATUS,
    description: 'Pending | Rejected | Approved',
  })
  @IsOptional()
  @IsEnum(BLOG_STATUS)
  status?: BLOG_STATUS;
}
