import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SKILLLEVEL } from '@@common/interfaces';

export class TechnicalSkillDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public skillName: string;

  @ApiProperty({
    enum: SKILLLEVEL,
    description: 'Beginner | Intermediate | Advanced | Expert',
  })
  @IsNotEmpty()
  @IsEnum(SKILLLEVEL)
  public skillLevel: SKILLLEVEL;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public yearsOfExperience: string;
}

export class SoftSkillDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public name: string;
}
