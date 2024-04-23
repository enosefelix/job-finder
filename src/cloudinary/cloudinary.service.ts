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
  async uploadFile(
    file,
    resourceType = ResourceType.Auto,
    request,
    id: string,
    type: string,
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { uploader, url } = v2;

      return await new Promise((resolve, reject) => {
        const folder = this.folder;
        const subFolder = this.subFolder;
        const uploadStream = uploader.upload_stream(
          {
            // create a folder to store file
            public_id: `${folder}/${subFolder}/files/${type}/${file[0].originalname}~${id}`,
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
              console.log(error);
              return error;
            }
          },
        );
        // upload
        uploadStream.end(file[0].buffer);
      });
    } catch (error) {
      console.log(error);
      return error.message;
    }
  }

  async uploadResume(
    file,
    resourceType: ResourceType.Raw,
    request,
    id: string,
  ) {
    return await this.uploadFile(file, resourceType, request, id, 'resumes');
  }

  async uploadCoverLetter(
    file,
    resourceType: ResourceType.Raw,
    request,
    id: string,
  ) {
    return await this.uploadFile(
      file,
      resourceType,
      request,
      id,
      'cover-letters',
    );
  }

  async downloadFile(publicId: string) {
    try {
      return await new Promise((resolve, reject) => {
        v2.api.resource(publicId, { resource_type: 'raw' }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    type: string,
    id: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    try {
      return await new Promise((resolve, reject) => {
        v2.uploader
          .upload_stream(
            {
              resource_type: 'image',
              // create folder to store image
              public_id: `${this.folder}/${this.subFolder}/images/${type}/${id}`,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          )
          .end(file.buffer);
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async uploadProfilePic(
    file: Express.Multer.File,
    id: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return this.uploadImage(file, 'profile-pictures', id);
  }

  async uploadBlogImage(
    file: Express.Multer.File,
    id: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return this.uploadImage(file, 'blogs', id);
  }

  async deleteBlogImage(id: string) {
    try {
      return await new Promise((resolve, reject) => {
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
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  async deleteFiles(secureUrls: string[]) {
    try {
      const deletionPromises = secureUrls.map((secure_url) => {
        return new Promise((resolve, reject) => {
          v2.uploader.destroy(
            secure_url,
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
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }
}
