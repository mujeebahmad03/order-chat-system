import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as compression from "compression";
import helmet from "helmet";
import { Logger } from "nestjs-pino";

import { AppModule } from "./app.module";
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
  PrismaExceptionFilter,
  ValidationExceptionFilter,
} from "./common/filters";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const httpAdapterHost = app.get(HttpAdapterHost);

  // Security Headers
  app.use(helmet());

  // Compression
  app.use(compression());

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

  // Enable Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
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
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);
  }

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
