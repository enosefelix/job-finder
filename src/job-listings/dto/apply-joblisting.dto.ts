import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { IsAtLeastOneFileUploaded } from '../../common/decorators/file-upload.decorator';

export class ApplyJobListingDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @IsAtLeastOneFileUploaded()
  public resume?: Express.Multer.File;

  @ApiProperty({ type: 'string', format: 'binary' })
  @IsOptional()
  public coverLetter?: Express.Multer.File;

  @ApiProperty()
  @IsString()
  public availability?: string;
}
