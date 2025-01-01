import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { UserRole } from "@prisma/client";

import { AppModule } from "src/app.module";
import { PrismaService } from "src/modules/prisma/prisma.service";

describe("Users Integration Tests", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let regularUserToken: string;
  let adminUserToken: string;
  let regularUserId: string;

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

    // Register and set up test users
    for (const [key, user] of Object.entries(testUsers)) {
      // Register user
      const registerResponse = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: user.email,
          password: user.password,
          name: user.name,
        });

      if (key === "regular") {
        regularUserId = registerResponse.body.user.id;
      }

      // Update role
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

  describe("GET /users", () => {
    it("should allow admin to get all users with pagination", async () => {
      const response = await request(app.getHttpServer())
        .get("/users")
        .set("Authorization", `Bearer ${adminUserToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty("items");
      expect(response.body).toHaveProperty("meta");
      expect(response.body.items).toBeInstanceOf(Array);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.meta).toMatchObject({
        total: expect.any(Number),
        page: 1,
        limit: 10,
        totalPages: expect.any(Number),
      });
    });

    it("should not allow regular user to get all users", async () => {
      await request(app.getHttpServer())
        .get("/users")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(403);
    });
  });

  describe("GET /users/me", () => {
    it("should get current user profile", async () => {
      const response = await request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        email: testUsers.regular.email,
        name: testUsers.regular.name,
        role: UserRole.REGULAR,
      });
      expect(response.body).not.toHaveProperty("password");
    });

    it("should fail without authentication", async () => {
      await request(app.getHttpServer()).get("/users/me").expect(401);
    });
  });

  describe("GET /users/:id", () => {
    it("should allow admin to get user by ID", async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${regularUserId}`)
        .set("Authorization", `Bearer ${adminUserToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: regularUserId,
        email: testUsers.regular.email,
        name: testUsers.regular.name,
      });
      expect(response.body).not.toHaveProperty("password");
    });

    it("should not allow regular user to get other users by ID", async () => {
      await request(app.getHttpServer())
        .get(`/users/${regularUserId}`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it("should return 404 for non-existent user", async () => {
      await request(app.getHttpServer())
        .get("/users/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminUserToken}`)
        .expect(404);
    });
  });

  describe("PATCH /users/update", () => {
    it("should update current user profile", async () => {
      const updateData = {
        name: "Updated Regular User",
      };

      const response = await request(app.getHttpServer())
        .patch("/users/update")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        name: updateData.name,
        email: testUsers.regular.email,
      });
      expect(response.body).not.toHaveProperty("password");
    });

    it("should allow updating to existing email", async () => {
      await request(app.getHttpServer())
        .patch("/users/update")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send({ email: testUsers.regular.email })
        .expect(200);
    });

    it("should fail without authentication", async () => {
      await request(app.getHttpServer())
        .patch("/users/update")
        .send({ name: "Test" })
        .expect(401);
    });
  });

  describe("DELETE /users/:id", () => {
    it("should not allow regular user to delete users", async () => {
      await request(app.getHttpServer())
        .delete(`/users/${regularUserId}`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it("should allow admin to delete users", async () => {
      // Create a user to delete
      const deleteUser = {
        email: "delete@test.com",
        password: "Delete123!@#",
        name: "Delete User",
      };

      const registerResponse = await request(app.getHttpServer())
        .post("/auth/register")
        .send(deleteUser);

      const userToDeleteId = registerResponse.body.user.id;

      await request(app.getHttpServer())
        .delete(`/users/${userToDeleteId}`)
        .set("Authorization", `Bearer ${adminUserToken}`)
        .expect(200);

      // Verify user is deleted
      await request(app.getHttpServer())
        .get(`/users/${userToDeleteId}`)
        .set("Authorization", `Bearer ${adminUserToken}`)
        .expect(404);
    });
  });

  afterAll(async () => {
    // Clean up
    await prismaService.user.deleteMany({
      where: {
        email: { in: [testUsers.regular.email, testUsers.admin.email] },
      },
    });
    await prismaService.$disconnect();
    await app.close();
  });
});
