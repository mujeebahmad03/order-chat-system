import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { Cache } from "cache-manager";

import { JwtPayload, SocketIORequest } from "../interfaces";
import { PrismaService } from "src/modules/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: SocketIORequest) => {
          if (request && request.headers && request.headers.authorization) {
            console.log("Extracting token from HTTP headers");
            return request.headers.authorization.replace("Bearer ", "");
          }
          if (
            request &&
            request.handshake &&
            request.handshake.headers.authorization
          ) {
            console.log("Extracting token from WebSocket handshake headers");
            return request.handshake.headers.authorization.replace(
              "Bearer ",
              "",
            );
          }
          console.error("No token found in headers or handshake");
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
    });
  }

  async validate(payload: JwtPayload) {
    const cacheKey = `user:${payload.sub}`;
    const userCacheTTL =
      this.configService.get<number>("CACHE_TTL_USER") || 3600000; // Default to 1 hour if not set

    let user = await this.cacheManager.get(cacheKey);

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true },
      });

      if (!user) {
        this.logger.warn(`User not found for ID: ${payload.sub}`);
        throw new UnauthorizedException("User no longer exists");
      }

      await this.cacheManager.set(cacheKey, user, userCacheTTL);
    }

    return user;
  }
}
