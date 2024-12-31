import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Validate,
} from "class-validator";
import { PasswordStrengthValidator } from "src/common/helpers";

export class RegisterDto {
  @ApiProperty({
    title: "Name",
    description: "Full name of the user",
    example: "John Doe",
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "Name is required" })
  @MinLength(2, { message: "Name must be at least 2 characters long" })
  @MaxLength(50, { message: "Name cannot exceed 50 characters" })
  name: string;

  @ApiProperty({
    title: "Email Address",
    description: "User's email address",
    example: "johndoe@example.com",
  })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @ApiProperty({
    title: "Password",
    description: "Password for the user account",
    example: "StrongP@ssw0rd",
    minLength: 8,
    maxLength: 20,
    format:
      "At least one uppercase letter, one lowercase letter, one number, and one special character",
  })
  @IsString()
  @IsNotEmpty({ message: "Password is required" })
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @MaxLength(20, { message: "Password cannot exceed 20 characters" })
  @Validate(PasswordStrengthValidator, {
    message: "Password does not meet the required strength criteria",
  })
  password: string;
}
