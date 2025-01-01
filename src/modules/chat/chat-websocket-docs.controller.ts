import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("WebSocket Events")
@Controller("websocket-docs")
export class ChatWebSocketDocsController {
  @Get("events")
  @ApiOperation({
    summary: "WebSocket Events Documentation",
    description:
      "Lists all WebSocket events for the ChatGateway and their payloads.",
  })
  getEvents() {
    return {
      events: [
        {
          event: "joinRoom",
          description: "Join a chat room by its ID.",
          payload: { chatRoomId: "string" },
          response: { chatHistory: "Array of previous chat messages" },
        },
        {
          event: "sendMessage",
          description: "Send a message to a specific chat room.",
          payload: { chatRoomId: "string", message: "string" },
          response: {
            newMessage: {
              id: "string",
              message: "string",
              user: { name: "string", role: "UserRole" },
            },
          },
        },
        {
          event: "closeRoom",
          description: "Close a chat room (Admin only).",
          payload: { chatRoomId: "string", summary: "string" },
          response: {
            roomClosed: { chatRoomId: "string", summary: "string" },
          },
        },
      ],
    };
  }
}
