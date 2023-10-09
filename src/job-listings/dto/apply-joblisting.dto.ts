import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsOptional } from 'class-validator';
import { IsAtLeastOneFileUploaded } from '@@common/decorators/file-upload.decorator';
import { Type } from 'class-transformer';

export class ApplyJobListingDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @IsAtLeastOneFileUploaded()
  @IsOptional()
  public resume?: Express.Multer.File;

  @ApiProperty({ type: 'string', format: 'binary' })
  @IsOptional()
  public coverLetter?: Express.Multer.File;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  possibleStartDate?: Date;
}
