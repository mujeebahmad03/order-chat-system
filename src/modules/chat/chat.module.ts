import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { ChatWebSocketDocsController } from "./chat-websocket-docs.controller";

@Module({
  providers: [ChatGateway, ChatService],
  controllers: [ChatController, ChatWebSocketDocsController],
  exports: [ChatService],
})
export class ChatModule {}
