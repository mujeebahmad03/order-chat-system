import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { OrderStatus, UserRole } from "@prisma/client";

import { ChatMessage, ChatRoomResponse } from "./interfaces";
import { PrismaService } from "../prisma/prisma.service";
import { ExceptionHelperService } from "src/common/exceptions";

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly exceptionHelper: ExceptionHelperService,
  ) {}

  async verifyToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, role: true },
      });
    } catch (error) {
      throw error;
    }
  }

  async canAccessRoom(userId: string, chatRoomId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { orders: { include: { chatRoom: true } } },
    });

    if (user.role === UserRole.ADMIN) return true;

    return user.orders.some((order) => order.chatRoom?.id === chatRoomId);
  }

  async getRoomHistory(chatRoomId: string): Promise<ChatRoomResponse> {
    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: {
        messages: {
          include: {
            user: { select: { name: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chatRoom) {
      this.exceptionHelper.throwNotFoundException("Chat room not found");
    }

    return chatRoom;
  }

  async createMessage(data: ChatMessage) {
    const { chatRoomId, ...rest } = data;
    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
    });

    if (!chatRoom) {
      this.exceptionHelper.throwNotFoundException("Chat room not found");
    }

    if (!chatRoom.isOpen) {
      this.exceptionHelper.throwBadRequestException("Chat room is closed");
    }

    return this.prisma.message.create({
      data: { ...rest, chatRoomId },
      include: {
        user: { select: { name: true, role: true } },
      },
    });
  }

  async closeRoom(chatRoomId: string, summary: string) {
    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: { order: true },
    });

    if (!chatRoom) {
      this.exceptionHelper.throwNotFoundException("Chat room not found");
    }

    if (!chatRoom.isOpen) {
      this.exceptionHelper.throwBadRequestException(
        "Chat room is already closed",
      );
    }

    // Update chat room and order status in a transaction
    return this.prisma.$transaction([
      this.prisma.chatRoom.update({
        where: { id: chatRoomId },
        data: {
          isOpen: false,
          summary,
          closedAt: new Date(),
        },
      }),
      this.prisma.order.update({
        where: { id: chatRoom.order.id },
        data: { status: OrderStatus.PROCESSING },
      }),
    ]);
  }

  async getRoomByOrderId(orderId: string, userId: string, userRole: UserRole) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        chatRoom: {
          include: {
            messages: {
              include: {
                user: {
                  select: {
                    name: true,
                    role: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    });

    if (!order) {
      this.exceptionHelper.throwNotFoundException("Order not found");
    }

    if (userRole !== UserRole.ADMIN && order.userId !== userId) {
      this.exceptionHelper.throwForbiddenException(
        "You do not have permission to access this chat room",
      );
    }

    if (!order.chatRoom) {
      this.exceptionHelper.throwNotFoundException("Chat room not found");
    }

    return order.chatRoom;
  }
}
