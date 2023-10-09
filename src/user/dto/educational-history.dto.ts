import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EducationHistDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  institution: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  degreeType: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional()
  @IsString()
  fieldOfStudy: string;
}
