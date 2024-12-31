import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import { Response } from "express";

import { LoginDto, RegisterDto } from "./dto";
import { Tokens } from "./interfaces";
import { PrismaService } from "../prisma/prisma.service";
import { ExceptionHelperService } from "src/common/exceptions";
import { hashPassword, verifyPassword } from "src/common/helpers";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly exceptionHelper: ExceptionHelperService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(data: RegisterDto) {
    const { email, name, password } = data;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      this.exceptionHelper.throwConflictException(
        "Email is already registered",
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    delete user.password;

    return { message: "User registered successfully", user };
  }

  async login(data: LoginDto, res: Response) {
    const { email, password } = data;

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      this.exceptionHelper.throwUnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await verifyPassword(user.password, password);

    if (!isPasswordValid) {
      this.exceptionHelper.throwUnauthorizedException("Invalid credentials");
    }
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    this.setRefreshTokenCookie(res, refreshToken);

    delete user.password;

    return res.json({ user, accessToken });
  }

  logout(res: Response) {
    res.clearCookie("refreshToken");
    return { message: "Logged out successfully" };
  }

  async refreshTokens(refreshToken: string, res: Response) {
    if (!refreshToken) {
      this.exceptionHelper.throwUnauthorizedException(
        "No refresh token provided",
      );
    }

    // Verify the refresh token
    let payload: { sub: string; email: string; role: UserRole };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });
    } catch (error) {
      this.logger.warn(`Unauthorized access attempt: ${error}`);
      this.exceptionHelper.throwUnauthorizedException(
        "Invalid or expired refresh token",
      );
    }

    // Check if the user still exists
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      this.exceptionHelper.throwUnauthorizedException("User no longer exists");
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(user.id, user.email, user.role);

    // Set the new refresh token in an HTTP-only cookie
    this.setRefreshTokenCookie(res, newRefreshToken);

    return { accessToken };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<Tokens> {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>("JWT_SECRET"),
        expiresIn: this.configService.getOrThrow<string>(
          "JWT_ACCESS_EXPIRATION",
        ),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.configService.getOrThrow<string>(
          "JWT_REFRESH_EXPIRATION",
        ),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  // Set the refresh token in an HTTP-only cookie
  setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>("NODE_ENV") === "production",
      sameSite: "strict",
      maxAge: this.configService.get<number>("JWT_REFRESH_EXPIRATION_MS"),
    });
  }
}
