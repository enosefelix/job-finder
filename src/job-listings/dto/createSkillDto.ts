import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SKILLLEVEL } from '../../common/interfaces';

export class CreateSkillDto {
  @ApiPropertyOptional()
  @IsString()
  skillName: string;

  @IsEnum(SKILLLEVEL)
  @IsOptional()
  skillLevel: SKILLLEVEL;

  @ApiPropertyOptional()
  @IsNumber()
  yearsOfExperience: number;
}
