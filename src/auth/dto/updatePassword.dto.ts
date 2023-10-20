import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  oldPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{}|;':",.<>?/]*$/,
    {
      message:
        'Password is too weak! It must contain at least one uppercase letter, one lowercase letter, and one number.',
    },
  )
  newPassword: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  confirmNewPassword: string;
}
