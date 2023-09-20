import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsString()
  firstName: string;

  @ApiPropertyOptional()
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @IsNumber()
  phone: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  profileSummary?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  profilePicUrl?: Express.Multer.File;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  githubLink?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  twitterLink?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  facebookLink?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  personalPortfolioLink?: string;
}
