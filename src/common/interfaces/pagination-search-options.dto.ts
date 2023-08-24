import { IsOptional, IsString } from 'class-validator';
import { PaginationOptionsDto } from '../database/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationSearchOptionsDto extends PaginationOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  term?: string;
}
