import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { JobType } from 'src/common/interfaces';

export class WorkExperienceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  position: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  organization: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  endDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty()
  @IsEnum(JobType)
  jobType: JobType;

  @ApiProperty()
  @IsArray()
  jobDescription: string[];
}
