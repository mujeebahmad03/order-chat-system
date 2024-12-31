import { Body, Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Request, Response } from "express";

import { AuthService } from "./auth.service";
import { Public } from "./decorators";
import { LoginDto, RegisterDto } from "./dto";
import { JwtAuthGuard } from "./guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register new user" })
  @ApiCreatedResponse({ description: "User successfully registered" })
  @ApiConflictResponse({ description: "User already exists" })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("login")
  @ApiOperation({ summary: "User login" })
  @ApiOkResponse({ description: "User successfully logged in" })
  @ApiUnauthorizedResponse({ description: "Invalid credentials" })
  login(@Body() dto: LoginDto, @Res() res: Response) {
    return this.authService.login(dto, res);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @ApiBearerAuth("accessToken")
  @ApiOperation({ summary: "User logout" })
  @ApiOkResponse({ description: "User successfully logged out" })
  logout(@Res() res: Response) {
    return this.authService.logout(res);
  }

  @Public()
  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token" })
  @ApiOkResponse({ description: "Access token successfully refreshed" })
  @ApiUnauthorizedResponse({ description: "Invalid or expired refresh token" })
  refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    return this.authService.refreshTokens(refreshToken, res);
  }
}
