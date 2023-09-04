import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { IsAtLeastOneFileUploaded } from '../../common/decorators/file-upload.decorator';

export class ApplyJobListingDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsAtLeastOneFileUploaded()
  @IsOptional()
  public resume?: Express.Multer.File;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  public coverLetter?: Express.Multer.File;

  @ApiProperty()
  @IsString()
  public availability: string;
}
