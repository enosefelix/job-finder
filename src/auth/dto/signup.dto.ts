import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class SignupDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public lastName: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  public email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d]*$/, {
    message:
      'Password is too weak! It must contain at least one uppercase letter, one lowercase letter, and one number.',
  })
  public password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public confirmPassword: string;
}
