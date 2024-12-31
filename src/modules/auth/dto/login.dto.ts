import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
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
  })
  @IsString()
  @IsNotEmpty({ message: "Password is required" })
  password: string;
}
