import { Logger, UseGuards } from "@nestjs/common";
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from "@nestjs/websockets";
import { UserRole } from "@prisma/client";
import { Server, Socket } from "socket.io";

import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "../auth/guard";
import { ChatMessage } from "./interfaces";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
@UseGuards(JwtAuthGuard)
export class ChatGateway {
  private readonly logger = new Logger(ChatGateway.name);
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    try {
      // Get token from handshake auth
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify and decode token (implement this based on your JWT setup)
      const user = await this.chatService.verifyToken(token);
      if (!user) {
        client.disconnect();
        return;
      }

      // Store user data in socket
      client.data.user = user;
    } catch (error) {
      this.logger.warn(error);
      client.disconnect();
    }
  }

  @SubscribeMessage("joinRoom")
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatRoomId: string,
  ) {
    const user = client.data.user;
    const canAccess = await this.chatService.canAccessRoom(user.id, chatRoomId);

    if (!canAccess) {
      client.emit("error", "Unauthorized to join this room");
      return;
    }

    client.join(chatRoomId);
    const chatHistory = await this.chatService.getRoomHistory(chatRoomId);
    client.emit("chatHistory", chatHistory);
  }

  @SubscribeMessage("sendMessage")
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChatMessage,
  ) {
    const user = client.data.user;

    try {
      const message = await this.chatService.createMessage({
        ...data,
        userId: user.id,
      });

      this.server.to(data.chatRoomId).emit("newMessage", {
        ...message,
        user: {
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      this.logger.warn(error);
      client.emit("error", "Failed to send message");
    }
  }

  @SubscribeMessage("closeRoom")
  async handleCloseRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatRoomId: string; summary: string },
  ) {
    const user = client.data.user;

    if (user.role !== UserRole.ADMIN) {
      client.emit("error", "Only admins can close chat rooms");
      return;
    }

    try {
      await this.chatService.closeRoom(data.chatRoomId, data.summary);
      this.server.to(data.chatRoomId).emit("roomClosed", {
        chatRoomId: data.chatRoomId,
        summary: data.summary,
      });
    } catch (error) {
      this.logger.warn(error);
      client.emit("error", "Failed to close room");
    }
  }
}
