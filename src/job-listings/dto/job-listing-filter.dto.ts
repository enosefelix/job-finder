import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Category } from '../../common/interfaces';
import { PaginationSearchOptionsDto } from '../../common/interfaces/pagination-search-options.dto';

export class JobListingFilterDto extends PaginationSearchOptionsDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @ApiPropertyOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @ApiPropertyOptional()
  @IsEnum(Category)
  category?: Category;
}
