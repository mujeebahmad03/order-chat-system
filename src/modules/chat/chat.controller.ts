import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

import { ChatService } from "./chat.service";
import { Roles } from "../auth/decorators";
import { GetUser } from "../auth/decorators";
import { JwtAuthGuard, RolesGuard } from "../auth/guard";

@ApiTags("Chat")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("rooms/:orderId")
  @ApiOperation({
    summary: "Get chat room by order ID",
    description:
      "Retrieve the chat room associated with a specific order. The user must be associated with the order or have the appropriate permissions.",
  })
  @ApiParam({
    name: "orderId",
    description: "The unique identifier of the order.",
    type: String,
  })
  @ApiOkResponse({
    description: "Chat room details are returned successfully.",
  })
  @ApiBadRequestResponse({ description: "Invalid order ID provided." })
  @ApiUnauthorizedResponse({ description: "User is not authenticated." })
  @ApiForbiddenResponse({
    description:
      "User does not have sufficient permissions to access the chat room.",
  })
  async getChatRoom(
    @Param("orderId", ParseUUIDPipe) orderId: string,
    @GetUser("id") userId: string,
    @GetUser("role") userRole: UserRole,
  ) {
    const chatRoom = await this.chatService.getRoomByOrderId(
      orderId,
      userId,
      userRole,
    );
    return chatRoom;
  }

  @Post("rooms/:id/close")
  @ApiOperation({
    summary: "Close chat room",
    description:
      "Allows an admin to close a chat room associated with an order. A summary of the chat session can be provided.",
  })
  @ApiParam({
    name: "id",
    description: "The unique identifier of the chat room to close.",
    type: String,
  })
  @ApiOkResponse({
    description: "Chat room is successfully closed.",
  })
  @ApiBadRequestResponse({
    description: "Invalid chat room ID or summary data.",
  })
  @ApiUnauthorizedResponse({ description: "User is not authenticated." })
  @ApiForbiddenResponse({
    description:
      "User does not have sufficient permissions to close the chat room.",
  })
  @Roles(UserRole.ADMIN)
  async closeRoom(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("summary") summary: string,
  ) {
    return this.chatService.closeRoom(id, summary);
  }
}
