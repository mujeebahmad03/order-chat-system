import { IsString, IsInt, IsObject, Min, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateOrderDto {
  @ApiProperty({ description: "Order description" })
  @IsString()
  description: string;

  @ApiProperty({ description: "Order specifications" })
  @IsObject()
  specifications: Record<string, any>;

  @ApiProperty({ description: "Order quantity", minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: "Additional metadata" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
