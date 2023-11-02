import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConvertService, FileDto } from './convert.service';
import { ApiResponseMeta } from '@@/common/decorators/response.decorator';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('convert')
export class ConvertController {
  constructor(private readonly convertService: ConvertService) {}

  @ApiResponseMeta({ message: 'File Uploaded Successfully' })
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileDto })
  async convertFileToPDF(
    @Body() dto: FileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('controller');
    return this.convertService.convertFileToPDF(file, dto);
  }
}
