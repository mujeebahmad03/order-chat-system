import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import * as compression from "compression";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module";
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
  PrismaExceptionFilter,
  ValidationExceptionFilter,
} from "./common/filters";
import {
  TransformInterceptor,
  TimeoutInterceptor,
} from "./common/interceptors";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const httpAdapterHost = app.get(HttpAdapterHost);

  // Security Headers
  app.use(helmet());

  // Compression
  app.use(compression());

  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: configService.get("CORS_ORIGINS", "*"),
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  // Setup Pino logger
  app.useLogger(app.get(Logger));

  // Global Exception Filters
  app.useGlobalFilters(
    new AllExceptionsFilter(httpAdapterHost),
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(),
    new ValidationExceptionFilter(),
  );

  // Global Response Interceptor
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new TimeoutInterceptor(),
  );

  // Enable Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        // This will be caught by ValidationExceptionFilter
        return errors;
      },
    }),
  );

  // Global API prefix
  app.setGlobalPrefix("api/v1");

  // Swagger Setup (only in non-production)
  if (configService.get("NODE_ENV") !== "production") {
    const config = new DocumentBuilder()
      .setTitle(configService.get("APPLICATION_NAME", "Order Management API"))
      .setDescription(
        configService.get(
          "SWAGGER_DESCRIPTION",
          "API documentation for Order Management System",
        ),
      )
      .setVersion(configService.get("SWAGGER_VERSION", "1.0"))
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "JWT",
          description: "Enter JWT token",
          in: "header",
        },
        "accessToken", // This name is used as the key for the Bearer token
      )

      .addTag("Orders", "Order management endpoints")
      .addTag("Chat", "Real-time chat functionality")
      .addTag("Users", "User management")
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // Add custom response examples to Swagger
    SwaggerModule.setup("docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: "alpha",
        operationsSorter: "alpha",
      },
    });
  }

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    }),
  );

  const port = configService.get("PORT", 8000);

  await app.listen(port);

  console.log(`
    🚀 Application is running on: http://localhost:${port}
    📝 API Documentation: http://localhost:${port}/docs
      `);
}

bootstrap().catch((error) => {
  console.error("Failed to start application:", error);
  process.exit(1);
});
