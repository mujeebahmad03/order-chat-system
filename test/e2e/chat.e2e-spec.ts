import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { io, Socket } from "socket.io-client";
import { AppModule } from "src/app.module";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { UserRole, OrderStatus } from "@prisma/client";
import { CreateOrderDto } from "src/modules/orders/dto";

describe("Chat Integration Tests", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let regularUserToken: string;
  let adminUserToken: string;
  let regularUserSocket: Socket;
  let adminUserSocket: Socket;
  let testOrderId: string;
  let testChatRoomId: string;

  const testUsers = {
    regular: {
      email: "regular@test.com",
      password: "Test123!@#",
      name: "Regular User",
      role: UserRole.REGULAR,
    },
    admin: {
      email: "admin@test.com",
      password: "Admin123!@#",
      name: "Admin User",
      role: UserRole.ADMIN,
    },
  };

  const testOrder: CreateOrderDto = {
    description: "Test Order for Chat",
    specifications: { type: "test" },
    quantity: 10,
    metadata: { priority: "high" },
  };

  const otherTestUser = {
    email: "other@test.com",
    password: "Other123!@#",
    name: "Other User",
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prismaService = app.get<PrismaService>(PrismaService);

    await app.init();
    await app.listen(0); // Random port for testing

    // Clean up existing test data
    await prismaService.user.deleteMany({
      where: {
        email: { in: [testUsers.regular.email, testUsers.admin.email] },
      },
    });

    // Set up test users and get tokens
    for (const [key, user] of Object.entries(testUsers)) {
      await request(app.getHttpServer()).post("/auth/register").send({
        email: user.email,
        password: user.password,
        name: user.name,
      });

      await prismaService.user.update({
        where: { email: user.email },
        data: { role: user.role },
      });

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      if (key === "regular") {
        regularUserToken = loginResponse.body.accessToken;
      } else {
        adminUserToken = loginResponse.body.accessToken;
      }
    }

    // Create test order
    const orderResponse = await request(app.getHttpServer())
      .post("/orders/create")
      .set("Authorization", `Bearer ${regularUserToken}`)
      .send(testOrder);

    testOrderId = orderResponse.body.id;
  });

  describe("HTTP Endpoints", () => {
    describe("GET /chat/rooms/:orderId", () => {
      it("should create and return chat room for valid order", async () => {
        const response = await request(app.getHttpServer())
          .get(`/chat/rooms/${testOrderId}`)
          .set("Authorization", `Bearer ${regularUserToken}`)
          .expect(200);

        expect(response.body).toHaveProperty("id");
        expect(response.body).toHaveProperty("orderId", testOrderId);
        expect(response.body).toHaveProperty("isOpen", true);
        expect(response.body).toHaveProperty("messages");

        testChatRoomId = response.body.id;
      });

      it("should allow admin to access any chat room", async () => {
        await request(app.getHttpServer())
          .get(`/chat/rooms/${testOrderId}`)
          .set("Authorization", `Bearer ${adminUserToken}`)
          .expect(200);
      });

      it("should forbid access to other user's chat room", async () => {
        // Create another user and try to access the chat room
        await request(app.getHttpServer()).post("/auth/register").send({
          email: otherTestUser.email,
          password: otherTestUser.password,
          name: otherTestUser.name,
        });

        const otherUserToken = (
          await request(app.getHttpServer()).post("/auth/login").send({
            email: otherTestUser.email,
            password: otherTestUser.password,
          })
        ).body.accessToken;

        await request(app.getHttpServer())
          .get(`/chat/rooms/${testOrderId}`)
          .set("Authorization", `Bearer ${otherUserToken}`)
          .expect(403);
      });
    });

    describe("POST /chat/rooms/:id/close", () => {
      it("should forbid regular user from closing chat room", async () => {
        await request(app.getHttpServer())
          .post(`/chat/rooms/${testChatRoomId}/close`)
          .set("Authorization", `Bearer ${regularUserToken}`)
          .send({ summary: "Test summary" })
          .expect(403);
      });

      it("should allow admin to close chat room", async () => {
        const response = await request(app.getHttpServer())
          .post(`/chat/rooms/${testChatRoomId}/close`)
          .set("Authorization", `Bearer ${adminUserToken}`)
          .send({ summary: "Test summary" })
          .expect(200);

        expect(response.body[0]).toHaveProperty("isOpen", false);
        expect(response.body[0]).toHaveProperty("summary", "Test summary");
        expect(response.body[1]).toHaveProperty(
          "status",
          OrderStatus.PROCESSING,
        );
      });
    });
  });

  describe("WebSocket Features", () => {
    beforeEach(async () => {
      // Create new chat room for each test
      const orderResponse = await request(app.getHttpServer())
        .post("/orders/create")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send(testOrder);

      const chatResponse = await request(app.getHttpServer())
        .get(`/chat/rooms/${orderResponse.body.id}`)
        .set("Authorization", `Bearer ${regularUserToken}`);

      testChatRoomId = chatResponse.body.id;

      // Connect WebSocket clients
      const port = app.getHttpServer().address().port;
      regularUserSocket = io(`http://localhost:${port}`, {
        extraHeaders: {
          Authorization: `Bearer ${regularUserToken}`,
        },
      });
      adminUserSocket = io(`http://localhost:${port}`, {
        extraHeaders: {
          Authorization: `Bearer ${adminUserToken}`,
        },
      });

      // Wait for connections to establish
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Add a small delay
    });

    afterEach(() => {
      regularUserSocket.close();
      adminUserSocket.close();
    });

    it("should handle joining chat room and receive chat history", (done) => {
      regularUserSocket.emit("joinRoom", testChatRoomId);

      regularUserSocket.on("chatHistory", (history) => {
        expect(history).toHaveProperty("id", testChatRoomId);
        expect(history).toHaveProperty("messages");
        done();
      });
    }, 10000); // Increase timeout to 10 seconds

    it("should handle sending and receiving messages", (done) => {
      const testMessage = {
        content: "Test message",
        chatRoomId: testChatRoomId,
      };

      regularUserSocket.emit("joinRoom", testChatRoomId);
      adminUserSocket.emit("joinRoom", testChatRoomId);

      regularUserSocket.emit("sendMessage", testMessage);

      adminUserSocket.on("newMessage", (message) => {
        expect(message).toHaveProperty("content", testMessage.content);
        expect(message).toHaveProperty("user");
        expect(message.user).toHaveProperty("name", testUsers.regular.name);
        done();
      });
    }, 10000); // Increase timeout to 10 seconds

    it("should handle room closure via WebSocket", (done) => {
      adminUserSocket.emit("joinRoom", testChatRoomId);
      regularUserSocket.emit("joinRoom", testChatRoomId);

      adminUserSocket.emit("closeRoom", {
        chatRoomId: testChatRoomId,
        summary: "Closing via WebSocket",
      });

      regularUserSocket.on("roomClosed", (data) => {
        expect(data).toHaveProperty("chatRoomId", testChatRoomId);
        expect(data).toHaveProperty("summary", "Closing via WebSocket");
        done();
      });
    }, 10000); // Increase timeout to 10 seconds

    it("should prevent regular users from closing rooms", (done) => {
      regularUserSocket.emit("closeRoom", {
        chatRoomId: testChatRoomId,
        summary: "Unauthorized closure attempt",
      });

      regularUserSocket.on("error", (error) => {
        expect(error).toBe("Only admins can close chat rooms");
        done();
      });
    }, 10000); // Increase timeout to 10 seconds
  });

  afterAll(async () => {
    // Clean up
    await prismaService.user.deleteMany({
      where: {
        email: {
          in: [
            testUsers.regular.email,
            testUsers.admin.email,
            otherTestUser.email,
          ],
        },
      },
    });

    await prismaService.$disconnect();
    await app.close();
  });
});
