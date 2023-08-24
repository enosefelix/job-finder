import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

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
          const dto = args.object as Record<string, any>;
          return dto.resume !== '' || dto.coverLetter !== '';
        },
        defaultMessage(args: ValidationArguments) {
          return 'At least one document (resume or cover letter) must be uploaded.';
        },
      },
    });
  };
}
