import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Category, ExperienceLevel, JobType } from '../../common/interfaces';

export class UpdateJobListingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  companyDetails: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  jobDescription: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  jobRequirements: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  role: string;

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

  @ApiProperty()
  @IsString()
  languages: string;

  @ApiProperty()
  @IsString()
  skills: string;

  @ApiProperty({
    enum: Category,
    description: 'Hybrid | Onsite | Remote',
  })
  @IsEnum(Category)
  category: Category;
}
