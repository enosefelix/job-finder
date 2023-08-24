import { Injectable } from '@nestjs/common';
import { v2 } from 'cloudinary';
import { ResourceType } from '../common/interfaces';

@Injectable()
export class CloudinaryService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async uploadFile(file, resourceType = ResourceType.Raw, request) {
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
  }
  async downloadFile(publicId: string) {
    return new Promise((resolve, reject) => {
      //   v2.api.resource(
      //     publicId,
      //     {
      //       resource_type: resourceType,
      //       content_type: 'application/pdf',
      //     },
      //     (error, result) => {
      //       if (error) return reject(error);
      //       resolve(result);
      //     },
      //   );

      const download = v2.utils.api_url(publicId, {
        resource_type: 'pdf',
        format: 'pdf',
      });
    });
  }
}
