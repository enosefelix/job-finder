import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class EducationHistDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  institution: string;

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
  degree: string;

  @ApiPropertyOptional()
  @IsString()
  fieldOfStudy: string;
}
