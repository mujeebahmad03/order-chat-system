import { PartialType, OmitType } from "@nestjs/swagger";
import { RegisterDto } from "src/modules/auth/dto";

export class UpdateUserDto extends PartialType(
  OmitType(RegisterDto, ["password"] as const),
) {}
