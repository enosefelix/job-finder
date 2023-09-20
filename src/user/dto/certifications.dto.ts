import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CertificationsDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  organization: string;

  @ApiProperty()
  @IsString()
  yearIssued: string;

  @ApiProperty()
  @IsString()
  expiryYear: string;
}
