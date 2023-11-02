import { JOB_LISTING_STATUS } from '@@/common/interfaces';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateJobListingStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(JOB_LISTING_STATUS)
  status: JOB_LISTING_STATUS;
}
