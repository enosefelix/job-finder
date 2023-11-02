import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Category, ExperienceLevel, JobType } from '@@common/interfaces';

export class CreateJobListingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiPropertyOptional()
  @IsString()
  companyDetails: string;

  @ApiPropertyOptional()
  @IsArray()
  jobResponsibilities: string[];

  @ApiPropertyOptional()
  @IsArray()
  jobRequirements: string[];

  @ApiPropertyOptional()
  @IsString()
  salary: string;

  @ApiPropertyOptional({
    enum: ExperienceLevel,
    description:
      'Junior | MidLevel | Senior | EntryLevel | Internship | Associate | Principal',
  })
  @IsEnum(ExperienceLevel, { each: true })
  @IsOptional()
  experienceLevel: ExperienceLevel | null | string = '';

  @ApiPropertyOptional({
    enum: JobType,
    description:
      'FullTime | PartTime | Contract | Freelance | Internship | Temporary',
  })
  @IsEnum(JobType, { each: true })
  @IsOptional()
  jobType: JobType | null | string = '';

  @ApiProperty()
  @IsString()
  industry: string;

  @ApiProperty()
  @IsString()
  location: string;

  @ApiPropertyOptional({
    description: 'Health Insurance, Dental Insurance',
  })
  Optionall;
  @IsArray()
  @IsOptional()
  benefits: string[];

  @ApiPropertyOptional({
    description: 'English, Spanish',
  })
  @IsOptional()
  @IsArray()
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Nodejs, MongoDB',
  })
  @IsArray()
  @IsOptional()
  skills: string[];

  @ApiPropertyOptional({
    enum: Category,
    description: 'Hybrid | Onsite | Remote',
  })
  @IsEnum(Category, { each: true })
  @IsOptional()
  category: Category | null | string = '';
}
