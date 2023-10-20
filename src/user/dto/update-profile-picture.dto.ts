import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateProfilePictureDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  profilePic?: Express.Multer.File;
}
