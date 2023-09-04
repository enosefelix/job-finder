import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { SKILLLEVEL } from 'src/common/interfaces';

export class SkillDto {
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
  @Min(1)
  @IsInt()
  public yearsOfExperience: number;
}
