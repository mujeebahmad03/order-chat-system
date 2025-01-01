export interface ChatMessage {
  content: string;
  userId: string;
  chatRoomId: string;
}

export interface ChatRoomResponse {
  id: string;
  orderId: string;
  isOpen: boolean;
  summary?: string;
  messages: Array<{
    id: string;
    content: string;
    userId: string;
    createdAt: Date;
    user: {
      name: string;
      role: string;
    };
  }>;
}
