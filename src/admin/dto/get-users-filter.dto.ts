import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationSearchOptionsDto } from '../../common/interfaces/pagination-search-options.dto';

export class UsersFilterDto extends PaginationSearchOptionsDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @ApiPropertyOptional()
  @IsString()
  lastName?: string;
}
