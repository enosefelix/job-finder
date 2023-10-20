import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Category, ExperienceLevel, JobType } from '@@common/interfaces';

export class UpdateJobListingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsString()
  companyDetails: string;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  jobResponsibilities: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  jobRequirements: string[];

  @ApiPropertyOptional()
  @IsString()
  salary: string;

  @ApiProperty({
    enum: ExperienceLevel,
    description:
      'Junior | MidLevel | Senior | EntryLevel | Internship | Associate | Principal',
  })
  @IsEnum(ExperienceLevel)
  experienceLevel: ExperienceLevel;

  @ApiProperty({
    enum: JobType,
    description:
      'FullTime | PartTime | Contract | Freelance | Internship | Temporary',
  })
  @IsEnum(JobType)
  jobType: JobType;

  @ApiProperty()
  @IsString()
  industry: string;

  @ApiProperty()
  @IsString()
  location: string;

  @ApiProperty({
    description: 'Health Insurance, Paid Time Off',
  })
  @IsArray()
  @IsOptional()
  benefits: string[];

  @ApiProperty({
    description: 'English, Spanish',
  })
  @IsArray()
  @IsOptional()
  languages: string[];

  @ApiProperty({
    description: 'Nodejs, MongoDB',
  })
  @IsArray()
  @IsOptional()
  skills: string[];

  @ApiProperty({
    enum: Category,
    description: 'Hybrid | Onsite | Remote',
  })
  @IsEnum(Category)
  category: Category;
}
