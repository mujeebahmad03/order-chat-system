import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "src/app.module";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { OrderStatus, UserRole } from "@prisma/client";
import { CreateOrderDto } from "src/modules/orders/dto";

describe("Orders Integration Tests", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let regularUserToken: string;
  let adminUserToken: string;
  let testOrderId: string;

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
    description: "Test Order",
    specifications: { color: "blue", size: "M" },
    quantity: 5,
    metadata: { priority: "high" },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prismaService = app.get<PrismaService>(PrismaService);

    await app.init();

    // Clean up existing test users
    await prismaService.user.deleteMany({
      where: {
        email: { in: [testUsers.regular.email, testUsers.admin.email] },
      },
    });

    // Register users and manually set their roles
    for (const [key, user] of Object.entries(testUsers)) {
      // Register user first
      await request(app.getHttpServer()).post("/auth/register").send({
        email: user.email,
        password: user.password,
        name: user.name,
      });

      // Manually update the user's role in the database
      await prismaService.user.update({
        where: { email: user.email },
        data: { role: user.role },
      });

      // Login to get token
      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: user.email, password: user.password });

      if (key === "regular") {
        regularUserToken = loginResponse.body.accessToken;
      } else {
        adminUserToken = loginResponse.body.accessToken;
      }
    }
  });

  describe("POST /orders/create", () => {
    it("should create a new order", async () => {
      const response = await request(app.getHttpServer())
        .post("/orders/create")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send(testOrder)
        .expect(201);

      expect(response.body).toMatchObject({
        description: testOrder.description,
        specifications: testOrder.specifications,
        quantity: testOrder.quantity,
        metadata: testOrder.metadata,
        status: OrderStatus.REVIEW,
      });

      testOrderId = response.body.id;
    });

    it("should fail to create order with invalid data", async () => {
      const invalidOrder = { ...testOrder, quantity: 0 };
      await request(app.getHttpServer())
        .post("/orders/create")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send(invalidOrder)
        .expect(400);
    });
  });

  describe("GET /orders", () => {
    it("should get paginated orders for regular user", async () => {
      const response = await request(app.getHttpServer())
        .get("/orders")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty("items");
      expect(response.body).toHaveProperty("meta");
      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 10,
        hasNextPage: expect.any(Boolean),
        hasPreviousPage: expect.any(Boolean),
      });
    });

    it("should get all orders for admin", async () => {
      const response = await request(app.getHttpServer())
        .get("/orders")
        .set("Authorization", `Bearer ${adminUserToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.items.length).toBeGreaterThan(0);
    });
  });

  describe("GET /orders/:id", () => {
    it("should get order by ID", async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/${testOrderId}`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testOrderId,
        description: testOrder.description,
      });
    });

    it("should fail with invalid order ID", async () => {
      await request(app.getHttpServer())
        .get("/orders/invalid-id")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(400);
    });
  });

  describe("PATCH /orders/:id", () => {
    it("should update order details", async () => {
      const updateData = {
        description: "Updated Test Order",
        quantity: 10,
      };

      const response = await request(app.getHttpServer())
        .patch(`/orders/${testOrderId}`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject(updateData);
    });
  });

  describe("PATCH /orders/:id/status", () => {
    it("should allow admin to update order status", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/${testOrderId}/status`)
        .set("Authorization", `Bearer ${adminUserToken}`)
        .send({ status: OrderStatus.PROCESSING })
        .expect(200);

      expect(response.body.status).toBe(OrderStatus.PROCESSING);
    });

    it("should not allow regular user to update order status", async () => {
      await request(app.getHttpServer())
        .patch(`/orders/${testOrderId}/status`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send({ status: OrderStatus.PROCESSING })
        .expect(403);
    });

    it("should validate status transitions", async () => {
      await request(app.getHttpServer())
        .patch(`/orders/${testOrderId}/status`)
        .set("Authorization", `Bearer ${adminUserToken}`)
        .send({ status: OrderStatus.COMPLETED })
        .expect(200);

      // Should not allow transition from COMPLETED to PROCESSING
      await request(app.getHttpServer())
        .patch(`/orders/${testOrderId}/status`)
        .set("Authorization", `Bearer ${adminUserToken}`)
        .send({ status: OrderStatus.PROCESSING })
        .expect(403);
    });
  });

  afterAll(async () => {
    // Clean up
    await prismaService.order.deleteMany({
      where: { id: testOrderId },
    });

    await prismaService.user.deleteMany({
      where: {
        email: { in: [testUsers.regular.email, testUsers.admin.email] },
      },
    });
    await prismaService.$disconnect();
    await app.close();
  });
});
