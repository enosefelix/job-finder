import { BadRequestException, Injectable } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import { ResourceType } from '../common/interfaces';

@Injectable()
export class CloudinaryService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async uploadFile(file, resourceType = ResourceType.Raw, request) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { uploader, url } = v2;

      return new Promise((resolve, reject) => {
        const uploadStream = uploader.upload_stream(
          {
            public_id: file[0].originalname,
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
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    try {
      return new Promise((resolve, reject) => {
        const upload = v2.uploader
          .upload_stream(
            {
              resource_type: 'image',
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
