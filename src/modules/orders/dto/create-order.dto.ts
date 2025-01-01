import { IsString, IsInt, IsObject, Min, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateOrderDto {
  @ApiProperty({
    description: "A brief description of the order.",
    example: "Custom T-shirt printing order",
  })
  @IsString()
  description: string;

  @ApiProperty({
    description:
      "Specifications for the order, represented as a key-value object.",
    example: { color: "blue", size: "L", material: "cotton" },
  })
  @IsObject()
  specifications: Record<string, any>;

  @ApiProperty({
    description: "Quantity of items in the order.",
    minimum: 1,
    example: 100,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description:
      "Additional metadata for the order, such as notes or tracking information.",
    example: { priority: "high", requestedDeliveryDate: "2025-01-15" },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
