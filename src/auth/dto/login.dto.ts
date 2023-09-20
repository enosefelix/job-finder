import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: "user's login email",
  })
  @IsEmail(
    {},
    {
      message: 'Please enter a valid email address',
    },
  )
  @IsNotEmpty()
  public email: string;

  @ApiProperty({
    description: "user's login password",
  })
  @IsNotEmpty()
  @IsString()
  public password: string;
}
