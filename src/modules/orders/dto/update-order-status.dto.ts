import { IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "@prisma/client";

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: "The new status for the order.",
    enum: OrderStatus,
    example: OrderStatus.PROCESSING, // Replace with an actual value from your enum
  })
  @IsEnum(OrderStatus, { message: "Status must be a valid enum value." })
  status: OrderStatus;
}
