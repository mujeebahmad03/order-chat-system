import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

export class UserResponse {
  @ApiProperty({
    description: "Unique identifier of the user.",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Full name of the user.",
    example: "John Doe",
  })
  name: string;

  @ApiProperty({
    description: "Email address of the user.",
    example: "john.doe@example.com",
  })
  email: string;

  @ApiProperty({
    description: "Role assigned to the user.",
    enum: UserRole,
    example: UserRole.REGULAR,
  })
  role: UserRole;
}

export class AuthResponse {
  @ApiProperty({
    description:
      "JWT access token used for authenticating subsequent requests.",
    example:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  })
  accessToken: string;

  @ApiProperty({
    description: "Details of the authenticated user.",
    example: {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "John Doe",
      email: "john.doe@example.com",
      role: UserRole.REGULAR,
    },
  })
  user: UserResponse;
}
