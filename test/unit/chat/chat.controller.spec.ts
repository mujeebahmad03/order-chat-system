import { Test, TestingModule } from "@nestjs/testing";
import { ChatController } from "src/modules/chat/chat.controller";
import { ChatService } from "src/modules/chat/chat.service";

describe("ChatController", () => {
  let controller: ChatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [ChatService],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
