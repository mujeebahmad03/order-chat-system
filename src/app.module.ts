import { CacheModule } from "@nestjs/cache-manager";
import { MiddlewareConsumer, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import {
  AuthModule,
  ChatModule,
  OrdersModule,
  PrismaModule,
  UsersModule,
} from "./modules";
import { ExceptionHelperModule } from "./common/exceptions";
import { LoggerMiddleware } from "./common/middleware";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load environment variables
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 60, // 1 hour
      max: 100, // maximum number of items in cache
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level:
            configService.get<string>("NODE_ENV") === "production"
              ? "info"
              : "debug",
          transport:
            configService.get<string>("NODE_ENV") !== "production"
              ? { target: "pino-pretty", options: { colorize: true } }
              : undefined,
        },
      }),

      inject: [ConfigService], // Inject ConfigService for dynamic configuration
    }),
    ExceptionHelperModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    ChatModule,
    PrismaModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
