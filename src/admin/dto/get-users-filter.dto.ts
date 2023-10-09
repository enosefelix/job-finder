import { ApiHideProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationSearchOptionsDto } from '@@common/interfaces/pagination-search-options.dto';
import { USER_STATUS } from '@@common/interfaces';

export class UsersFilterDto extends PaginationSearchOptionsDto {
  @ApiHideProperty()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiHideProperty()
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @ApiHideProperty()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    enum: USER_STATUS,
    description: 'Active | Inactive | Suspended',
  })
  @IsOptional()
  @IsEnum(USER_STATUS)
  status?: USER_STATUS;
}
