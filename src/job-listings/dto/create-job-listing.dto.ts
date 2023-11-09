import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { Category, ExperienceLevel, JobType } from '@@common/interfaces';

export class CreateJobListingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyDetails: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  jobResponsibilities: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
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
  experienceLevel: ExperienceLevel;

  @ApiPropertyOptional({
    enum: JobType,
    description:
      'FullTime | PartTime | Contract | Freelance | Internship | Temporary',
  })
  @IsEnum(JobType, { each: true })
  @IsOptional()
  jobType: JobType;

  @ApiPropertyOptional()
  @IsString()
  industry: string;

  @ApiPropertyOptional()
  @IsString()
  location: string;

  @ApiPropertyOptional({
    description: 'Health Insurance, Paid Time Off',
  })
  @IsArray()
  @IsOptional()
  benefits: string[];

  @ApiPropertyOptional({
    description: 'English, Spanish',
  })
  @IsArray()
  @IsOptional()
  languages: string[];

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
  @IsOptional()
  category: Category | null;
}
