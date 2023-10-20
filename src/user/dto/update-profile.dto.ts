import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName: string;

  @ApiPropertyOptional()
  @ValidateIf((obj) => obj.phone !== undefined && obj.phone !== null)
  @IsOptional()
  @MaxLength(19, {
    message: 'Invalid phone number. Valid phone number sample +2347063644568',
  })
  phone: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  profileSummary?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

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
  linkedinLink?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  personalPortfolioLink?: string;
}
