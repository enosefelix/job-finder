import { BadRequestException } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { VALIDATION_ERROR_MSG } from '../interfaces';

export function IsImageUploaded(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isImageUploaded',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Check if the property is optional
          const isOptional =
            args.constraints &&
            args.constraints.length > 0 &&
            args.constraints[0]?.skipMissingProperties === true;

          // Validation passes if the property is optional and missing
          if (isOptional && value === undefined) {
            return true;
          }

          // Check if the value is an array and has at least one truthy element
          if (Array.isArray(value)) {
            return value.some((file) => file);
          }

          // Check if the value is truthy
          return !!value;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        defaultMessage(args: ValidationArguments) {
          throw new BadRequestException(VALIDATION_ERROR_MSG.UPLOAD_BLOG_IMAGE);
        },
      },
    });
  };
}

export function IsAtLeastOneFileUploaded(
  validationOptions?: ValidationOptions,
) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isAtLeastOneFileUploaded',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Check if the property is optional
          const isOptional =
            args.constraints &&
            args.constraints.length > 0 &&
            args.constraints[0]?.skipMissingProperties === true;

          // Validation passes if the property is optional and missing
          if (isOptional && value === undefined) {
            return true;
          }

          // Check if the value is an array and has at least one truthy element
          if (Array.isArray(value)) {
            return value.some((file) => file);
          }

          // Check if the value is truthy
          return !!value;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        defaultMessage(args: ValidationArguments) {
          throw new BadRequestException(VALIDATION_ERROR_MSG.UPLOAD_ONE_FILE);
        },
      },
    });
  };
}
