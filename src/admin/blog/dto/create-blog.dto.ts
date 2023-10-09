import { IsImageUploaded } from '@@/common/decorators/file-upload.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBlogDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  briefDescription: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  body: string;

  @IsImageUploaded({ always: true })
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  image?: Express.Multer.File;
}
