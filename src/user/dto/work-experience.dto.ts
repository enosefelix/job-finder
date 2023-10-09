import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { JobType } from '@@common/interfaces';

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
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
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
