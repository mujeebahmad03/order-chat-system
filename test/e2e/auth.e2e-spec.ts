import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { AuthModule } from "src/modules/auth/auth.module";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { LoginDto, RegisterDto } from "src/modules/auth/dto";
import { PrismaModule } from "src/modules";

describe("Auth Integration Tests", () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "StrongP@ssw0rd",
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, PrismaModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = app.get<PrismaService>(PrismaService);

    // Apply global pipes and middleware
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();
  });

  beforeEach(async () => {
    // Clean up the database before each test
    await prismaService.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(testUser as RegisterDto)
        .expect(201);

      expect(response.body).toHaveProperty(
        "message",
        "User registered successfully",
      );
      expect(response.body.user).toHaveProperty("email", testUser.email);
      expect(response.body.user).toHaveProperty("name", testUser.name);
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should fail when registering with existing email", async () => {
      // First registration
      await request(app.getHttpServer())
        .post("/auth/register")
        .send(testUser)
        .expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty(
        "message",
        "Email is already registered",
      );
    });

    describe("should fail with invalid password format", () => {
      const passwordValidationCases = [
        {
          password: "weak", // Missing uppercase, number, and special character
          expectedMessage: [
            "Password must contain at least one uppercase letter, one number, one special character.",
            "Password must be at least 8 characters long",
          ],
        },
        {
          password: "WeakPassword", // Missing number and special character
          expectedMessage: [
            "Password must contain at least one number, one special character.",
          ],
        },
        {
          password: "WeakPassword1", // Missing special character
          expectedMessage: [
            "Password must contain at least one special character.",
          ],
        },
        {
          password: "password123!", // Missing uppercase letter
          expectedMessage: [
            "Password must contain at least one uppercase letter.",
          ],
        },
      ];

      passwordValidationCases.forEach(({ password, expectedMessage }) => {
        it(`should fail with password: "${password}"`, async () => {
          const response = await request(app.getHttpServer())
            .post("/auth/register")
            .send({ ...testUser, password })
            .expect(400);

          expect(response.body).toHaveProperty("statusCode", 400);
          expect(response.body).toHaveProperty("error", "Bad Request");
          expect(response.body).toHaveProperty("message");
          expect(response.body.message).toEqual(
            expect.arrayContaining(expectedMessage),
          );
        });
      });
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      // Register a user before testing login
      await request(app.getHttpServer()).post("/auth/register").send(testUser);
    });

    it("should login successfully and return tokens", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        } as LoginDto)
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("user");
      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"][0]).toContain("refreshToken");
    });

    it("should fail with invalid credentials", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body).toHaveProperty("message", "Invalid credentials");
    });
  });

  describe("POST /auth/refresh", () => {
    let refreshTokenCookie: string;

    beforeEach(async () => {
      // Register and login to get the refresh token
      await request(app.getHttpServer()).post("/auth/register").send(testUser);

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      refreshTokenCookie = loginResponse.headers["set-cookie"][0];
    });

    it("should refresh tokens successfully", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/refresh")
        .set("Cookie", refreshTokenCookie)
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"][0]).toContain("refreshToken");
    });

    it("should fail without refresh token", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/refresh")
        .expect(401);

      expect(response.body).toHaveProperty(
        "message",
        "No refresh token provided",
      );
    });
  });

  describe("POST /auth/logout", () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get the access token
      await request(app.getHttpServer()).post("/auth/register").send(testUser);

      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      accessToken = loginResponse.body.accessToken;
    });

    it("should logout successfully", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Logged out successfully",
      );
      expect(response.headers["set-cookie"][0]).toContain("refreshToken=;");
    });

    it("should fail without authentication", async () => {
      await request(app.getHttpServer()).post("/auth/logout").expect(401);
    });
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({
      where: { email: testUser.email },
    });
    await prismaService.$disconnect();
    await app.close();
  });
});
