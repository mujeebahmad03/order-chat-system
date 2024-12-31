export class PasswordStrengthValidator {
  validate(password: string): boolean {
    const errors = [];

    if (!/[A-Z]/.test(password)) {
      errors.push("an uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("a lowercase letter");
    }

    if (!/\d/.test(password)) {
      errors.push("a number");
    }

    if (!/[@$!%*?&]/.test(password)) {
      errors.push("a special character (@$!%*?&)");
    }

    // Attach the errors to the validation context for custom error messages
    (this as any).errors = errors;
    return errors.length === 0;
  }

  defaultMessage(): string {
    const errors = (this as any).errors;
    return `Password must include ${errors.join(", ")}`;
  }
}
