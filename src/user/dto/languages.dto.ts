import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { LANGUAGE_PROFICIENCY } from '@@common/interfaces';

export class LanguagesDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  languageName: string;

  @ApiProperty({
    enum: LANGUAGE_PROFICIENCY,
    description: 'Basic | Fluent | Coversational | Native | Proficient',
  })
  @IsEnum(LANGUAGE_PROFICIENCY)
  @IsNotEmpty()
  proficiency: LANGUAGE_PROFICIENCY;
}
