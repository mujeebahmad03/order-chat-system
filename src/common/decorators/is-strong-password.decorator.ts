import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isStrongPassword",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== "string") return false;

          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumber = /\d/.test(value);
          const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
            value,
          );

          return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
        },
        defaultMessage(args: ValidationArguments) {
          const value = args.value as string;
          const missingRequirements = [];

          if (!/[A-Z]/.test(value))
            missingRequirements.push("one uppercase letter");
          if (!/[a-z]/.test(value))
            missingRequirements.push("one lowercase letter");
          if (!/\d/.test(value)) missingRequirements.push("one number");
          if (!/[@$!%*?&]/.test(value))
            missingRequirements.push("one special character");

          return `Password must contain at least ${missingRequirements.join(
            ", ",
          )}.`;
        },
      },
    });
  };
}
