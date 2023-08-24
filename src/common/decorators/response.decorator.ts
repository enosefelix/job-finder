import { SetMetadata } from '@nestjs/common';
import { ApiResponseMetaOptions } from './interfaces/decorators.interface';

export const API_RESPONSE_META = 'api_response_metadata';

export const ApiResponseMeta = (options: ApiResponseMetaOptions) =>
  SetMetadata(API_RESPONSE_META, options);
