import { BadRequestException, Injectable } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import { ResourceType } from '@@common/interfaces';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(private configService: ConfigService) {}
  folder = this.configService.get('cloudinary.folder');
  subFolder = this.configService.get('cloudinary.subfolder');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async uploadResume(
    file,
    resourceType = ResourceType.Raw,
    request,
    id: string,
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { uploader, url } = v2;

      return new Promise((resolve, reject) => {
        const uploadStream = uploader.upload_stream(
          {
            public_id: `${this.folder}/${this.subFolder}/files/resumes/${id}`,
            resource_type: resourceType,
            //   raw_convert: 'aspose',
            discard_original_filename: false,
            filename_override: file[0].originalname,
            //   notification_url: `http://${request}`,
          },
          async (error, result) => {
            try {
              if (error) {
                return reject(error);
              }

              resolve(result);

              return {
                message: 'document uploaded successfully!',
                result,
              };
            } catch (error) {
              return error;
            }
          },
        );

        uploadStream.end(file[0].buffer);
      });
    } catch (error) {
      return error.message;
      throw new BadRequestException(error.message);
    }
  }

  async uploadCoverLetter(
    file,
    resourceType = ResourceType.Raw,
    request,
    id: string,
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { uploader, url } = v2;

      return new Promise((resolve, reject) => {
        const uploadStream = uploader.upload_stream(
          {
            public_id: `${this.folder}/${this.subFolder}/files/cover-letters/${id}`,
            resource_type: resourceType,
            //   raw_convert: 'aspose',
            discard_original_filename: false,
            filename_override: file[0].originalname,
            //   notification_url: `http://${request}`,
          },
          async (error, result) => {
            try {
              if (error) {
                return reject(error);
              }

              resolve(result);

              return {
                message: 'document uploaded successfully!',
                result,
              };
            } catch (error) {
              return error;
            }
          },
        );

        uploadStream.end(file[0].buffer);
      });
    } catch (error) {
      return error.message;
      throw new BadRequestException(error.message);
    }
  }

  async downloadFile(publicId: string) {
    try {
      return new Promise((resolve, reject) => {
        v2.api.resource(publicId, { resource_type: 'raw' }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    id: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    try {
      return new Promise((resolve, reject) => {
        v2.uploader
          .upload_stream(
            {
              resource_type: 'image',
              public_id: `${this.folder}/${this.subFolder}/images/profile-pictures/${id}`,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          )
          .end(file.buffer);
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async uploadBlogImage(
    file: Express.Multer.File,
    id: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    try {
      return new Promise((resolve, reject) => {
        v2.uploader
          .upload_stream(
            {
              resource_type: 'image',
              public_id: `${this.folder}/${this.subFolder}/images/blogs/${id}`,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          )
          .end(file.buffer);
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteBlogImage(id: string) {
    try {
      return new Promise((resolve, reject) => {
        v2.uploader.destroy(
          `${this.folder}/${this.subFolder}/images/blogs/${id}`,
          {
            resource_type: 'image',
          },
          (error, result) => {
            if (error) {
              console.error('Error deleting image:', error);
              reject(error);
            } else {
              if (result.result === 'not found') return resolve(result);
              console.log('Image deleted successfully:', result);
              resolve(result);
            }
          },
        );
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteFiles(publicIds: string[]) {
    try {
      const deletionPromises = publicIds.map((publicId) => {
        return new Promise((resolve, reject) => {
          v2.uploader.destroy(
            publicId,
            {
              resource_type: 'raw',
            },
            (error, result) => {
              if (error) {
                console.error('Error deleting file:', error);
                reject(error);
              } else {
                if (result.result === 'not found') return resolve(result);
                console.log('File deleted successfully:', result);
                resolve(result);
              }
            },
          );
        });
      });

      await Promise.all(deletionPromises);
      return 'All files deleted successfully';
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
