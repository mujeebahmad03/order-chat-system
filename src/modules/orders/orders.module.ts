import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { ChatModule } from "../chat/chat.module";

@Module({
  imports: [ChatModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
