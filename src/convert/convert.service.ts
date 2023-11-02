import { BadRequestException, Injectable } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import ConvertApi from 'convertapi';

export class FileDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  file?: Express.Multer.File;
}

@Injectable()
export class ConvertService {
  private convertapi: ConvertApi;

  constructor() {
    this.convertapi = new ConvertApi(process.env.CONVERT_API_SECRET, {
      conversionTimeout: 60,
      uploadTimeout: 60,
      downloadTimeout: 60,
      keepAlive: true,
    });
  }

  async convertFileToPDF(file: Express.Multer.File, dto: FileDto) {
    const filePath = file.buffer.toString('base64');
    console.log(
      '🚀 ~ file: convert.service.ts:29 ~ ConvertService ~ convertFileToPDF ~ filePath:',
      filePath,
    );
    console.log(
      '🚀 ~ file: convert.service.ts:28 ~ ConvertService ~ convertFileToPDF ~ file:',
      file,
    );
    try {
      console.log('service');
      this.convertapi
        .convert('pdf', {
          File: filePath,
        })
        .then(function (result) {
          // get converted file url
          console.log('Converted file url: ' + result.file.url);

          // save to file
          return result.file;
        })
        .then(function (file) {
          console.log('File saved: ' + file);
        })
        .catch(function (e) {
          console.error(e.toString());
        });
      console.log('service end');
    } catch (e) {
      console.log(e);
      throw new BadRequestException(e.message);
    }
  }
}
