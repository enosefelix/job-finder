import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  @Matches(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;':",.<>?/]*$/,
    {
      message:
        'Password is too weak! It must contain at least one uppercase letter, one lowercase letter, and one number.',
    },
  )
  newPassword?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  confirmNewPassword?: string;
}
