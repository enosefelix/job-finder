import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d]*$/, {
    message:
      'Password is too weak! It must contain at least one uppercase letter, one lowercase letter, and one number.',
  })
  newPassword?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  confirmNewPassword?: string;
}
