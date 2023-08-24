import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Category } from '../../common/interfaces';

export class CreateJobListingDto {
  @ApiPropertyOptional()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsString()
  career: string;

  @ApiPropertyOptional()
  @IsString()
  summary: string;

  @ApiPropertyOptional()
  @IsString()
  industry: string;

  @ApiPropertyOptional()
  @IsString()
  location: string;

  @ApiPropertyOptional()
  @IsString()
  languages: string;

  @ApiPropertyOptional()
  @IsString()
  jobPosition: string;

  @ApiPropertyOptional()
  @IsString()
  skills: string;

  @IsOptional()
  @ApiPropertyOptional({
    enum: Category,
    description: 'Hybrid | Onsite | Remote',
  })
  @IsEnum(Category)
  category?: Category;
}
