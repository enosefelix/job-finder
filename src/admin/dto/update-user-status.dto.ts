import { USER_STATUS } from '@@/common/interfaces';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(USER_STATUS)
  status: USER_STATUS;
}
