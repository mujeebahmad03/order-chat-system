import { ApiProperty } from "@nestjs/swagger";
import { Order as PrismaOrder, OrderStatus } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";

export class OrderEntity implements PrismaOrder {
  @ApiProperty()
  id: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  specifications: JsonValue;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ required: false })
  metadata: JsonValue;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
