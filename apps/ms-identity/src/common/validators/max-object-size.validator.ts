import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'maxObjectSize', async: false })
export class MaxObjectSizeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) return false;
    return JSON.stringify(value).length <= 4096;
  }

  defaultMessage(): string {
    return 'domainData must not exceed 4KB when serialized';
  }
}

export function MaxObjectSize(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: MaxObjectSizeConstraint,
    });
  };
}
