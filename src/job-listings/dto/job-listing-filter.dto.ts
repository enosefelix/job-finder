import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Category } from '@@common/interfaces';
import { PaginationSearchOptionsDto } from '@@common/interfaces/pagination-search-options.dto';

export class JobListingFilterDto extends PaginationSearchOptionsDto {
  @ApiHideProperty()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    enum: Category,
    description: 'Hybrid | Onsite | Remote',
  })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;
}
