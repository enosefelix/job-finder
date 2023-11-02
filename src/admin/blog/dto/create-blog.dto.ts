import { IsImageUploaded } from '@@/common/decorators/file-upload.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBlogDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  briefDescription: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body: string;

  @IsImageUploaded({ always: true })
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  image?: Express.Multer.File;
}
